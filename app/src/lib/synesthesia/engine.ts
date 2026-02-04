// ---------------------------------------------------------------------------
// Synesthesia.ai -- Unified Sensory Decomposition Engine
// ---------------------------------------------------------------------------
// This module defines the core type system and decomposition logic for the
// Synesthesia.ai platform. It takes a single natural-language prompt and
// decomposes it into coordinated instructions for up to five sensory modules:
// ATMOSPHERE, SCENT, TEXTURE, TASTE, and PULSE.
// ---------------------------------------------------------------------------

import type { OSCFormula } from "@/lib/types";

// ---------------------------------------------------------------------------
// ATMOSPHERE Types
// ---------------------------------------------------------------------------

export interface LightingConfig {
  /** Hex color code, e.g. "#E8A317" */
  color_hex: string;
  /** Brightness percentage, 0 = off, 100 = maximum */
  brightness: number;
  /** Color temperature in Kelvin, 2000 (warm candle) to 6500 (daylight) */
  temperature_kelvin: number;
  /** Animation mode for the lights */
  animation: "static" | "breathe" | "candle" | "aurora" | "storm" | "sunset";
  /** Animation speed, 0 = slowest, 100 = fastest */
  speed: number;
}

export interface SoundConfig {
  /** Music genre, e.g. "lo-fi jazz", "ambient electronic", "classical piano" */
  genre: string;
  /** Emotional mood of the music, e.g. "mellow", "energetic", "melancholic" */
  mood: string;
  /** BPM range as a tuple [min, max] */
  bpm_range: [number, number];
  /** Music volume, 0-100 */
  volume: number;
  /** Ambient sound layer, e.g. "rain", "fireplace", "waves", "wind", "birds", "city" */
  ambient_layer: string;
  /** Ambient layer volume, 0-100 */
  ambient_volume: number;
}

export interface TemperatureConfig {
  /** Target temperature in Fahrenheit */
  target_f: number;
  /** Direction of temperature change */
  change_direction: "warmer" | "cooler" | "neutral";
}

export interface VisualConfig {
  /** Description of the visual scene for optional displays */
  scene_description: string;
  /** Array of hex color codes forming the palette */
  color_palette: string[];
  /** Style of visual animation, e.g. "slow drift", "particle flow", "static gradient" */
  animation_style: string;
}

export interface AtmospherePhase {
  /** Name of this phase, e.g. "Golden Hour", "Deep Night" */
  name: string;
  /** Duration of this phase in minutes */
  duration_minutes: number;
  /** Partial overrides applied to the base atmosphere during this phase */
  atmosphere: Partial<{
    lighting: Partial<LightingConfig>;
    sound: Partial<SoundConfig>;
    temperature: Partial<TemperatureConfig>;
    visual: Partial<VisualConfig>;
  }>;
}

export interface AtmosphereEvolution {
  /** Ordered list of phases that the atmosphere transitions through */
  phases: AtmospherePhase[];
}

export interface AtmosphereProfile {
  lighting: LightingConfig;
  sound: SoundConfig;
  temperature: TemperatureConfig;
  visual: VisualConfig;
  evolution: AtmosphereEvolution;
}

// ---------------------------------------------------------------------------
// TEXTURE Types
// ---------------------------------------------------------------------------

export interface PhysicalProperties {
  /** Resistance to sliding, 0 = frictionless (ice), 1 = maximum grip (rubber) */
  friction: number;
  /** Surface texture granularity, 0 = perfectly smooth (glass), 1 = coarse (sandpaper) */
  grain: number;
  /** Perceived thermal quality, -1 = ice cold, 0 = neutral, 1 = hot */
  temperature: number;
  /** Force required to deform, 0 = no resistance (water), 1 = immovable (concrete) */
  resistance: number;
  /** Spring-back tendency, 0 = no recovery (clay), 1 = full recovery (rubber ball) */
  elasticity: number;
  /** Surface wetness, 0 = bone dry, 1 = soaking wet */
  moisture: number;
  /** Fine surface irregularity, 0 = mirror smooth, 1 = tree bark */
  roughness: number;
}

export interface HapticEvent {
  /** Type of haptic event */
  type: "vibrate" | "pause";
  /** Duration of this event in milliseconds */
  duration_ms: number;
  /** Vibration intensity, 0-1 (ignored for pause events) */
  intensity: number;
  /** Vibration frequency in Hz (optional, for hardware that supports it) */
  frequency_hz?: number;
}

export interface TextureProfile {
  /** Descriptive name, e.g. "Warm Velvet", "Wet Sand" */
  name: string;
  /** Natural language description of the tactile sensation */
  description: string;
  /** Seven-dimensional physical property vector */
  physical_properties: PhysicalProperties;
  /** Sequence of haptic events for playback on vibration hardware */
  haptic_pattern: HapticEvent[];
  /** Normalized amplitude values (0-1) for continuous waveform playback */
  waveform: number[];
  /** Closest real-world material for reference */
  material_reference: string;
}

// ---------------------------------------------------------------------------
// TASTE Types
// ---------------------------------------------------------------------------

export interface TasteProfile {
  /** Sucrose-equivalent sweetness, 0-10 */
  sweet: number;
  /** Citric acid-equivalent acidity, 0-10 */
  sour: number;
  /** NaCl-equivalent salinity, 0-10 */
  salty: number;
  /** Quinine-equivalent bitterness, 0-10 */
  bitter: number;
  /** Glutamate-equivalent savory depth, 0-10 */
  umami: number;
}

