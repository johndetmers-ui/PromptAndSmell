// =============================================================================
// Synesthesia.ai -- Multi-Sensory Experience Types
// =============================================================================

// ---------------------------------------------------------------------------
// Atmosphere Module
// ---------------------------------------------------------------------------

export type AnimationType = "static" | "breathe" | "candle" | "aurora" | "storm" | "sunset";

export type AmbientLayerType =
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

export type DeviceIntegration = "hue" | "sonos" | "nest";

export interface AtmosphereProfile {
  lighting: {
    color_hex: string;
    brightness: number; // 0-100
    temperature_kelvin: number; // 2000-6500
    animation: AnimationType;
    speed: number; // 0-100
    secondary_colors?: string[]; // hex, for animations
  };
  sound: {
    genre: string;
    mood: string;
    bpm_range: [number, number];
    volume: number; // 0-100
    ambient_layer: AmbientLayerType | string;
    ambient_volume: number; // 0-100
    spotify_search_query?: string;
    playlist_name?: string;
  };
  temperature: {
    target_f: number;
    target_c?: number;
    change_direction: "warmer" | "cooler" | "neutral";
    description?: string;
  };
  visual: {
    scene_description: string;
    color_palette: string[];
    animation_style: string;
  };
  evolution?: {
    phases: EvolutionPhase[];
  };
}

export interface EvolutionPhase {
  name: string;
  duration_minutes: number;
  lighting?: Partial<AtmosphereProfile["lighting"]>;
  sound?: Partial<AtmosphereProfile["sound"]>;
  temperature?: Partial<AtmosphereProfile["temperature"]>;
  description?: string;
}

// Extended atmosphere with metadata (used by the page/API)
export interface AtmosphereResult {
  id: string;
  name: string;
  prompt: string;
  description: string;
  profile: AtmosphereProfile;
  mood: string[];
  tags: string[];
  created_at: string;
}

export interface AtmosphereRequest {
  prompt: string;
  devices?: DeviceIntegration[];
  evolution?: boolean;
}

export interface AtmosphereResponse {
  atmosphere: AtmosphereResult;
  processing_time_ms: number;
  demo: boolean;
}

// ---------------------------------------------------------------------------
// Demo Atmospheres
// ---------------------------------------------------------------------------

