// ---------------------------------------------------------------------------
// Audio / Sonos Integration -- Music and Ambient Sound Controller
// ---------------------------------------------------------------------------
// Builds Spotify search queries, provides ambient sound URLs, and generates
// playlist recommendations from AtmosphereProfile data. Actual Sonos and
// Spotify API calls require user OAuth tokens.
// ---------------------------------------------------------------------------

import type { AtmosphereResult } from "@/lib/synesthesia/types";

export interface PlaylistRecommendation {
  name: string;
  description: string;
  searchQuery: string;
  tracks: TrackSuggestion[];
  ambientLayer: AmbientLayerInfo | null;
  totalDurationMinutes: number;
}

export interface TrackSuggestion {
  searchQuery: string;
  reason: string;
}

export interface AmbientLayerInfo {
  layer: AmbientLayer;
  url: string;
  volume: number; // 0-1
  description: string;
}

export type AmbientLayer =
  | "rain"
  | "fireplace"
  | "waves"
  | "wind"
  | "birds"
  | "city"
  | "thunder"
  | "cafe"
  | "forest"
  | "white_noise";

// Free ambient sound sources (royalty-free / Creative Commons)
const AMBIENT_SOUND_URLS: Record<AmbientLayer, string> = {
  rain: "https://freesound.org/search/?q=rain+ambient+loop&f=license:%22Creative+Commons+0%22",
  fireplace: "https://freesound.org/search/?q=fireplace+crackling+loop&f=license:%22Creative+Commons+0%22",
  waves: "https://freesound.org/search/?q=ocean+waves+loop&f=license:%22Creative+Commons+0%22",
  wind: "https://freesound.org/search/?q=wind+ambient+loop&f=license:%22Creative+Commons+0%22",
  birds: "https://freesound.org/search/?q=birds+singing+forest&f=license:%22Creative+Commons+0%22",
  city: "https://freesound.org/search/?q=city+ambient+traffic&f=license:%22Creative+Commons+0%22",
  thunder: "https://freesound.org/search/?q=thunderstorm+rain+loop&f=license:%22Creative+Commons+0%22",
  cafe: "https://freesound.org/search/?q=cafe+ambient+chatter&f=license:%22Creative+Commons+0%22",
  forest: "https://freesound.org/search/?q=forest+ambient+nature&f=license:%22Creative+Commons+0%22",
  white_noise: "https://freesound.org/search/?q=white+noise+loop&f=license:%22Creative+Commons+0%22",
};

// Genre-to-Spotify-search mappings for building effective queries
const GENRE_SEARCH_MODIFIERS: Record<string, string[]> = {
  jazz: ["jazz", "smooth jazz", "jazz trio", "bebop"],
  "lo-fi": ["lo-fi", "lofi beats", "chillhop", "lo-fi hip hop"],
  ambient: ["ambient", "ambient electronic", "ambient music", "drone ambient"],
  classical: ["classical", "classical piano", "orchestral", "chamber music"],
  electronic: ["electronic", "synth", "electronica", "downtempo"],
  bossa_nova: ["bossa nova", "brazilian jazz", "tropicalia"],
  indie: ["indie", "indie folk", "indie rock", "indie pop"],
  soul: ["soul", "neo soul", "r&b soul", "motown"],
  world: ["world music", "ethnic", "global beats"],
  blues: ["blues", "delta blues", "blues guitar", "electric blues"],
  folk: ["folk", "acoustic folk", "folk guitar", "traditional folk"],
  cinematic: ["film score", "cinematic", "soundtrack", "epic orchestral"],
  new_age: ["new age", "meditation music", "healing", "spa music"],
  reggae: ["reggae", "dub", "roots reggae", "ska"],
  rock: ["rock", "classic rock", "alternative rock"],
  pop: ["pop", "synth pop", "dream pop", "art pop"],
};

const MOOD_SEARCH_MODIFIERS: Record<string, string[]> = {
  relaxed: ["chill", "relaxing", "calm", "peaceful"],
  energetic: ["upbeat", "energetic", "lively", "pumping"],
  melancholic: ["melancholic", "sad", "moody", "somber"],
  romantic: ["romantic", "love", "sensual", "intimate"],
  mysterious: ["mysterious", "dark", "enigmatic", "haunting"],
  joyful: ["happy", "joyful", "uplifting", "bright"],
  intense: ["intense", "powerful", "dramatic", "epic"],
  dreamy: ["dreamy", "ethereal", "floating", "spacey"],
  cozy: ["cozy", "warm", "comfortable", "soft"],
  adventurous: ["adventure", "exploration", "journey", "epic"],
  nostalgic: ["nostalgic", "retro", "vintage", "throwback"],
  dark: ["dark", "gothic", "noir", "brooding"],
  serene: ["serene", "tranquil", "gentle", "still"],
  playful: ["playful", "fun", "quirky", "whimsical"],
};

export class AudioController {
  generateSpotifySearchQuery(
    genre: string,
    mood: string,
    bpmRange?: { min: number; max: number }
  ): string {
    const genreKey = genre.toLowerCase().replace(/[\s-]+/g, "_");
    const moodKey = mood.toLowerCase().replace(/[\s-]+/g, "_");

    const genreTerms = GENRE_SEARCH_MODIFIERS[genreKey] || [genre];
    const moodTerms = MOOD_SEARCH_MODIFIERS[moodKey] || [mood];

    // Pick the most specific genre and mood terms
    const genreTerm = genreTerms[0];
    const moodTerm = moodTerms[0];

    let query = `${moodTerm} ${genreTerm}`;

    // Add BPM hint if available (Spotify doesn't directly support BPM search,
    // but adding tempo descriptors helps)
    if (bpmRange) {
      const avgBpm = (bpmRange.min + bpmRange.max) / 2;
      if (avgBpm < 80) {
        query += " slow tempo";
      } else if (avgBpm < 110) {
        query += " medium tempo";
      } else if (avgBpm < 140) {
        query += " upbeat";
      } else {
        query += " fast tempo";
      }
    }

    return query;
  }