export interface Mouthfeel {
  /** Serving temperature category */
  temperature: "frozen" | "cold" | "cool" | "room" | "warm" | "hot";
  /** Liquid thickness */
  viscosity: "thin" | "light" | "medium" | "thick" | "gel";
  /** Effervescence level, 0 = still, 10 = highly carbonated */
  carbonation: number;
  /** Drying/tannin quality, 0 = none, 10 = extremely astringent */
  astringency: number;
  /** Capsaicin-equivalent heat, 0 = none, 10 = extremely spicy */
  spiciness: number;
}

export interface HomeRecipeIngredient {
  /** Ingredient name, e.g. "fresh lemon juice" */
  name: string;
  /** Quantity, e.g. "2", "1/4" */
  amount: string;
  /** Unit of measure, e.g. "tablespoons", "cups", "grams" */
  unit: string;
  /** Preparation notes, e.g. "freshly squeezed", "finely grated" */
  notes: string;
}

export interface HomeRecipe {
  /** List of ingredients with amounts */
  ingredients: HomeRecipeIngredient[];
  /** Step-by-step preparation instructions */
  instructions: string[];
  /** What the recipe produces, e.g. "2 servings", "500ml" */
  yield: string;
  /** Skill level required */
  difficulty: "easy" | "medium" | "advanced";
}

export interface MolecularCompound {
  /** Chemical compound name, e.g. "Citric Acid", "Vanillin", "Monosodium Glutamate" */
  name: string;
  /** Chemical Abstracts Service registry number */
  cas_number: string;
  /** Concentration in parts per million */
  concentration_ppm: number;
  /** What this compound contributes to the flavor */
  function: string;
  /** Whether this compound has GRAS (Generally Recognized As Safe) status */
  food_grade: boolean;
}

export interface MolecularFormula {
  /** List of precise food-grade compounds */
  compounds: MolecularCompound[];
  /** Base solvent, e.g. "water", "ethanol (food-grade)", "propylene glycol" */
  solvent: string;
  /** Step-by-step preparation for the molecular formulation */
  preparation: string[];
}

export interface FoodSafety {
  /** Known allergens present, e.g. ["dairy", "nuts", "gluten"] */
  allergens: string[];
  /** Dietary classifications, e.g. ["vegan", "gluten-free", "kosher"] */
  dietary: string[];
  /** Expected shelf life, e.g. "3 days refrigerated", "6 months sealed" */
  shelf_life: string;
}

export interface FlavorFormula {
  /** Creative name for this flavor, e.g. "Aurora Cocktail", "Nostalgia Elixir" */
  name: string;
  /** Natural language description of the flavor experience */
  description: string;
  /** Five-dimensional taste vector */
  taste_profile: TasteProfile;
  /** Physical mouthfeel characteristics */
  mouthfeel: Mouthfeel;
  /** Scent notes that contribute to flavor perception (bridges TASTE and SCENT) */
  aroma_contribution: string[];
  /** Kitchen-friendly recipe with common ingredients */
  home_recipe: HomeRecipe;
  /** Precise molecular formulation for labs and manufacturers */
  molecular_formula: MolecularFormula;
  /** Safety information */
  food_safety: FoodSafety;
}

// ---------------------------------------------------------------------------
// PULSE Types
// ---------------------------------------------------------------------------

export interface PulseHapticEvent {
  /** Delay before this beat in milliseconds (from start of sequence or previous beat) */
  delay_ms: number;
  /** Vibration intensity for this beat, 0-1 */
  intensity: number;
  /** Duration of this haptic pulse in milliseconds */
  duration_ms: number;
}

export interface BreathingGuide {
  /** Inhale duration in milliseconds */
  inhale_ms: number;
  /** Hold duration in milliseconds */
  hold_ms: number;
  /** Exhale duration in milliseconds */
  exhale_ms: number;
}

export interface PulsePattern {
  /** Heart rate in beats per minute */
  bpm: number;
  /** Natural language description of the rhythm character */
  rhythm_description: string;
  /** Haptic beat sequence for rendering on wrist actuators */
  haptic_sequence: PulseHapticEvent[];
  /** Operating mode */
  mode: "sync" | "broadcast" | "archive";
  /** AI-inferred emotional state based on HRV patterns */
  emotional_state: string;
  /** Optional breathing pattern synchronized to the heartbeat */
  breathing_guide?: BreathingGuide;
}

// ---------------------------------------------------------------------------
// Unified Decomposition Types
// ---------------------------------------------------------------------------

export type ModuleName = "atmosphere" | "scent" | "texture" | "taste" | "pulse";

export interface SensoryModules {
  atmosphere?: AtmosphereProfile;
  scent?: OSCFormula;
  texture?: TextureProfile;
  taste?: FlavorFormula;
  pulse?: PulsePattern;
}

export interface SensoryDecomposition {
  /** The original user prompt */
  prompt: string;
  /** Claude's interpretation of the scene -- emotional, physical, and sensory dimensions */
  scene_analysis: string;
  /** Per-module outputs, only populated for requested modules */
  modules: SensoryModules;
  /** Narrative describing how all senses work together in this experience */
  unified_narrative: string;
  /** Mood tags for the overall experience */
  mood: string[];
  /** Overall experience intensity, 1 (subtle/gentle) to 10 (overwhelming/intense) */
  intensity: number;
}

// ---------------------------------------------------------------------------
// API Request/Response Types
// ---------------------------------------------------------------------------