export const DEMO_ATMOSPHERES: Record<string, AtmosphereResult> = {
  "tokyo-jazz": {
    id: "atm-tokyo-jazz-001",
    name: "Tokyo Jazz Bar at Midnight",
    prompt: "Tokyo jazz bar at midnight",
    description:
      "A dimly lit jazz bar in a Shinjuku alley. Warm amber light pools across dark wood surfaces. A saxophone drifts through cigarette-tinged air while rain streaks the window.",
    profile: {
      lighting: {
        color_hex: "#FF8C00",
        brightness: 25,
        temperature_kelvin: 2200,
        animation: "candle",
        speed: 30,
        secondary_colors: ["#CC6600", "#FFB347", "#8B4513"],
      },
      sound: {
        genre: "jazz",
        mood: "melancholic",
        bpm_range: [65, 80],
        volume: 45,
        ambient_layer: "rain",
        ambient_volume: 20,
        spotify_search_query: "late night jazz bar smoky",
        playlist_name: "Midnight Tokyo Jazz",
      },
      temperature: {
        target_f: 70,
        target_c: 21.1,
        change_direction: "warmer",
        description: "Slightly warm, like a cozy bar interior",
      },
      visual: {
        scene_description:
          "Dark wood paneling bathed in amber candlelight. Rain on glass. Brass instruments gleam softly. A blue neon sign reflects in the wet street outside.",
        color_palette: ["#FF8C00", "#CC6600", "#1A0A00", "#FFB347", "#2A1A3E"],
        animation_style: "Slow candle flicker with occasional neon pulse",
      },
      evolution: {
        phases: [
          {
            name: "Late Evening",
            duration_minutes: 30,
            lighting: {
              color_hex: "#FF8C00",
              brightness: 30,
              temperature_kelvin: 2400,
              animation: "candle",
              speed: 30,
            },
            sound: {
              genre: "jazz",
              mood: "relaxed",
              bpm_range: [75, 90],
              ambient_layer: "cafe",
              ambient_volume: 15,
            },
            description: "The bar is lively, conversations mix with upbeat standards",
          },
          {
            name: "Midnight Set",
            duration_minutes: 45,
            lighting: {
              color_hex: "#CC6600",
              brightness: 20,
              temperature_kelvin: 2200,
              animation: "candle",
              speed: 20,
            },
            sound: {
              genre: "jazz",
              mood: "melancholic",
              bpm_range: [60, 72],
              ambient_layer: "rain",
              ambient_volume: 25,
            },
            description: "The crowd thins. A solo piano begins. Rain intensifies.",
          },
          {
            name: "Last Call",
            duration_minutes: 20,
            lighting: {
              color_hex: "#8B4513",
              brightness: 15,
              temperature_kelvin: 2000,
              animation: "breathe",
              speed: 20,
            },
            sound: {
              genre: "jazz",
              mood: "dreamy",
              bpm_range: [55, 65],
              ambient_layer: "rain",
              ambient_volume: 30,
            },
            description: "Near silence. One lamp. The rain is the only audience left.",
          },
        ],
      },
    },
    mood: ["intimate", "melancholic", "sophisticated"],
    tags: ["jazz", "tokyo", "night", "rain", "bar"],
    created_at: new Date().toISOString(),
  },

  "norwegian-cabin": {
    id: "atm-norwegian-cabin-002",
    name: "Cabin in Norwegian Woods, Winter",
    prompt: "Cabin in Norwegian woods, winter",
    description:
      "A timber cabin buried in snow. The fire crackles against the silence of a Nordic winter. Pine-scented air seeps through the walls. Stars burn above endless white forest.",
    profile: {
      lighting: {
        color_hex: "#FF6B00",
        brightness: 35,
        temperature_kelvin: 2000,
        animation: "candle",
        speed: 40,
        secondary_colors: ["#CC4400", "#FFB347", "#FF8C00"],
      },
      sound: {
        genre: "ambient",
        mood: "serene",
        bpm_range: [50, 60],
        volume: 30,
        ambient_layer: "fireplace",
        ambient_volume: 50,
        spotify_search_query: "nordic ambient winter calm",
        playlist_name: "Nordic Firelight",
      },
      temperature: {
        target_f: 72,
        target_c: 22.2,
        change_direction: "warmer",
        description: "Warm and cozy against the cold outside",
      },
      visual: {
        scene_description:
          "Rough timber walls glowing orange from a stone fireplace. Frost patterns on small windows. Thick wool blankets. A steaming mug on a worn table. Snow falling silently beyond the glass.",
        color_palette: ["#FF6B00", "#CC4400", "#2A1500", "#F5F5DC", "#1A2F4A"],
        animation_style: "Warm fire glow with gentle flicker, occasional spark",
      },
    },
    mood: ["cozy", "peaceful", "warm", "isolated"],
    tags: ["cabin", "winter", "fireplace", "nordic", "snow"],
    created_at: new Date().toISOString(),
  },

  "tropical-sunset": {
    id: "atm-tropical-sunset-003",
    name: "Tropical Sunset Beach Party",
    prompt: "Tropical sunset beach party",
    description:
      "Bare feet in warm sand as the sun melts into the Pacific. Tiki torches flicker. A reggae bassline pulses from somewhere among the palm trees. The air is salt, coconut, and frangipani.",
    profile: {
      lighting: {
        color_hex: "#FF4500",
        brightness: 60,
        temperature_kelvin: 2500,
        animation: "sunset",
        speed: 20,
        secondary_colors: ["#FF6B35", "#FF2D2D", "#FFB347", "#8B0000", "#2D1B4E"],
      },
      sound: {
        genre: "reggae",
        mood: "joyful",
        bpm_range: [88, 100],
        volume: 55,
        ambient_layer: "waves",
        ambient_volume: 35,
        spotify_search_query: "tropical sunset reggae beach party",
        playlist_name: "Sunset Beach Vibes",
      },
      temperature: {
        target_f: 76,
        target_c: 24.4,
        change_direction: "warmer",
        description: "Warm tropical evening air",
      },
      visual: {
        scene_description:
          "Orange and magenta sky dissolving into deep violet. Palm silhouettes. Tiki torches casting dancing light on sand. Waves catching the last gold of the sun.",
        color_palette: ["#FF4500", "#FF6B35", "#FFB347", "#8B0000", "#2D1B4E"],
        animation_style: "Gradual sunset color transition with torch flicker overlay",
      },
      evolution: {
        phases: [
          {
            name: "Golden Hour",
            duration_minutes: 30,
            lighting: {
              color_hex: "#FFB347",
              brightness: 70,
              temperature_kelvin: 3000,
              animation: "sunset",
              speed: 10,
            },
            sound: {
              genre: "bossa nova",
              mood: "relaxed",
              bpm_range: [80, 90],
              ambient_layer: "waves",
              ambient_volume: 30,
            },
            description: "Warm golden light. Gentle bossa nova. The party is just beginning.",
          },
          {
            name: "Sunset Peak",
            duration_minutes: 20,
            lighting: {
              color_hex: "#FF4500",
              brightness: 55,
              temperature_kelvin: 2500,
              animation: "sunset",
              speed: 30,
            },
            sound: {
              genre: "reggae",
              mood: "joyful",
              bpm_range: [92, 105],
              ambient_layer: "waves",
              ambient_volume: 25,
            },
            description: "The sky erupts in color. Energy rises. Barefoot dancing on sand.",
          },
          {
            name: "Twilight",
            duration_minutes: 40,
            lighting: {
              color_hex: "#8B0000",
              brightness: 30,
              temperature_kelvin: 2000,
              animation: "candle",
              speed: 30,
            },
            sound: {
              genre: "electronic",
              mood: "dreamy",
              bpm_range: [105, 115],
              ambient_layer: "waves",
              ambient_volume: 20,
            },
            description: "Stars emerge. The torches are the only light. Music deepens.",
          },
        ],
      },
    },
    mood: ["joyful", "relaxed", "energetic", "warm"],
    tags: ["beach", "sunset", "tropical", "party", "summer"],
    created_at: new Date().toISOString(),
  },

  "london-bookshop": {
    id: "atm-london-bookshop-004",
    name: "Rainy London Bookshop",
    prompt: "Rainy London bookshop",
    description:
      "A cramped bookshop on a grey London afternoon. Rain drums against the bay window. Old paper and leather bindings perfume the still air. A single desk lamp casts a warm pool of light.",
    profile: {
      lighting: {
        color_hex: "#FFD700",
        brightness: 30,
        temperature_kelvin: 2700,
        animation: "breathe",
        speed: 20,
        secondary_colors: ["#DAA520", "#B8860B"],
      },
      sound: {
        genre: "classical",
        mood: "serene",
        bpm_range: [58, 72],
        volume: 25,
        ambient_layer: "rain",
        ambient_volume: 40,
        spotify_search_query: "classical piano gentle rain reading",
        playlist_name: "Bookshop Afternoon",
      },
      temperature: {
        target_f: 69,
        target_c: 20.6,
        change_direction: "neutral",
        description: "Comfortable room temperature with a slight chill from the rain outside",
      },
      visual: {
        scene_description:
          "Floor-to-ceiling mahogany shelves packed with worn spines. A brass desk lamp. Rain-streaked window overlooking a cobblestone street. An armchair with a wool throw.",
        color_palette: ["#FFD700", "#DAA520", "#2A1500", "#8B7355", "#4A4A4A"],
        animation_style: "Gentle breathing glow from a desk lamp, rain streaks on glass",
      },
    },
    mood: ["contemplative", "cozy", "nostalgic", "quiet"],
    tags: ["bookshop", "london", "rain", "reading", "cozy"],
    created_at: new Date().toISOString(),
  },
};