  getAmbientSoundUrl(layer: AmbientLayer): string {
    return AMBIENT_SOUND_URLS[layer];
  }

  getAmbientLayerDescription(layer: AmbientLayer): string {
    const descriptions: Record<AmbientLayer, string> = {
      rain: "Gentle rainfall with occasional distant drops",
      fireplace: "Warm crackling fire with soft wood pops",
      waves: "Rolling ocean waves on a sandy shore",
      wind: "Soft breeze rustling through open spaces",
      birds: "Cheerful birdsong in a morning garden",
      city: "Urban ambience with distant traffic and movement",
      thunder: "Distant thunderstorm with rain and rumbles",
      cafe: "Cozy cafe chatter with soft clinking sounds",
      forest: "Deep woodland with rustling leaves and birdsong",
      white_noise: "Consistent broadband noise for focus",
    };
    return descriptions[layer];
  }

  buildPlaylist(atmosphere: AtmosphereResult): PlaylistRecommendation {
    const { sound } = atmosphere.profile;
    const avgBpm = sound.bpm_range
      ? Math.round((sound.bpm_range[0] + sound.bpm_range[1]) / 2)
      : undefined;
    const searchQuery = this.generateSpotifySearchQuery(
      sound.genre,
      sound.mood,
      avgBpm ? { min: avgBpm - 10, max: avgBpm + 10 } : undefined
    );

    // Generate track suggestions based on genre, mood, and context
    const tracks = this.generateTrackSuggestions(sound.genre, sound.mood, avgBpm);

    // Build ambient layer info if present
    let ambientLayerInfo: AmbientLayerInfo | null = null;
    if (sound.ambient_layer) {
      const layer = sound.ambient_layer as AmbientLayer;
      ambientLayerInfo = {
        layer,
        url: this.getAmbientSoundUrl(layer),
        volume: (sound.ambient_volume ?? 30) / 100,
        description: this.getAmbientLayerDescription(layer),
      };
    }

    const playlistName = `${atmosphere.name || "Atmosphere"} -- ${sound.mood} ${sound.genre}`;

    return {
      name: playlistName,
      description: `A curated playlist for a ${sound.mood} ${sound.genre} atmosphere at ${avgBpm || "varied"} BPM`,
      searchQuery,
      tracks,
      ambientLayer: ambientLayerInfo,
      totalDurationMinutes: 60,
    };
  }

  private generateTrackSuggestions(
    genre: string,
    mood: string,
    bpm?: number
  ): TrackSuggestion[] {
    const suggestions: TrackSuggestion[] = [];

    // Genre-specific track searches
    const genreKey = genre.toLowerCase().replace(/[\s-]+/g, "_");
    const moodKey = mood.toLowerCase().replace(/[\s-]+/g, "_");

    const genreTerms = GENRE_SEARCH_MODIFIERS[genreKey] || [genre];
    const moodTerms = MOOD_SEARCH_MODIFIERS[moodKey] || [mood];

    // Main genre + mood combination
    suggestions.push({
      searchQuery: `${moodTerms[0]} ${genreTerms[0]}`,
      reason: `Core ${genre} track matching the ${mood} mood`,
    });

    // Instrumental variant
    suggestions.push({
      searchQuery: `${genreTerms[0]} instrumental ${moodTerms[0]}`,
      reason: "Instrumental variant for background listening",
    });

    // Cross-genre exploration
    if (genreTerms.length > 1) {
      suggestions.push({
        searchQuery: `${moodTerms[0]} ${genreTerms[1]}`,
        reason: `Sub-genre variation within ${genre}`,
      });
    }

    // BPM-aligned suggestion
    if (bpm) {
      const tempoDesc = bpm < 80 ? "slow" : bpm < 110 ? "mid-tempo" : bpm < 140 ? "groovy" : "fast";
      suggestions.push({
        searchQuery: `${tempoDesc} ${genreTerms[0]}`,
        reason: `Tempo-matched track around ${bpm} BPM`,
      });
    }

    // Mood-focused search across genres
    if (moodTerms.length > 1) {
      suggestions.push({
        searchQuery: `${moodTerms[1]} playlist`,
        reason: `Mood-focused discovery: ${mood}`,
      });
    }

    return suggestions;
  }

  // Build a Sonos playback command structure (would be sent via Sonos HTTP API)
  buildSonosPlayCommand(
    spotifyUri: string,
    volume: number = 30
  ): { endpoint: string; body: Record<string, unknown> } {
    return {
      endpoint: "/MediaRenderer/AVTransport/Control",
      body: {
        InstanceID: 0,
        CurrentURI: spotifyUri,
        CurrentURIMetaData: "",
        DesiredVolume: Math.max(0, Math.min(100, volume)),
      },
    };
  }

  buildSonosVolumeCommand(
    volume: number
  ): { endpoint: string; body: Record<string, unknown> } {
    return {
      endpoint: "/MediaRenderer/RenderingControl/Control",
      body: {
        InstanceID: 0,
        Channel: "Master",
        DesiredVolume: Math.max(0, Math.min(100, volume)),
      },
    };
  }
}