export interface DecomposeRequest {
  /** The user's natural language prompt */
  prompt: string;
  /** Which modules to activate for this decomposition */
  modules: ModuleName[];
  /** Optional base64-encoded image to provide visual context */
  image?: string;
}

export interface DecomposeResponse {
  /** The full sensory decomposition result */
  decomposition: SensoryDecomposition;
  /** Processing time in milliseconds */
  processing_time_ms: number;
}

// ---------------------------------------------------------------------------
// Decomposition Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Builds the complete system prompt for the Sensory Decomposition Engine.
 * This prompt instructs Claude to analyze the user's input and generate
 * coordinated outputs for each requested sensory module.
 *
 * @param userPrompt - The user's natural language description of an experience
 * @param activeModules - Array of module names to generate output for
 * @returns The complete system prompt string to send to Claude
 */
export function buildDecompositionPrompt(
  userPrompt: string,
  activeModules: ModuleName[]
): string {
  const moduleInstructions: Record<ModuleName, string> = {
    atmosphere: `
"atmosphere": {
  "lighting": {
    "color_hex": string (hex color, e.g. "#E8A317"),
    "brightness": number (0-100),
    "temperature_kelvin": number (2000-6500),
    "animation": "static" | "breathe" | "candle" | "aurora" | "storm" | "sunset",
    "speed": number (0-100)
  },
  "sound": {
    "genre": string (music genre),
    "mood": string (emotional quality),
    "bpm_range": [number, number],
    "volume": number (0-100),
    "ambient_layer": string (e.g. "rain", "fireplace", "waves", "wind", "birds", "city", "thunder", "crickets", "silence"),
    "ambient_volume": number (0-100)
  },
  "temperature": {
    "target_f": number (Fahrenheit),
    "change_direction": "warmer" | "cooler" | "neutral"
  },
  "visual": {
    "scene_description": string,
    "color_palette": string[] (3-5 hex colors),
    "animation_style": string
  },
  "evolution": {
    "phases": [
      {
        "name": string,
        "duration_minutes": number,
        "atmosphere": { partial overrides to lighting, sound, temperature, visual }
      }
    ]
  }
}`,
    scent: `
"scent": {
  "id": string (generate a UUID-like string),
  "version": "1.0.0",
  "name": string (creative scent name),
  "description": string (evocative 2-3 sentence description),
  "prompt": string (echo back the user's prompt),
  "creator": "Synesthesia.ai",
  "created_at": string (ISO 8601 timestamp),
  "ingredients": [
    {
      "name": string,
      "cas_number": string,
      "category": string (citrus|floral|woody|fresh|oriental|musk|green|fruity|spicy|aquatic|gourmand|leather|aromatic|amber|powdery|earthy|smoky|herbal|animalic|balsamic),
      "note_type": "top" | "middle" | "base",
      "percentage": number (must sum to 100 across all ingredients),
      "intensity": number (1-10)
    }
  ],
  "evolution": {
    "opening": string[] (ingredient names),
    "heart": string[] (ingredient names),
    "drydown": string[] (ingredient names)
  },
  "accords": [
    { "name": string, "strength": number (0-100), "ingredients": string[] }
  ],
  "mood": string[],
  "season": string[],
  "intensity": number (1-10),
  "longevity_hours": number,
  "sillage": "intimate" | "moderate" | "strong" | "enormous",
  "safety": {
    "ifra_compliance": boolean,
    "allergens": string[],
    "max_skin_concentration": number,
    "notes": string
  },
  "tags": string[]
}`,
    texture: `
"texture": {
  "name": string (descriptive name, e.g. "Cold Steel"),
  "description": string (what touching this feels like),
  "physical_properties": {
    "friction": number (0-1, 0=frictionless ice, 1=maximum grip rubber),
    "grain": number (0-1, 0=glass smooth, 1=coarse sandpaper),
    "temperature": number (-1 to 1, -1=ice cold, 0=neutral, 1=sun-hot),
    "resistance": number (0-1, 0=water, 1=concrete),
    "elasticity": number (0-1, 0=clay, 1=rubber ball),
    "moisture": number (0-1, 0=bone dry, 1=soaking wet),
    "roughness": number (0-1, 0=polished marble, 1=tree bark)
  },
  "haptic_pattern": [
    {
      "type": "vibrate" | "pause",
      "duration_ms": number,
      "intensity": number (0-1),
      "frequency_hz": number (optional, 30-500)
    }
  ] (8-20 events that capture the texture's tactile character),
  "waveform": number[] (64-128 normalized amplitude values 0-1 for continuous playback),
  "material_reference": string (closest real-world material)
}`,
    taste: `
"taste": {
  "name": string (creative flavor name),
  "description": string (evocative description of the flavor experience),
  "taste_profile": {
    "sweet": number (0-10),
    "sour": number (0-10),
    "salty": number (0-10),
    "bitter": number (0-10),
    "umami": number (0-10)
  },
  "mouthfeel": {
    "temperature": "frozen" | "cold" | "cool" | "room" | "warm" | "hot",
    "viscosity": "thin" | "light" | "medium" | "thick" | "gel",
    "carbonation": number (0-10),
    "astringency": number (0-10),
    "spiciness": number (0-10)
  },
  "aroma_contribution": string[] (scent notes that affect flavor, bridges to SCENT module),
  "home_recipe": {
    "ingredients": [
      { "name": string, "amount": string, "unit": string, "notes": string }
    ],
    "instructions": string[] (step-by-step),
    "yield": string,
    "difficulty": "easy" | "medium" | "advanced"
  },
  "molecular_formula": {
    "compounds": [
      {
        "name": string,
        "cas_number": string,
        "concentration_ppm": number,
        "function": string (what this compound does),
        "food_grade": boolean (must be true for all compounds)
      }
    ],
    "solvent": string,
    "preparation": string[]
  },
  "food_safety": {
    "allergens": string[],
    "dietary": string[] (e.g. "vegan", "gluten-free"),
    "shelf_life": string
  }
}`,
    pulse: `
"pulse": {
  "bpm": number (40-180),
  "rhythm_description": string (e.g. "calm and steady", "excited and irregular"),
  "haptic_sequence": [
    {
      "delay_ms": number (ms since start of one-beat cycle),
      "intensity": number (0-1),
      "duration_ms": number
    }
  ] (sequence representing one full heartbeat cycle, lub-dub pattern),
  "mode": "sync" | "broadcast" | "archive",
  "emotional_state": string (e.g. "serene awe", "excited anticipation", "deep calm"),
  "breathing_guide": {
    "inhale_ms": number,
    "hold_ms": number,
    "exhale_ms": number
  }
}`,
  };

  const requestedModuleSchemas = activeModules
    .map((mod) => moduleInstructions[mod])
    .join(",\n");

  const moduleNameList = activeModules.join(", ").toUpperCase();

  const crossModuleGuidance = buildCrossModuleGuidance(activeModules);

  return `You are the Synesthesia.ai Sensory Decomposition Engine. Your task is to take a natural-language description of an experience and decompose it into coordinated sensory outputs across multiple modalities.

The user has requested decomposition into these modules: ${moduleNameList}.

ANALYSIS PROCESS:
1. Read the user's prompt carefully. Consider the emotional, physical, environmental, temporal, and cultural dimensions of the described experience.
2. For each requested module, generate appropriate sensory parameters that authentically represent the experience.
3. Ensure all modules are COORDINATED -- they should feel like parts of the same unified experience, not independent interpretations.
4. Write a unified narrative that describes how all the senses work together.

${crossModuleGuidance}

CRITICAL RULES:
- All JSON values must be valid and correctly typed.
- For the SCENT module: ingredient percentages MUST sum to exactly 100.
- For the TASTE module: all molecular compounds MUST be food-grade (GRAS status). Never include non-food-safe chemicals.
- For the TEXTURE module: physical_properties values must be within their specified ranges.
- For the ATMOSPHERE module: include at least 2 evolution phases to show how the environment changes over time.
- For the PULSE module: the haptic_sequence should represent one complete heartbeat cycle (lub-dub), and delay_ms values should be consistent with the specified BPM.
- Be creative and specific. Avoid generic or obvious choices. Surprise the user with thoughtful, nuanced sensory details.
- The unified_narrative should be a 2-4 sentence poetic passage written in second person ("you") that ties all active senses together into a single coherent moment.

OUTPUT FORMAT:
Respond with ONLY valid JSON. No text before or after the JSON. The structure must be:

{
  "prompt": "${userPrompt.replace(/"/g, '\\"')}",
  "scene_analysis": string (your detailed interpretation of the experience -- what does this scene look, sound, smell, feel, and taste like? What emotions does it evoke? 3-5 sentences.),
  "modules": {
${requestedModuleSchemas}
  },
  "unified_narrative": string (2-4 sentence poetic passage in second person tying all senses together),
  "mood": string[] (3-6 mood tags, e.g. ["serene", "mystical", "cold", "vast"]),
  "intensity": number (1-10, overall experience intensity)
}`;
}