// Find a matching demo atmosphere from prompt keywords
export function findDemoAtmosphere(prompt: string): AtmosphereResult | null {
  const lower = prompt.toLowerCase();
  if (lower.includes("jazz") || lower.includes("tokyo") || (lower.includes("bar") && lower.includes("night"))) {
    return DEMO_ATMOSPHERES["tokyo-jazz"];
  }
  if (lower.includes("cabin") || lower.includes("norwegian") || lower.includes("nordic") || (lower.includes("woods") && lower.includes("winter"))) {
    return DEMO_ATMOSPHERES["norwegian-cabin"];
  }
  if (lower.includes("beach") || lower.includes("tropical") || (lower.includes("sunset") && lower.includes("party"))) {
    return DEMO_ATMOSPHERES["tropical-sunset"];
  }
  if (lower.includes("bookshop") || lower.includes("london") || lower.includes("library") || lower.includes("reading")) {
    return DEMO_ATMOSPHERES["london-bookshop"];
  }
  return null;
}

// Generate a keyword-based demo atmosphere for prompts that do not match prebuilts
export function generateKeywordAtmosphere(prompt: string): AtmosphereResult {
  const lower = prompt.toLowerCase();

  // Analyze keywords for lighting
  const isNight = /night|midnight|dark|evening|dusk|late/.test(lower);
  const isBeach = /beach|ocean|sea|coast|shore|island/.test(lower);
  const isForest = /forest|woods|jungle|garden|tree|nature/.test(lower);
  const isCozy = /cozy|warm|comfort|cabin|fireplace|home|blanket/.test(lower);
  const isRain = /rain|storm|thunder|drizzle|grey|gray/.test(lower);
  const isSpace = /space|galaxy|cosmic|star|nebula|orbit/.test(lower);
  const isRetro = /retro|vintage|1920|speakeasy|1950|old/.test(lower);
  const isCafe = /cafe|coffee|bistro|restaurant/.test(lower);
  const isSnow = /snow|winter|ice|cold|frost|arctic/.test(lower);

  // Determine color
  let colorHex = "#E8B87D"; // warm default
  let brightness = 50;
  let tempKelvin = 3000;
  let animation: AnimationType = "breathe";
  let speed = 30;
  let secondaryColors: string[] = [];

  if (isNight) { colorHex = "#4A2500"; brightness = 20; tempKelvin = 2200; animation = "candle"; secondaryColors = ["#1A0A00", "#FF8C00"]; }
  if (isBeach) { colorHex = "#FF6B35"; brightness = 65; tempKelvin = 3500; animation = "sunset"; secondaryColors = ["#FFB347", "#FF2D2D", "#4ECDC4"]; }
  if (isForest) { colorHex = "#2D6B30"; brightness = 40; tempKelvin = 4000; animation = "breathe"; speed = 20; secondaryColors = ["#7BC67E", "#1A4A1C"]; }
  if (isCozy) { colorHex = "#FF6B00"; brightness = 35; tempKelvin = 2200; animation = "candle"; speed = 35; secondaryColors = ["#CC4400", "#FFB347"]; }
  if (isRain) { colorHex = "#6B7B8D"; brightness = 30; tempKelvin = 3500; animation = "breathe"; speed = 25; secondaryColors = ["#4A5568", "#2D3748"]; }
  if (isSpace) { colorHex = "#1A0A3E"; brightness = 15; tempKelvin = 6500; animation = "aurora"; speed = 15; secondaryColors = ["#4B0082", "#00BFFF", "#FF00FF"]; }
  if (isRetro) { colorHex = "#DAA520"; brightness = 40; tempKelvin = 2500; animation = "candle"; speed = 25; secondaryColors = ["#8B6914", "#FFD700"]; }
  if (isCafe) { colorHex = "#E8B87D"; brightness = 45; tempKelvin = 2800; animation = "breathe"; speed = 20; secondaryColors = ["#D4956A", "#C49A6C"]; }
  if (isSnow) { colorHex = "#B0C4DE"; brightness = 50; tempKelvin = 5000; animation = "breathe"; speed = 15; secondaryColors = ["#E6F0FF", "#87CEEB"]; }

  // Determine sound
  let genre = "ambient";
  let mood = "relaxed";
  let bpmRange: [number, number] = [70, 90];
  let ambientLayer: AmbientLayerType | string = "white_noise";
  let ambientVolume = 20;

  if (isBeach) { genre = "bossa_nova"; mood = "joyful"; bpmRange = [85, 100]; ambientLayer = "waves"; ambientVolume = 35; }
  if (isForest) { genre = "ambient"; mood = "serene"; bpmRange = [55, 70]; ambientLayer = "forest"; ambientVolume = 40; }
  if (isCozy) { genre = "indie"; mood = "cozy"; bpmRange = [75, 95]; ambientLayer = "fireplace"; ambientVolume = 45; }
  if (isRain) { genre = "lo-fi"; mood = "melancholic"; bpmRange = [70, 85]; ambientLayer = "rain"; ambientVolume = 40; }
  if (isNight) { genre = "jazz"; mood = "mysterious"; bpmRange = [60, 80]; ambientLayer = "city"; ambientVolume = 15; }
  if (isSpace) { genre = "electronic"; mood = "dreamy"; bpmRange = [90, 120]; ambientLayer = "white_noise"; ambientVolume = 10; }
  if (isRetro) { genre = "jazz"; mood = "nostalgic"; bpmRange = [100, 130]; ambientLayer = "cafe"; ambientVolume = 20; }
  if (isCafe) { genre = "jazz"; mood = "relaxed"; bpmRange = [80, 100]; ambientLayer = "cafe"; ambientVolume = 25; }
  if (isSnow) { genre = "classical"; mood = "serene"; bpmRange = [55, 70]; ambientLayer = "wind"; ambientVolume = 25; }

  // Temperature
  let targetF = 70;
  let direction: "warmer" | "cooler" | "neutral" = "neutral";
  if (isCozy || isSnow || isNight) { targetF = 72; direction = "warmer"; }
  if (isBeach) { targetF = 76; direction = "warmer"; }
  if (isSpace) { targetF = 66; direction = "cooler"; }

  const targetC = Math.round(((targetF - 32) * 5 / 9) * 10) / 10;

  const nameWords = prompt.trim().split(/\s+/).slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    id: `atm-demo-${Date.now()}`,
    name: nameWords,
    prompt,
    description: `An atmosphere generated from: "${prompt}". Keyword-based demo mode.`,
    profile: {
      lighting: {
        color_hex: colorHex,
        brightness,
        temperature_kelvin: tempKelvin,
        animation,
        speed,
        secondary_colors: secondaryColors,
      },
      sound: {
        genre,
        mood,
        bpm_range: bpmRange,
        volume: 40,
        ambient_layer: ambientLayer,
        ambient_volume: ambientVolume,
        spotify_search_query: `${mood} ${genre}`,
        playlist_name: `${nameWords} Playlist`,
      },
      temperature: {
        target_f: targetF,
        target_c: targetC,
        change_direction: direction,
        description: `${direction === "warmer" ? "Warming" : direction === "cooler" ? "Cooling" : "Maintaining"} to ${targetF}F`,
      },
      visual: {
        scene_description: `A scene inspired by "${prompt}". The atmosphere is ${mood}, with ${genre} music setting the tone.`,
        color_palette: [colorHex, ...secondaryColors.slice(0, 3)],
        animation_style: `${animation} effect at ${speed}% speed`,
      },
    },
    mood: [mood],
    tags: prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5),
    created_at: new Date().toISOString(),
  };
}


