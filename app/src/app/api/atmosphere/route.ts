import { NextRequest, NextResponse } from "next/server";
import {
  findDemoAtmosphere,
  generateKeywordAtmosphere,
} from "@/lib/synesthesia/types";
import type {
  AtmosphereResult,
  AtmosphereResponse,
} from "@/lib/synesthesia/types";

// ---------------------------------------------------------------------------
// System prompt for Claude to generate atmosphere profiles
// ---------------------------------------------------------------------------

const ATMOSPHERE_SYSTEM_PROMPT = `You are an expert in environmental design, interior atmosphere, lighting design, music curation, color psychology, and multi-sensory experience creation. Your role is to take a text prompt describing a place, mood, or scene and generate a complete smart-home atmosphere profile.

You have deep knowledge of:
- COLOR PSYCHOLOGY: How colors affect mood and perception. Warm colors (reds, oranges, yellows) create intimacy and energy. Cool colors (blues, greens, purples) create calm and space. Color temperature in Kelvin affects perceived warmth (2000K = candlelight, 3000K = warm white, 4000K = neutral, 5000K+ = daylight/cool).
- LIGHTING DESIGN: How brightness, color temperature, and animation patterns create atmosphere. Dim lighting (10-30%) for intimate/moody spaces. Medium (40-60%) for comfortable social spaces. Bright (70-100%) for energetic/outdoor feels.
- MUSIC AND SOUND: Genre associations (jazz = sophistication/night, ambient = calm/space, lo-fi = cozy/study, classical = refinement/contemplation, electronic = energy/futurism, reggae = tropical/laid-back, folk = earthy/nostalgic). BPM affects energy (60-80 = relaxed, 80-110 = moderate, 110-140 = energetic, 140+ = intense).
- AMBIENT SOUNDSCAPES: How layered environmental sounds create immersion. Available layers: rain, fireplace, waves, wind, birds, city, thunder, cafe, forest, white_noise.
- TEMPERATURE PSYCHOLOGY: How temperature affects comfort and mood. Warm environments (72-76F) for cozy/tropical. Cool environments (66-69F) for alert/crisp. Neutral (70-71F) for balanced comfort.

RULES:
1. Every atmosphere must feel internally consistent -- lighting, sound, temperature, and visual description should tell the same story.
2. Be specific with hex colors, not generic. Use the right hue, saturation, and brightness for the mood.
3. BPM ranges should be realistic for the chosen genre.
4. Temperature changes should be subtle and purposeful.
5. If evolution is requested, create 2-4 phases that tell a story over time (how the space transforms).
6. Animation types available: "static", "breathe" (slow pulse), "candle" (warm flicker), "aurora" (color cycling), "storm" (dark with flashes), "sunset" (gradual warm-to-cool transition).
7. Speed is 0-100 where lower is slower/subtler.

OUTPUT FORMAT:
Respond with ONLY valid JSON matching this structure. No text before or after.

{
  "name": "Evocative name for the atmosphere",
  "description": "2-3 sentence poetic description of the space and feeling",
  "lighting": {
    "color_hex": "#HEXCODE",
    "brightness": 0-100,
    "temperature_kelvin": 2000-6500,
    "animation": "static|breathe|candle|aurora|storm|sunset",
    "speed": 0-100,
    "secondary_colors": ["#HEX1", "#HEX2"]
  },
  "sound": {
    "genre": "genre name",
    "mood": "mood descriptor",
    "bpm_range": [min, max],
    "volume": 0-100,
    "ambient_layer": "rain|fireplace|waves|wind|birds|city|thunder|cafe|forest|white_noise",
    "ambient_volume": 0-100,
    "spotify_search_query": "optimized search query for finding matching music",
    "playlist_name": "suggested playlist name"
  },
  "temperature": {
    "target_f": number,
    "target_c": number,
    "change_direction": "warmer|cooler|neutral",
    "description": "brief description of temperature intention"
  },
  "visual": {
    "scene_description": "Detailed visual description of the space (3-4 sentences)",
    "color_palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],
    "animation_style": "description of how the visual atmosphere moves/changes"
  },
  "mood": ["mood1", "mood2", "mood3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "evolution": null OR {
    "phases": [
      {
        "name": "Phase Name",
        "duration_minutes": number,
        "lighting": { partial lighting overrides },
        "sound": { partial sound overrides },
        "temperature": { partial temperature overrides },
        "description": "What happens in this phase"
      }
    ]
  }
}`;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { prompt, devices, evolution } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty prompt string is required." },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();

    // --- API mode: call Claude ---
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const userMessage = evolution
          ? `Create an atmosphere for: "${trimmedPrompt}"\n\nInclude a time evolution with 2-4 phases showing how the space transforms over time.`
          : `Create an atmosphere for: "${trimmedPrompt}"\n\nSet evolution to null (no time evolution needed).`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: ATMOSPHERE_SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: userMessage,
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Claude API error:", response.status, errorText);
          // Fall through to demo mode
        } else {
          const data = await response.json();
          const content = data.content?.[0]?.text;

          if (content) {
            const parsed = JSON.parse(content);

            const atmosphereResult: AtmosphereResult = {
              id: `atm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              name: parsed.name || "Generated Atmosphere",
              prompt: trimmedPrompt,
              description: parsed.description || "",
              profile: {
                lighting: {
                  color_hex: parsed.lighting?.color_hex || "#E8B87D",
                  brightness: parsed.lighting?.brightness ?? 50,
                  temperature_kelvin: parsed.lighting?.temperature_kelvin ?? 3000,
                  animation: parsed.lighting?.animation || "breathe",
                  speed: parsed.lighting?.speed ?? 30,
                  secondary_colors: parsed.lighting?.secondary_colors || [],
                },
                sound: {
                  genre: parsed.sound?.genre || "ambient",
                  mood: parsed.sound?.mood || "relaxed",
                  bpm_range: parsed.sound?.bpm_range || [70, 90],
                  volume: parsed.sound?.volume ?? 40,
                  ambient_layer: parsed.sound?.ambient_layer || "white_noise",
                  ambient_volume: parsed.sound?.ambient_volume ?? 20,
                  spotify_search_query: parsed.sound?.spotify_search_query,
                  playlist_name: parsed.sound?.playlist_name,
                },
                temperature: {
                  target_f: parsed.temperature?.target_f ?? 70,
                  target_c: parsed.temperature?.target_c ??
                    Math.round(((parsed.temperature?.target_f ?? 70) - 32) * 5 / 9 * 10) / 10,
                  change_direction: parsed.temperature?.change_direction || "neutral",
                  description: parsed.temperature?.description,
                },
                visual: {
                  scene_description: parsed.visual?.scene_description || parsed.description || "",
                  color_palette: parsed.visual?.color_palette || [parsed.lighting?.color_hex || "#E8B87D"],
                  animation_style: parsed.visual?.animation_style || "",
                },
                evolution: parsed.evolution ? { phases: parsed.evolution.phases } : undefined,
              },
              mood: parsed.mood || [],
              tags: parsed.tags || [],
              created_at: new Date().toISOString(),
            };

            const result: AtmosphereResponse = {
              atmosphere: atmosphereResult,
              processing_time_ms: Date.now() - startTime,
              demo: false,
            };

            return NextResponse.json(result);
          }
        }
      } catch (apiError) {
        console.error("Claude API call failed, falling back to demo mode:", apiError);
        // Fall through to demo mode
      }
    }

    // --- Demo mode: keyword-based atmosphere generation ---
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

    // Try to find a matching pre-built demo atmosphere
    let atmosphere = findDemoAtmosphere(trimmedPrompt);

    // If no pre-built match, generate from keywords
    if (!atmosphere) {
      atmosphere = generateKeywordAtmosphere(trimmedPrompt);
    }

    // If evolution was requested and the atmosphere does not have one, add a generic evolution
    if (evolution && !atmosphere.profile.evolution) {
      const baseColor = atmosphere.profile.lighting.color_hex;
      atmosphere.profile.evolution = {
        phases: [
          {
            name: "Opening",
            duration_minutes: 20,
            lighting: {
              brightness: Math.min(100, atmosphere.profile.lighting.brightness + 15),
              speed: Math.max(10, atmosphere.profile.lighting.speed - 10),
            },
            sound: {
              mood: "relaxed",
            },
            description: "The atmosphere settles in, gentle and inviting.",
          },
          {
            name: "Peak",
            duration_minutes: 30,
            lighting: {
              brightness: atmosphere.profile.lighting.brightness,
              animation: atmosphere.profile.lighting.animation,
            },
            sound: {
              mood: atmosphere.profile.sound.mood,
            },
            description: "The full atmosphere realized at its intended intensity.",
          },
          {
            name: "Fade",
            duration_minutes: 15,
            lighting: {
              brightness: Math.max(5, atmosphere.profile.lighting.brightness - 20),
              speed: Math.max(5, atmosphere.profile.lighting.speed - 15),
            },
            sound: {
              mood: "dreamy",
              ambient_volume: atmosphere.profile.sound.ambient_volume + 10,
            },
            description: "The atmosphere softens and dims, winding down gently.",
          },
        ],
      };
    }

    const result: AtmosphereResponse = {
      atmosphere,
      processing_time_ms: Date.now() - startTime,
      demo: true,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Atmosphere generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate atmosphere." },
      { status: 500 }
    );
  }
}