// ---------------------------------------------------------------------------
// Cross-Module Guidance Builder
// ---------------------------------------------------------------------------

/**
 * Generates instructions about how modules should coordinate with each other
 * based on which modules are active.
 */
function buildCrossModuleGuidance(activeModules: ModuleName[]): string {
  const guidelines: string[] = [];

  const has = (mod: ModuleName) => activeModules.includes(mod);

  if (has("atmosphere") && has("scent")) {
    guidelines.push(
      "ATMOSPHERE-SCENT COORDINATION: The ambient sound layer and lighting should emotionally match the scent profile. Warm, resinous scents pair with warm lighting (low Kelvin, amber tones). Fresh, citrus scents pair with bright, cool lighting. The ambient sound layer should evoke the same environment as the scent."
    );
  }

  if (has("atmosphere") && has("texture")) {
    guidelines.push(
      "ATMOSPHERE-TEXTURE COORDINATION: The atmosphere temperature setting should be consistent with the texture's temperature property. If the atmosphere is cold (target_f below 50), the texture should also have a negative temperature value. Lighting brightness should correlate with texture visibility -- dim lighting suggests soft, subtle textures."
    );
  }

  if (has("scent") && has("taste")) {
    guidelines.push(
      "SCENT-TASTE COORDINATION: Since ~80% of flavor perception comes from smell, the taste module's aroma_contribution array should share key notes with the scent module's ingredients. If the scent has vanilla and cinnamon, the taste should include those in aroma_contribution. The two modules should feel like smelling and tasting the same unified experience."
    );
  }

  if (has("texture") && has("taste")) {
    guidelines.push(
      "TEXTURE-TASTE COORDINATION: The texture's physical properties should evoke the mouthfeel of the taste. If the taste has thick viscosity, the texture should have high resistance. If the taste is carbonated, the texture's haptic pattern should include rapid micro-vibrations."
    );
  }

  if (has("pulse") && has("atmosphere")) {
    guidelines.push(
      "PULSE-ATMOSPHERE COORDINATION: The pulse BPM should match the atmosphere's emotional energy. Calm, ambient atmospheres suggest 50-65 BPM. Energetic, dynamic atmospheres suggest 90-130 BPM. The breathing guide rhythm should complement the music BPM range."
    );
  }

  if (has("pulse") && has("scent")) {
    guidelines.push(
      "PULSE-SCENT COORDINATION: The pulse's emotional_state should align with the scent's mood tags. Calming scents (lavender, chamomile) pair with lower BPM. Energizing scents (citrus, mint) pair with higher BPM."
    );
  }

  if (has("texture") && has("pulse")) {
    guidelines.push(
      "TEXTURE-PULSE COORDINATION: The haptic rendering of texture and pulse will share the same vibration hardware (phone or wearable). Ensure the texture's haptic pattern and the pulse's haptic sequence use different frequency ranges or intensity profiles so they remain distinguishable when played simultaneously or in sequence."
    );
  }

  if (guidelines.length === 0) {
    return "";
  }

  return (
    "CROSS-MODULE COORDINATION GUIDELINES:\n" + guidelines.join("\n\n") + "\n"
  );
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

/**
 * Pre-built decomposition for common prompts, used in demo mode when
 * no API key is configured.
 */
export const DEMO_DECOMPOSITIONS: Record<string, SensoryDecomposition> = {
  default: {
    prompt: "Northern lights in Iceland",
    scene_analysis:
      "A vast, frozen landscape under a dark winter sky. The aurora borealis ripples across the heavens in curtains of green, purple, and teal, casting an otherworldly glow on the snow and volcanic rock below. The air is brutally cold and thin, carrying the faint mineral scent of glacial ice and the electric tang of ionized atmosphere. The silence is immense, broken only by the occasional crack of distant ice. This is a scene of cosmic scale and quiet awe -- the kind of experience that makes a person feel both infinitely small and profoundly connected to something vast.",
    modules: {
      atmosphere: {
        lighting: {
          color_hex: "#00E87B",
          brightness: 30,
          temperature_kelvin: 5500,
          animation: "aurora",
          speed: 25,
        },
        sound: {
          genre: "ambient drone",
          mood: "vast and ethereal",
          bpm_range: [0, 40],
          volume: 30,
          ambient_layer: "wind",
          ambient_volume: 45,
        },
        temperature: {
          target_f: 35,
          change_direction: "cooler",
        },
        visual: {
          scene_description:
            "Undulating curtains of green and purple light sweep across a star-filled sky above a snow-covered volcanic plain.",
          color_palette: ["#00E87B", "#7B2FBE", "#00B4D8", "#1B1B3A", "#F0F0F0"],
          animation_style: "slow undulating waves",
        },
        evolution: {
          phases: [
            {
              name: "First Light",
              duration_minutes: 15,
              atmosphere: {
                lighting: { brightness: 15, color_hex: "#00B4D8" },
                sound: { ambient_volume: 30 },
              },
            },
            {
              name: "Full Display",
              duration_minutes: 30,
              atmosphere: {
                lighting: { brightness: 45, animation: "aurora", speed: 40 },
                sound: { volume: 35 },
              },
            },
            {
              name: "Fading to Stars",
              duration_minutes: 20,
              atmosphere: {
                lighting: {
                  brightness: 10,
                  color_hex: "#1B1B3A",
                  animation: "breathe",
                  speed: 10,
                },
                sound: { ambient_volume: 20, volume: 15 },
              },
            },
          ],
        },
      },
      scent: {
        id: "synth-scent-aurora-001",
        version: "1.0.0",
        name: "Aurora Borealis",
        description:
          "The sharp, crystalline scent of arctic air at negative temperatures -- ozone and ionized particles above, frozen volcanic mineral and ancient moss below, threaded with the ghostly sweetness of distant glacial ice.",
        prompt: "Northern lights in Iceland",
        creator: "Synesthesia.ai",
        created_at: new Date().toISOString(),
        ingredients: [
          { name: "Ozonic Notes", cas_number: "N/A-ozone", category: "fresh", note_type: "top", percentage: 12, intensity: 7 },
          { name: "Eucalyptus", cas_number: "8000-48-4", category: "aromatic", note_type: "top", percentage: 8, intensity: 5 },
          { name: "Galbanum", cas_number: "8023-91-4", category: "green", note_type: "top", percentage: 6, intensity: 4 },
          { name: "Violet Leaf", cas_number: "8024-08-6", category: "green", note_type: "top", percentage: 5, intensity: 4 },
          { name: "Marine Notes", cas_number: "N/A-marine", category: "aquatic", note_type: "middle", percentage: 10, intensity: 6 },
          { name: "Cypress", cas_number: "8013-86-3", category: "woody", note_type: "middle", percentage: 9, intensity: 5 },
          { name: "Soil", cas_number: "N/A-soil", category: "earthy", note_type: "middle", percentage: 5, intensity: 4 },
          { name: "Vetiver", cas_number: "8016-96-4", category: "woody", note_type: "base", percentage: 14, intensity: 7 },
          { name: "Cedar", cas_number: "8000-27-9", category: "woody", note_type: "base", percentage: 12, intensity: 6 },
          { name: "Ambergris", cas_number: "N/A-amb", category: "amber", note_type: "base", percentage: 8, intensity: 5 },
          { name: "White Musk", cas_number: "N/A-wmusk", category: "musk", note_type: "base", percentage: 11, intensity: 4 },
        ],
        evolution: {
          opening: ["Ozonic Notes", "Eucalyptus", "Galbanum", "Violet Leaf"],
          heart: ["Marine Notes", "Cypress", "Soil"],
          drydown: ["Vetiver", "Cedar", "Ambergris", "White Musk"],
        },
        accords: [
          { name: "Arctic Atmosphere", strength: 80, ingredients: ["Ozonic Notes", "Marine Notes", "Eucalyptus"] },
          { name: "Frozen Earth", strength: 70, ingredients: ["Vetiver", "Cedar", "Soil"] },
        ],
        mood: ["Mystical", "Cold", "Vast"],
        season: ["Winter"],
        intensity: 6,
        longevity_hours: 8,
        sillage: "moderate",
        safety: {
          ifra_compliance: true,
          allergens: ["Linalool", "Limonene"],
          max_skin_concentration: 18,
          notes: "Safe for general use. Eucalyptus may be sensitizing in rare cases.",
        },
        tags: ["Arctic", "Aurora", "Mineral", "Cold", "Ethereal"],
      },
      texture: {
        name: "Glacial Glass",
        description:
          "The sensation of pressing your bare palm against a sheet of ancient glacial ice -- impossibly smooth, searingly cold, unyielding, with a thin film of meltwater where your warmth meets the frozen surface.",
        physical_properties: {
          friction: 0.08,
          grain: 0.03,
          temperature: -0.85,
          resistance: 0.95,
          elasticity: 0.05,
          moisture: 0.25,
          roughness: 0.05,
        },
        haptic_pattern: [
          { type: "vibrate", duration_ms: 200, intensity: 0.9, frequency_hz: 250 },
          { type: "pause", duration_ms: 50, intensity: 0 },
          { type: "vibrate", duration_ms: 150, intensity: 0.7, frequency_hz: 200 },
          { type: "pause", duration_ms: 100, intensity: 0 },
          { type: "vibrate", duration_ms: 300, intensity: 0.4, frequency_hz: 150 },
          { type: "vibrate", duration_ms: 100, intensity: 0.2, frequency_hz: 100 },
          { type: "pause", duration_ms: 200, intensity: 0 },
          { type: "vibrate", duration_ms: 400, intensity: 0.15, frequency_hz: 80 },
          { type: "pause", duration_ms: 150, intensity: 0 },
          { type: "vibrate", duration_ms: 250, intensity: 0.3, frequency_hz: 120 },
          { type: "vibrate", duration_ms: 100, intensity: 0.1, frequency_hz: 60 },
          { type: "pause", duration_ms: 300, intensity: 0 },
        ],
        waveform: [
          0.9, 0.85, 0.78, 0.7, 0.6, 0.5, 0.42, 0.38, 0.35, 0.33,
          0.3, 0.28, 0.25, 0.22, 0.2, 0.18, 0.17, 0.16, 0.15, 0.15,
          0.14, 0.14, 0.13, 0.13, 0.12, 0.12, 0.12, 0.11, 0.11, 0.1,
          0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1,
          0.11, 0.12, 0.13, 0.15, 0.18, 0.2, 0.22, 0.25, 0.27, 0.3,
          0.28, 0.25, 0.2, 0.17, 0.15, 0.13, 0.12, 0.11, 0.1, 0.1,
          0.09, 0.08, 0.07, 0.06,
        ],
        material_reference: "Polished glacial ice with thin meltwater film",
      },
      taste: {
        name: "Aurora Elixir",
        description:
          "A frozen, luminous cocktail that captures the electric chill of the arctic sky -- mineral clarity cut with botanical bitterness, a whisper of juniper and eucalyptus, finished with a shimmering, effervescent tingle that evokes ionized air.",
        taste_profile: {
          sweet: 3,
          sour: 4,
          salty: 2,
          bitter: 5,
          umami: 1,
        },
        mouthfeel: {
          temperature: "frozen",
          viscosity: "thin",
          carbonation: 6,
          astringency: 3,
          spiciness: 1,
        },
        aroma_contribution: [
          "juniper berry",
          "eucalyptus",
          "ice crystal",
          "mineral water",
          "dried moss",
          "ozone",
        ],
        home_recipe: {
          ingredients: [
            { name: "premium gin (juniper-forward)", amount: "60", unit: "ml", notes: "such as Hendricks or a Scandinavian gin" },
            { name: "blue curacao", amount: "15", unit: "ml", notes: "for color and mild bitterness" },
            { name: "butterfly pea flower tea", amount: "30", unit: "ml", notes: "brewed strong and chilled, shifts color with pH" },
            { name: "fresh lemon juice", amount: "20", unit: "ml", notes: "freshly squeezed" },
            { name: "simple syrup", amount: "10", unit: "ml", notes: "1:1 sugar to water ratio" },
            { name: "tonic water", amount: "60", unit: "ml", notes: "chilled, high-quality such as Fever-Tree" },
            { name: "fresh eucalyptus sprig", amount: "1", unit: "sprig", notes: "for garnish and aromatic expression" },
            { name: "edible silver luster dust", amount: "1/8", unit: "teaspoon", notes: "food-grade, for shimmer effect" },
            { name: "sea salt flakes", amount: "1", unit: "pinch", notes: "Maldon or similar, for rim" },
          ],
          instructions: [
            "Chill a coupe glass in the freezer for at least 15 minutes.",
            "Brew the butterfly pea flower tea by steeping 5-6 dried flowers in 30ml of hot water for 3 minutes. Strain and chill.",
            "Rim the frozen glass with a thin line of sea salt flakes on one side.",
            "In a cocktail shaker, combine gin, blue curacao, butterfly pea flower tea, lemon juice, and simple syrup with ice.",
            "Shake vigorously for 15 seconds until the shaker is frosted.",
            "Strain into the chilled coupe glass.",
            "Slowly pour the tonic water down the side of the glass to create layered effervescence.",
            "Stir in the edible silver luster dust to create a shimmering, aurora-like effect.",
            "Gently bruise the eucalyptus sprig between your palms and place it on top as garnish.",
            "Serve immediately while still ice-cold.",
          ],
          yield: "1 cocktail",
          difficulty: "medium",
        },
        molecular_formula: {
          compounds: [
            { name: "Citric Acid", cas_number: "77-92-9", concentration_ppm: 3500, function: "Primary acidulant providing tart, clean sourness", food_grade: true },
            { name: "Sucrose", cas_number: "57-50-1", concentration_ppm: 8000, function: "Base sweetener for balance", food_grade: true },
            { name: "Sodium Chloride", cas_number: "7647-14-5", concentration_ppm: 800, function: "Mineral salinity and flavor enhancement", food_grade: true },
            { name: "Quinine Hydrochloride", cas_number: "130-89-2", concentration_ppm: 80, function: "Characteristic tonic bitterness", food_grade: true },
            { name: "alpha-Pinene", cas_number: "80-56-8", concentration_ppm: 15, function: "Juniper/pine aromatic note", food_grade: true },
            { name: "Eucalyptol (1,8-Cineole)", cas_number: "470-82-6", concentration_ppm: 25, function: "Cool eucalyptus aromatic, camphoraceous freshness", food_grade: true },
            { name: "Linalool", cas_number: "78-70-6", concentration_ppm: 10, function: "Floral-herbal bridging aromatic", food_grade: true },
            { name: "Carbon Dioxide", cas_number: "124-38-9", concentration_ppm: 5000, function: "Carbonation and effervescent mouthfeel", food_grade: true },
            { name: "Menthol", cas_number: "89-78-1", concentration_ppm: 5, function: "Subtle cooling sensation without mint flavor", food_grade: true },
          ],
          solvent: "water (purified)",
          preparation: [
            "Dissolve sucrose and sodium chloride in purified water at room temperature.",
            "Add citric acid and stir until fully dissolved.",
            "Add quinine hydrochloride and stir (ensure concentration remains below 83 ppm per FDA guidelines for beverages).",
            "Add aromatic compounds (alpha-pinene, eucalyptol, linalool, menthol) pre-dissolved in food-grade ethanol at 0.1% concentration.",
            "Carbonate the solution to 3.5 volumes of CO2 using a carbonation system.",
            "Chill to -2C (just above freezing for the alcohol content) before serving.",
          ],
        },
        food_safety: {
          allergens: [],
          dietary: ["vegan", "gluten-free"],
          shelf_life: "Serve immediately. Carbonation dissipates within 30 minutes.",
        },
      },
      pulse: {
        bpm: 55,
        rhythm_description:
          "Slow, deep, and steady -- the unhurried rhythm of someone standing in silent awe under an infinite sky. Each beat is full and deliberate, with a slightly extended pause between the lub and the dub, as if the heart itself is holding its breath.",
        haptic_sequence: [
          { delay_ms: 0, intensity: 0.8, duration_ms: 120 },
          { delay_ms: 200, intensity: 0.5, duration_ms: 80 },
          { delay_ms: 891, intensity: 0.0, duration_ms: 0 },
        ],
        mode: "archive",
        emotional_state: "serene awe",
        breathing_guide: {
          inhale_ms: 4000,
          hold_ms: 7000,
          exhale_ms: 8000,
        },
      },
    },
    unified_narrative:
      "You stand on frozen volcanic rock, the air sharp with ozone and glacial mineral. Green and purple light ripples silently across the sky, painting your skin in shifting emerald. The cold presses against your fingertips like polished ice. You taste the arctic on your tongue -- juniper, frost, a faint electric tingle. Your heartbeat slows, deep and steady, matching the vast, patient rhythm of the aurora overhead.",
    mood: ["serene", "mystical", "cold", "vast", "awe-inspiring"],
    intensity: 7,
  },

  "tokyo jazz bar at midnight": {
    prompt: "Tokyo jazz bar at midnight",
    scene_analysis:
      "A tiny basement jazz bar in Shinjuku, no more than eight seats at the counter. The room is bathed in warm amber from a single pendant lamp and the glow of backlit whiskey bottles. A tenor saxophone weaves through a slow, smoky standard while the bartender polishes a crystal glass. Cigarette smoke (or its memory) lingers in the wood. The air is warm, close, intimate. This is a scene of sophisticated solitude and late-night refuge -- the kind of place where time slows to the tempo of a ballad.",
    modules: {
      atmosphere: {
        lighting: {
          color_hex: "#E8A317",
          brightness: 15,
          temperature_kelvin: 2700,
          animation: "candle",
          speed: 20,
        },
        sound: {
          genre: "late-night jazz",
          mood: "smoky and intimate",
          bpm_range: [70, 95],
          volume: 40,
          ambient_layer: "city",
          ambient_volume: 10,
        },
        temperature: {
          target_f: 72,
          change_direction: "neutral",
        },
        visual: {
          scene_description:
            "A narrow counter with eight leather stools, backlit shelves of amber whiskey bottles, a single warm pendant lamp, dark wood paneling.",
          color_palette: ["#E8A317", "#4A3520", "#1A1A1A", "#C8956C", "#2D1810"],
          animation_style: "gentle candle flicker",
        },
        evolution: {
          phases: [
            {
              name: "Last Set",
              duration_minutes: 30,
              atmosphere: {
                sound: { bpm_range: [60, 80], mood: "slow and contemplative" },
              },
            },
            {
              name: "Closing Time",
              duration_minutes: 15,
              atmosphere: {
                lighting: { brightness: 8 },
                sound: { volume: 25, ambient_volume: 15 },
              },
            },
          ],
        },
      },
      texture: {
        name: "Worn Leather Bar Stool",
        description:
          "The seat of a bar stool that has held a thousand late-night conversations -- buttery soft leather, warm from the previous occupant, with the faintest tackiness where the surface has been polished smooth by years of use.",
        physical_properties: {
          friction: 0.45,
          grain: 0.15,
          temperature: 0.3,
          resistance: 0.55,
          elasticity: 0.4,
          moisture: 0.05,
          roughness: 0.12,
        },
        haptic_pattern: [
          { type: "vibrate", duration_ms: 300, intensity: 0.35, frequency_hz: 80 },
          { type: "vibrate", duration_ms: 200, intensity: 0.25, frequency_hz: 60 },
          { type: "pause", duration_ms: 100, intensity: 0 },
          { type: "vibrate", duration_ms: 250, intensity: 0.3, frequency_hz: 70 },
          { type: "vibrate", duration_ms: 350, intensity: 0.2, frequency_hz: 50 },
          { type: "pause", duration_ms: 150, intensity: 0 },
          { type: "vibrate", duration_ms: 200, intensity: 0.15, frequency_hz: 45 },
          { type: "vibrate", duration_ms: 400, intensity: 0.25, frequency_hz: 65 },
          { type: "pause", duration_ms: 100, intensity: 0 },
          { type: "vibrate", duration_ms: 300, intensity: 0.2, frequency_hz: 55 },
        ],
        waveform: [
          0.35, 0.33, 0.3, 0.28, 0.25, 0.23, 0.22, 0.2, 0.2, 0.22,
          0.25, 0.28, 0.3, 0.3, 0.28, 0.25, 0.22, 0.2, 0.18, 0.17,
          0.15, 0.15, 0.17, 0.2, 0.22, 0.25, 0.27, 0.28, 0.27, 0.25,
          0.22, 0.2, 0.2, 0.22, 0.25, 0.28, 0.3, 0.3, 0.28, 0.25,
          0.22, 0.2, 0.18, 0.15, 0.13, 0.12, 0.12, 0.13, 0.15, 0.18,
          0.2, 0.22, 0.25, 0.25, 0.23, 0.2, 0.18, 0.15, 0.13, 0.12,
          0.1, 0.1, 0.1, 0.1,
        ],
        material_reference: "Aged, well-worn full-grain leather",
      },
      pulse: {
        bpm: 62,
        rhythm_description:
          "Relaxed and unhurried, the rhythm of someone nursing a drink and letting the music carry them. Steady, warm, with the faintest irregularity that comes from deep contentment rather than excitement.",
        haptic_sequence: [
          { delay_ms: 0, intensity: 0.6, duration_ms: 100 },
          { delay_ms: 180, intensity: 0.35, duration_ms: 70 },
          { delay_ms: 788, intensity: 0.0, duration_ms: 0 },
        ],
        mode: "archive",
        emotional_state: "warm contentment",
        breathing_guide: {
          inhale_ms: 4000,
          hold_ms: 2000,
          exhale_ms: 6000,
        },
      },
    },
    unified_narrative:
      "You settle onto the worn leather stool, its warmth rising through your clothes. Amber light pools on the dark wood counter as a saxophone traces a melody you almost remember. The air smells of aged oak, whiskey, and something faintly smoky that might be incense or memory. Your heartbeat finds the tempo of the bass line -- unhurried, content, perfectly at home in this small room at the edge of midnight.",
    mood: ["intimate", "warm", "sophisticated", "nostalgic", "contemplative"],
    intensity: 5,
  },
};

/**
 * Finds the best matching demo decomposition for a given prompt.
 * Falls back to the "default" (Northern Lights) demo if no close match is found.
 */
export function findDemoDecomposition(prompt: string): SensoryDecomposition {
  const normalizedPrompt = prompt.toLowerCase().trim();

  for (const [key, decomposition] of Object.entries(DEMO_DECOMPOSITIONS)) {
    if (key === "default") continue;
    if (
      normalizedPrompt.includes(key) ||
      key.includes(normalizedPrompt) ||
      computeSimilarity(normalizedPrompt, key) > 0.4
    ) {
      return decomposition;
    }
  }

  // Return the default demo with the user's prompt inserted
  const defaultDemo = { ...DEMO_DECOMPOSITIONS["default"] };
  defaultDemo.prompt = prompt;
  return defaultDemo;
}

/**
 * Simple word-overlap similarity metric (Jaccard index).
 * Used for fuzzy matching demo prompts.
 */
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}