// ---------------------------------------------------------------------------
// Texture Module
// ---------------------------------------------------------------------------

export interface TextureProfile {
  name: string;
  description: string;
  physical_properties: {
    friction: number;
    grain: number;
    temperature: number;
    resistance: number;
    elasticity: number;
    moisture: number;
    roughness: number;
  };
  haptic_pattern: Array<{
    type: "vibrate" | "pause";
    duration_ms: number;
    intensity: number;
    frequency_hz?: number;
  }>;
  waveform: number[];
  material_reference: string;
}

// ---------------------------------------------------------------------------
// Taste Module
// ---------------------------------------------------------------------------

export interface FlavorFormula {
  name: string;
  description: string;
  taste_profile: {
    sweet: number;
    sour: number;
    salty: number;
    bitter: number;
    umami: number;
  };
  mouthfeel: {
    temperature: string;
    viscosity: string;
    carbonation: number;
    astringency: number;
    spiciness: number;
  };
  aroma_contribution: string[];
  home_recipe: {
    ingredients: Array<{
      name: string;
      amount: string;
      unit: string;
      notes: string;
    }>;
    instructions: string[];
    yield: string;
    difficulty: "easy" | "medium" | "advanced";
    time_minutes: number;
  };
  molecular_formula: {
    compounds: Array<{
      name: string;
      cas_number: string;
      concentration_ppm: number;
      function: string;
      food_grade: boolean;
    }>;
    solvent: string;
    preparation: string[];
  };
  food_safety: {
    allergens: string[];
    dietary: string[];
    shelf_life: string;
  };
  pairing_suggestions: string[];
}

// ---------------------------------------------------------------------------
// Pulse Module
// ---------------------------------------------------------------------------

export interface PulsePattern {
  bpm: number;
  rhythm_description: string;
  haptic_sequence: Array<{
    delay_ms: number;
    intensity: number;
    duration_ms: number;
  }>;
  mode: "sync" | "broadcast" | "archive";
  emotional_state: string;
  breathing_guide?: {
    inhale_ms: number;
    hold_ms: number;
    exhale_ms: number;
  };
}

// ---------------------------------------------------------------------------
// Unified Sensory Experience
// ---------------------------------------------------------------------------

export interface SensoryExperience {
  id: string;
  prompt: string;
  scene_analysis: string;
  modules: {
    atmosphere?: AtmosphereProfile;
    scent?: any; // OSCFormula from existing types
    texture?: TextureProfile;
    taste?: FlavorFormula;
    pulse?: PulsePattern;
  };
  unified_narrative: string;
  mood: string[];
  intensity: number;
  created_at: string;
  creator?: string;
}

// ---------------------------------------------------------------------------
// Module metadata
// ---------------------------------------------------------------------------

export type ModuleKey = "atmosphere" | "scent" | "texture" | "taste" | "pulse";

export interface ModuleMeta {
  key: ModuleKey;
  label: string;
  color: string;
  description: string;
}

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  atmosphere: {
    key: "atmosphere",
    label: "Atmosphere",
    color: "#F59E0B",
    description: "Transform any room with lighting, sound, and ambiance",
  },
  scent: {
    key: "scent",
    label: "Scent",
    color: "#10B981",
    description: "Smell any memory with precise olfactory formulas",
  },
  texture: {
    key: "texture",
    label: "Texture",
    color: "#3B82F6",
    description: "Feel any surface through haptic patterns",
  },
  taste: {
    key: "taste",
    label: "Taste",
    color: "#EC4899",
    description: "Taste the impossible with molecular recipes",
  },
  pulse: {
    key: "pulse",
    label: "Pulse",
    color: "#EF4444",
    description: "Share your heartbeat and emotional rhythm",
  },
};

export const ALL_MODULE_KEYS: ModuleKey[] = [
  "atmosphere",
  "scent",
  "texture",
  "taste",
  "pulse",
];
