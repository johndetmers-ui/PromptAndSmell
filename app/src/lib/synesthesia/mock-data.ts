// ---------------------------------------------------------------------------
// Synesthesia.ai -- Mock Data for Demo Mode
// ---------------------------------------------------------------------------
// Contains mock textures, flavors, atmospheres, and unified experiences
// for all synesthesia modules when no API key is configured.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TEXTURE TYPES
// ---------------------------------------------------------------------------

export interface TexturePhysicalProperties {
  friction: number;       // 0-1
  grain: number;          // 0-1
  temperature: number;    // -1 (cold) to 1 (hot)
  resistance: number;     // 0-1
  elasticity: number;     // 0-1
  moisture: number;       // 0-1
  roughness: number;      // 0-1
}

export interface HapticEvent {
  type: "vibrate" | "pause";
  duration_ms: number;
  intensity: number;      // 0-1
  frequency_hz?: number;
}

export interface TextureProfile {
  name: string;
  description: string;
  physical_properties: TexturePhysicalProperties;
  haptic_pattern: HapticEvent[];
  waveform: number[];     // 256 normalized amplitude values
  material_reference: string;
}

// ---------------------------------------------------------------------------
// FLAVOR TYPES
// ---------------------------------------------------------------------------

export interface TasteProfileValues {
  sweet: number;   // 0-10
  sour: number;    // 0-10
  salty: number;   // 0-10
  bitter: number;  // 0-10
  umami: number;   // 0-10
}

export interface MouthfeelProfile {
  temperature: string;
  viscosity: string;
  carbonation: number;    // 0-10
  astringency: number;    // 0-10
  spiciness: number;      // 0-10
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
  notes: string;
}

export interface HomeRecipe {
  ingredients: RecipeIngredient[];
  instructions: string[];
  yield: string;
  difficulty: "easy" | "medium" | "advanced";
  time_minutes: number;
}

export interface MolecularCompound {
  name: string;
  cas_number: string;
  concentration_ppm: number;
  function: string;
  food_grade: boolean;
}

export interface MolecularFormula {
  compounds: MolecularCompound[];
  solvent: string;
  preparation: string[];
}

export interface FoodSafety {
  allergens: string[];
  dietary: string[];
  shelf_life: string;
}

export interface FlavorFormula {
  name: string;
  description: string;
  taste_profile: TasteProfileValues;
  mouthfeel: MouthfeelProfile;
  aroma_contribution: string[];
  home_recipe: HomeRecipe;
  molecular_formula: MolecularFormula;
  food_safety: FoodSafety;
  pairing_suggestions: string[];
}

// ---------------------------------------------------------------------------
// ATMOSPHERE TYPES
// ---------------------------------------------------------------------------

export interface AtmosphereProfile {
  name: string;
  description: string;
  mood: string;
  color_palette: string[];
  ambient_sounds: string[];
  scent_notes: string[];
  lighting: string;
  temperature_feel: string;
  energy_level: number;    // 0-10
  intimacy: number;        // 0-10
}

// ---------------------------------------------------------------------------
// UNIFIED EXPERIENCE TYPE
// ---------------------------------------------------------------------------

export interface UnifiedExperience {
  name: string;
  prompt: string;
  texture: TextureProfile;
  flavor: FlavorFormula;
  atmosphere: AtmosphereProfile;
}

// ---------------------------------------------------------------------------
// WAVEFORM GENERATORS
// ---------------------------------------------------------------------------

function generateSmoothWaveform(): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    waveform.push(
      0.3 + 0.15 * Math.sin(t * Math.PI * 4) + 0.05 * Math.sin(t * Math.PI * 12)
    );
  }
  return waveform;
}

function generateRoughWaveform(): number[] {
  const waveform: number[] = [];
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 256; i++) {
    const base = 0.4 + 0.3 * Math.sin(i / 256 * Math.PI * 6);
    const noise = (seededRandom() - 0.5) * 0.5;
    waveform.push(Math.max(0, Math.min(1, base + noise)));
  }
  return waveform;
}

function generateColdWaveform(): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const highFreq = 0.3 * Math.sin(t * Math.PI * 32);
    const envelope = 0.5 + 0.3 * Math.sin(t * Math.PI * 2);
    waveform.push(Math.max(0, Math.min(1, envelope + highFreq * 0.3)));
  }
  return waveform;
}

function generateSoftWaveform(): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    waveform.push(
      0.25 + 0.12 * Math.sin(t * Math.PI * 3) +
      0.08 * Math.sin(t * Math.PI * 7) +
      0.04 * Math.cos(t * Math.PI * 11)
    );
  }
  return waveform;
}

function generateMetallicWaveform(): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const sharp = 0.5 * Math.abs(Math.sin(t * Math.PI * 16));
    const base = 0.2 + 0.1 * Math.sin(t * Math.PI * 2);
    waveform.push(Math.max(0, Math.min(1, base + sharp * 0.4)));
  }
  return waveform;
}

function generateWetWaveform(): number[] {
  const waveform: number[] = [];
  let seed = 77;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const flow = 0.4 + 0.2 * Math.sin(t * Math.PI * 5);
    const drip = seededRandom() > 0.92 ? 0.3 : 0;
    waveform.push(Math.max(0, Math.min(1, flow + drip)));
  }
  return waveform;
}

function generateElasticWaveform(): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const bounce = Math.abs(Math.sin(t * Math.PI * 8)) * Math.exp(-t * 2);
    const base = 0.3 + 0.2 * Math.sin(t * Math.PI * 3);
    waveform.push(Math.max(0, Math.min(1, base + bounce * 0.4)));
  }
  return waveform;
}

function generateWoodWaveform(): number[] {
  const waveform: number[] = [];
  let seed = 101;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 256; i++) {
    const t = i / 256;
    const grain = 0.35 + 0.15 * Math.sin(t * Math.PI * 10);
    const knot = seededRandom() > 0.85 ? 0.15 : 0;
    waveform.push(Math.max(0, Math.min(1, grain + knot)));
  }
  return waveform;
}

// ---------------------------------------------------------------------------
// MOCK TEXTURES (8)
// ---------------------------------------------------------------------------

export const mockTextures: TextureProfile[] = [
  {
    name: "Silk",
    description: "Ultra-smooth woven fabric with a cool, liquid-like drape. Almost frictionless under fingertips, with a subtle directional grain following the weave.",
    physical_properties: {
      friction: 0.1,
      grain: 0.08,
      temperature: -0.2,
      resistance: 0.15,
      elasticity: 0.3,
      moisture: 0.05,
      roughness: 0.05,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 200, intensity: 0.1, frequency_hz: 40 },
      { type: "pause", duration_ms: 100, intensity: 0 },
      { type: "vibrate", duration_ms: 300, intensity: 0.08, frequency_hz: 35 },
      { type: "pause", duration_ms: 80, intensity: 0 },
      { type: "vibrate", duration_ms: 250, intensity: 0.12, frequency_hz: 42 },
      { type: "pause", duration_ms: 120, intensity: 0 },
    ],
    waveform: generateSmoothWaveform(),
    material_reference: "Mulberry silk charmeuse, 19 momme weight",
  },
  {
    name: "Sandpaper",
    description: "Coarse abrasive surface with irregular mineral grain. High friction catches the skin with each pass, creating a distinctive scratching sensation.",
    physical_properties: {
      friction: 0.92,
      grain: 0.95,
      temperature: 0.1,
      resistance: 0.85,
      elasticity: 0.02,
      moisture: 0.0,
      roughness: 0.95,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 50, intensity: 0.9, frequency_hz: 200 },
      { type: "pause", duration_ms: 20, intensity: 0 },
      { type: "vibrate", duration_ms: 80, intensity: 0.7, frequency_hz: 180 },
      { type: "pause", duration_ms: 15, intensity: 0 },
      { type: "vibrate", duration_ms: 40, intensity: 0.95, frequency_hz: 220 },
      { type: "pause", duration_ms: 25, intensity: 0 },
      { type: "vibrate", duration_ms: 60, intensity: 0.8, frequency_hz: 190 },
      { type: "pause", duration_ms: 10, intensity: 0 },
    ],
    waveform: generateRoughWaveform(),
    material_reference: "Aluminum oxide sandpaper, 60-grit",
  },
  {
    name: "Ice",
    description: "Perfectly smooth frozen surface radiating intense cold. Slightly slippery with zero grain, the cold penetrates through contact almost immediately.",
    physical_properties: {
      friction: 0.05,
      grain: 0.0,
      temperature: -0.95,
      resistance: 0.9,
      elasticity: 0.0,
      moisture: 0.7,
      roughness: 0.02,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 30, intensity: 0.6, frequency_hz: 300 },
      { type: "pause", duration_ms: 40, intensity: 0 },
      { type: "vibrate", duration_ms: 25, intensity: 0.55, frequency_hz: 320 },
      { type: "pause", duration_ms: 45, intensity: 0 },
      { type: "vibrate", duration_ms: 35, intensity: 0.65, frequency_hz: 280 },
      { type: "pause", duration_ms: 35, intensity: 0 },
    ],
    waveform: generateColdWaveform(),
    material_reference: "Clear glacial ice, -15 degrees Celsius",
  },
  {
    name: "Velvet",
    description: "Dense pile fabric with a warm, plush surface. Directional nap creates shifting resistance depending on stroke direction, like petting an animal.",
    physical_properties: {
      friction: 0.45,
      grain: 0.3,
      temperature: 0.35,
      resistance: 0.3,
      elasticity: 0.5,
      moisture: 0.1,
      roughness: 0.15,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 300, intensity: 0.3, frequency_hz: 60 },
      { type: "pause", duration_ms: 50, intensity: 0 },
      { type: "vibrate", duration_ms: 250, intensity: 0.25, frequency_hz: 55 },
      { type: "pause", duration_ms: 80, intensity: 0 },
      { type: "vibrate", duration_ms: 350, intensity: 0.35, frequency_hz: 65 },
      { type: "pause", duration_ms: 40, intensity: 0 },
    ],
    waveform: generateSoftWaveform(),
    material_reference: "Cotton velvet, medium pile, theater curtain weight",
  },
  {
    name: "Brushed Steel",
    description: "Cold industrial metal with visible directional brush marks. Hard and unyielding, with micro-ridges you can feel as your finger crosses the grain lines.",
    physical_properties: {
      friction: 0.35,
      grain: 0.4,
      temperature: -0.7,
      resistance: 1.0,
      elasticity: 0.0,
      moisture: 0.0,
      roughness: 0.3,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 100, intensity: 0.5, frequency_hz: 250 },
      { type: "pause", duration_ms: 30, intensity: 0 },
      { type: "vibrate", duration_ms: 80, intensity: 0.45, frequency_hz: 260 },
      { type: "pause", duration_ms: 25, intensity: 0 },
      { type: "vibrate", duration_ms: 120, intensity: 0.55, frequency_hz: 240 },
      { type: "pause", duration_ms: 35, intensity: 0 },
    ],
    waveform: generateMetallicWaveform(),
    material_reference: "304 stainless steel, #4 brushed finish",
  },
  {
    name: "Wet Clay",
    description: "Cool, slippery mineral earth saturated with water. Yields and deforms under pressure, leaving residue on your fingers. Smooth yet substantial.",
    physical_properties: {
      friction: 0.25,
      grain: 0.2,
      temperature: -0.15,
      resistance: 0.2,
      elasticity: 0.7,
      moisture: 0.9,
      roughness: 0.15,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 200, intensity: 0.2, frequency_hz: 50 },
      { type: "pause", duration_ms: 60, intensity: 0 },
      { type: "vibrate", duration_ms: 250, intensity: 0.25, frequency_hz: 45 },
      { type: "pause", duration_ms: 40, intensity: 0 },
      { type: "vibrate", duration_ms: 180, intensity: 0.18, frequency_hz: 55 },
      { type: "pause", duration_ms: 70, intensity: 0 },
    ],
    waveform: generateWetWaveform(),
    material_reference: "Potter's stoneware clay, wheel-throwing consistency",
  },
  {
    name: "Rubber Ball",
    description: "Warm, bouncy synthetic surface with a distinctive grip. High elasticity makes it spring back from compression, with a slightly tacky surface texture.",
    physical_properties: {
      friction: 0.7,
      grain: 0.1,
      temperature: 0.2,
      resistance: 0.4,
      elasticity: 0.95,
      moisture: 0.0,
      roughness: 0.2,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 150, intensity: 0.6, frequency_hz: 100 },
      { type: "pause", duration_ms: 80, intensity: 0 },
      { type: "vibrate", duration_ms: 100, intensity: 0.4, frequency_hz: 80 },
      { type: "pause", duration_ms: 60, intensity: 0 },
      { type: "vibrate", duration_ms: 70, intensity: 0.3, frequency_hz: 60 },
      { type: "pause", duration_ms: 100, intensity: 0 },
    ],
    waveform: generateElasticWaveform(),
    material_reference: "Natural rubber, Shore A 40 durometer",
  },
  {
    name: "Aged Oak",
    description: "Warm, dry hardwood with pronounced grain lines. Deep grooves alternate with smooth ridges, telling centuries of growth in tactile relief.",
    physical_properties: {
      friction: 0.55,
      grain: 0.75,
      temperature: 0.15,
      resistance: 0.8,
      elasticity: 0.05,
      moisture: 0.05,
      roughness: 0.6,
    },
    haptic_pattern: [
      { type: "vibrate", duration_ms: 120, intensity: 0.5, frequency_hz: 120 },
      { type: "pause", duration_ms: 40, intensity: 0 },
      { type: "vibrate", duration_ms: 80, intensity: 0.35, frequency_hz: 100 },
      { type: "pause", duration_ms: 60, intensity: 0 },
      { type: "vibrate", duration_ms: 150, intensity: 0.55, frequency_hz: 130 },
      { type: "pause", duration_ms: 30, intensity: 0 },
      { type: "vibrate", duration_ms: 60, intensity: 0.3, frequency_hz: 90 },
      { type: "pause", duration_ms: 50, intensity: 0 },
    ],
    waveform: generateWoodWaveform(),
    material_reference: "European white oak, 200-year-old reclaimed beam",
  },
];

// ---------------------------------------------------------------------------
// MOCK FLAVORS (6)
// ---------------------------------------------------------------------------

export const mockFlavors: FlavorFormula[] = [
  {
    name: "Sunset in a Glass",
    description: "The warmth of golden hour captured as flavor -- citrus brightness fading into honeyed warmth, with a spiced finish like the last rays of light.",
    taste_profile: { sweet: 7, sour: 4, salty: 1, bitter: 2, umami: 1 },
    mouthfeel: {
      temperature: "warm",
      viscosity: "medium, syrupy",
      carbonation: 2,
      astringency: 1,
      spiciness: 3,
    },
    aroma_contribution: [
      "Blood orange zest",
      "Saffron threads",
      "Wildflower honey",
      "Cardamom seed",
      "Warm vanilla",
      "Toasted coconut",
    ],
    home_recipe: {
      ingredients: [
        { name: "Blood orange juice", amount: "120", unit: "ml", notes: "Freshly squeezed" },
        { name: "Wildflower honey", amount: "30", unit: "ml", notes: "Raw, unfiltered" },
        { name: "Saffron threads", amount: "4", unit: "threads", notes: "Steep in warm water 10 min" },
        { name: "Cardamom pods", amount: "3", unit: "pods", notes: "Lightly crushed" },
        { name: "Vanilla extract", amount: "5", unit: "ml", notes: "Pure Madagascar" },
        { name: "Coconut cream", amount: "30", unit: "ml", notes: "Full fat" },
        { name: "Cayenne pepper", amount: "1", unit: "pinch", notes: "For warmth, not heat" },
        { name: "Water", amount: "60", unit: "ml", notes: "Warm, for saffron infusion" },
      ],
      instructions: [
        "Steep saffron threads in warm water for 10 minutes until deeply golden.",
        "Gently heat honey with crushed cardamom pods over low heat for 3 minutes. Do not boil.",
        "Strain cardamom from honey and let cool to room temperature.",
        "Combine blood orange juice, saffron water, and cardamom honey in a mixing glass.",
        "Add vanilla extract and coconut cream, whisking until smooth.",
        "Add a single pinch of cayenne and stir to combine.",
        "Serve over a single large ice cube in a rocks glass.",
        "Garnish with a thin blood orange wheel and a cardamom pod.",
      ],
      yield: "1 serving (approx. 250ml)",
      difficulty: "medium",
      time_minutes: 25,
    },
    molecular_formula: {
      compounds: [
        { name: "Limonene", cas_number: "5989-27-5", concentration_ppm: 120, function: "Citrus top note", food_grade: true },
        { name: "Linalool", cas_number: "78-70-6", concentration_ppm: 45, function: "Floral bridge note", food_grade: true },
        { name: "Vanillin", cas_number: "121-33-5", concentration_ppm: 80, function: "Sweet base warmth", food_grade: true },
        { name: "Safranal", cas_number: "116-26-7", concentration_ppm: 5, function: "Saffron character", food_grade: true },
        { name: "Capsaicin", cas_number: "404-86-4", concentration_ppm: 2, function: "Warmth/spice perception", food_grade: true },
        { name: "gamma-Decalactone", cas_number: "706-14-9", concentration_ppm: 30, function: "Peach/coconut creaminess", food_grade: true },
      ],
      solvent: "Food-grade ethanol (40% v/v) with purified water",
      preparation: [
        "Dissolve vanillin and gamma-decalactone in ethanol at 40 degrees Celsius.",
        "Add limonene and linalool to the ethanol solution.",
        "Prepare capsaicin micro-emulsion separately in water phase.",
        "Combine ethanol and water phases slowly with constant stirring.",
        "Add safranal last to preserve volatile character.",
        "Allow 48 hours maturation at room temperature before use.",
      ],
    },
    food_safety: {
      allergens: [],
      dietary: ["Vegetarian", "Gluten-Free"],
      shelf_life: "3 days refrigerated",
    },
    pairing_suggestions: [
      "Grilled peach and burrata salad",
      "Saffron risotto",
      "Dark chocolate truffles with sea salt",
      "Warm naan bread with honey butter",
      "Vanilla panna cotta",
    ],
  },
  {
    name: "Anti-Coffee",
    description: "Everything coffee is not: sweet, cold, light, and effervescent. A bright, refreshing inverse that tingles and lifts rather than grounding and warming.",
    taste_profile: { sweet: 8, sour: 3, salty: 0, bitter: 0, umami: 0 },
    mouthfeel: {
      temperature: "ice cold",
      viscosity: "thin, water-like",
      carbonation: 8,
      astringency: 0,
      spiciness: 0,
    },
    aroma_contribution: [
      "Cotton candy",
      "Fresh lychee",
      "Vanilla cream soda",
      "White peach",
      "Cold milk",
      "Marshmallow",
    ],
    home_recipe: {
      ingredients: [
        { name: "Lychee juice", amount: "100", unit: "ml", notes: "Chilled" },
        { name: "Vanilla syrup", amount: "20", unit: "ml", notes: "Simple syrup with vanilla bean" },
        { name: "Heavy cream", amount: "30", unit: "ml", notes: "Cold" },
        { name: "White peach puree", amount: "40", unit: "ml", notes: "Strained" },
        { name: "Sparkling water", amount: "120", unit: "ml", notes: "Very cold" },
        { name: "Marshmallow fluff", amount: "15", unit: "g", notes: "For float" },
        { name: "Citric acid", amount: "1", unit: "g", notes: "For brightness" },
      ],
      instructions: [
        "Combine lychee juice, vanilla syrup, and white peach puree in a tall glass.",
        "Add citric acid and stir until dissolved.",
        "Fill glass 3/4 with crushed ice.",
        "Slowly pour cold sparkling water over the ice.",
        "Float heavy cream on top by pouring over the back of a spoon.",
        "Top with a small dollop of marshmallow fluff.",
        "Serve immediately with a glass straw. Do not stir -- let layers integrate as you drink.",
      ],
      yield: "1 serving (approx. 320ml)",
      difficulty: "easy",
      time_minutes: 10,
    },
    molecular_formula: {
      compounds: [
        { name: "Ethyl maltol", cas_number: "4940-11-8", concentration_ppm: 100, function: "Cotton candy sweetness", food_grade: true },
        { name: "cis-Rose oxide", cas_number: "16409-43-1", concentration_ppm: 8, function: "Lychee character", food_grade: true },
        { name: "Vanillin", cas_number: "121-33-5", concentration_ppm: 60, function: "Vanilla cream note", food_grade: true },
        { name: "gamma-Undecalactone", cas_number: "104-67-6", concentration_ppm: 25, function: "Peach creaminess", food_grade: true },
        { name: "Ethyl butyrate", cas_number: "105-54-4", concentration_ppm: 15, function: "Fruity effervescence", food_grade: true },
      ],
      solvent: "Purified water with 0.1% polysorbate 80",
      preparation: [
        "Create stock solution of ethyl maltol and vanillin in warm water.",
        "Add gamma-undecalactone as a pre-dissolved emulsion in polysorbate 80.",
        "Add cis-rose oxide and ethyl butyrate to the emulsified solution.",
        "Dilute to target concentration with cold purified water.",
        "Carbonate to 4.0 volumes CO2 using a carbonation system.",
        "Store at 2-4 degrees Celsius. Use within 24 hours of carbonation.",
      ],
    },
    food_safety: {
      allergens: ["Dairy"],
      dietary: ["Vegetarian", "Gluten-Free"],
      shelf_life: "1 day refrigerated (carbonation dissipates)",
    },
    pairing_suggestions: [
      "Fresh fruit tart with pastry cream",
      "Mochi ice cream",
      "Angel food cake",
      "White chocolate covered strawberries",
      "Coconut macaroons",
    ],
  },
  {
    name: "Liquid Nostalgia",
    description: "The taste of being wrapped in a warm blanket on a cold night -- vanilla milk, a hint of cinnamon toast, and the gentle sweetness of being safe and small.",
    taste_profile: { sweet: 6, sour: 1, salty: 1, bitter: 1, umami: 2 },
    mouthfeel: {
      temperature: "warm",
      viscosity: "thick, creamy",
      carbonation: 0,
      astringency: 0,
      spiciness: 1,
    },
    aroma_contribution: [
      "Warm whole milk",
      "Madagascar vanilla",
      "Ceylon cinnamon",
      "Toasted bread",
      "Brown butter",
      "Raw honey",
    ],
    home_recipe: {
      ingredients: [
        { name: "Whole milk", amount: "250", unit: "ml", notes: "Full-fat, not ultra-pasteurized" },
        { name: "Vanilla bean", amount: "1/2", unit: "pod", notes: "Split and scraped" },
        { name: "Ceylon cinnamon stick", amount: "1", unit: "stick", notes: "3-inch piece" },
        { name: "Salted butter", amount: "15", unit: "g", notes: "Brown it first" },
        { name: "Raw honey", amount: "15", unit: "ml", notes: "Local wildflower preferred" },
        { name: "White bread", amount: "1", unit: "slice", notes: "Crusts removed, toasted golden" },
        { name: "Nutmeg", amount: "1", unit: "pinch", notes: "Freshly grated" },
        { name: "Sea salt", amount: "1", unit: "tiny pinch", notes: "Fleur de sel" },
      ],
      instructions: [
        "Brown the butter in a small saucepan until it smells nutty and turns amber. Set aside.",
        "Toast bread until golden. Tear into small pieces.",
        "Heat milk in a saucepan with vanilla bean seeds, scraped pod, and cinnamon stick.",
        "Bring to a gentle simmer (not boiling) and add torn toast pieces.",
        "Steep for 8 minutes on lowest heat, stirring occasionally.",
        "Remove from heat. Discard vanilla pod and cinnamon stick.",
        "Blend mixture until smooth, then strain through a fine mesh sieve.",
        "Stir in brown butter, honey, salt, and nutmeg.",
        "Serve warm in your favorite mug. Best enjoyed wrapped in a blanket.",
      ],
      yield: "1 serving (approx. 280ml)",
      difficulty: "medium",
      time_minutes: 25,
    },
    molecular_formula: {
      compounds: [
        { name: "Vanillin", cas_number: "121-33-5", concentration_ppm: 90, function: "Vanilla warmth", food_grade: true },
        { name: "Cinnamaldehyde", cas_number: "104-55-2", concentration_ppm: 15, function: "Cinnamon spice", food_grade: true },
        { name: "Diacetyl", cas_number: "431-03-8", concentration_ppm: 8, function: "Buttery richness", food_grade: true },
        { name: "2-Acetylpyrazine", cas_number: "22047-25-2", concentration_ppm: 5, function: "Toasty bread note", food_grade: true },
        { name: "Furaneol", cas_number: "3658-77-3", concentration_ppm: 20, function: "Caramelized warmth", food_grade: true },
        { name: "delta-Decalactone", cas_number: "705-86-2", concentration_ppm: 12, function: "Creamy milk character", food_grade: true },
      ],
      solvent: "Warm whole milk base (3.5% fat)",
      preparation: [
        "Prepare vanillin and furaneol pre-mix in a small amount of warm milk.",
        "Add cinnamaldehyde to a separate ethanol micro-portion (food-grade).",
        "Combine diacetyl, 2-acetylpyrazine, and delta-decalactone in fat phase.",
        "Heat main milk portion to 65 degrees Celsius.",
        "Incorporate fat phase into warm milk with high-speed mixing.",
        "Add aqueous pre-mixes and ethanol portion.",
        "Hold at 60 degrees Celsius for 15 minutes to marry flavors.",
        "Serve warm. Do not exceed 70 degrees Celsius to preserve volatiles.",
      ],
    },
    food_safety: {
      allergens: ["Dairy", "Gluten", "Wheat"],
      dietary: ["Vegetarian"],
      shelf_life: "2 days refrigerated, reheat gently",
    },
    pairing_suggestions: [
      "Shortbread cookies",
      "Banana bread, warm from the oven",
      "Roasted chestnuts",
      "Apple pie with cheddar cheese",
      "Cinnamon rolls with cream cheese icing",
    ],
  },
  {
    name: "Deep Purple Elixir",
    description: "If the color deep purple had a flavor: dark berries with a mysterious herbal undertone, floral and slightly bitter, like drinking a twilight sky.",
    taste_profile: { sweet: 5, sour: 6, salty: 0, bitter: 4, umami: 1 },
    mouthfeel: {
      temperature: "cool",
      viscosity: "medium, juice-like",
      carbonation: 0,
      astringency: 5,
      spiciness: 1,
    },
    aroma_contribution: [
      "Blackberry",
      "Lavender blossom",
      "Elderflower",
      "Concord grape",
      "Violet candy",
      "Black tea tannin",
    ],
    home_recipe: {
      ingredients: [
        { name: "Blackberries", amount: "150", unit: "g", notes: "Ripe, muddled" },
        { name: "Concord grape juice", amount: "80", unit: "ml", notes: "Pure, not from concentrate" },
        { name: "Lavender syrup", amount: "15", unit: "ml", notes: "Culinary lavender steeped in simple syrup" },
        { name: "Elderflower cordial", amount: "20", unit: "ml", notes: "St-Germain or homemade" },
        { name: "Lemon juice", amount: "15", unit: "ml", notes: "Fresh" },
        { name: "Strong black tea", amount: "60", unit: "ml", notes: "Earl Grey, cooled" },
        { name: "Butterfly pea flower", amount: "2", unit: "g", notes: "For color shift, optional" },
      ],
      instructions: [
        "Muddle blackberries in the bottom of a mixing glass.",
        "Brew butterfly pea flowers in 30ml hot water, then cool. This creates a deep blue base.",
        "Combine grape juice, lavender syrup, and elderflower cordial.",
        "Add cooled black tea and lemon juice. The acid will shift the blue to purple.",
        "Fine-strain muddled blackberries into the mixture.",
        "Stir gently. Serve in a clear glass over clear ice to showcase the color.",
        "Garnish with fresh lavender sprig and a single blackberry.",
      ],
      yield: "1 serving (approx. 300ml)",
      difficulty: "medium",
      time_minutes: 20,
    },
    molecular_formula: {
      compounds: [
        { name: "Linalool", cas_number: "78-70-6", concentration_ppm: 30, function: "Lavender floral note", food_grade: true },
        { name: "Methyl anthranilate", cas_number: "134-20-3", concentration_ppm: 40, function: "Grape character", food_grade: true },
        { name: "beta-Ionone", cas_number: "14901-07-6", concentration_ppm: 10, function: "Violet/berry depth", food_grade: true },
        { name: "Citric acid", cas_number: "77-92-9", concentration_ppm: 3000, function: "Sourness/brightness", food_grade: true },
        { name: "Tannic acid", cas_number: "1401-55-4", concentration_ppm: 200, function: "Astringent body", food_grade: true },
        { name: "Furaneol", cas_number: "3658-77-3", concentration_ppm: 15, function: "Berry sweetness", food_grade: true },
      ],
      solvent: "Purified water with 8% sucrose",
      preparation: [
        "Dissolve sucrose in warm purified water.",
        "Add tannic acid and citric acid to the sugar water.",
        "Create aroma concentrate: dissolve linalool, methyl anthranilate, beta-ionone, and furaneol in food-grade propylene glycol.",
        "Add aroma concentrate to the acidified sugar water.",
        "Add butterfly pea flower extract for natural purple coloration.",
        "Chill to 4 degrees Celsius before serving.",
      ],
    },
    food_safety: {
      allergens: [],
      dietary: ["Vegan", "Gluten-Free", "Nut-Free"],
      shelf_life: "2 days refrigerated",
    },
    pairing_suggestions: [
      "Dark chocolate mousse",
      "Goat cheese and fig crostini",
      "Lavender shortbread",
      "Grilled lamb chops with herb crust",
      "Brie with blackberry compote",
    ],
  },
  {
    name: "Rain as Flavor",
    description: "Petrichor translated to the tongue: mineral water with a green, earthy freshness, the ghost of ozone, and the subtle sweetness of wet stone and moss.",
    taste_profile: { sweet: 2, sour: 3, salty: 2, bitter: 3, umami: 4 },
    mouthfeel: {
      temperature: "cool",
      viscosity: "thin, water-like",
      carbonation: 3,
      astringency: 2,
      spiciness: 0,
    },
    aroma_contribution: [
      "Wet stone",
      "Fresh moss",
      "Cucumber water",
      "Geosmin (earth)",
      "Ozone",
      "Green tea",
    ],
    home_recipe: {
      ingredients: [
        { name: "Mineral water", amount: "200", unit: "ml", notes: "High mineral content (e.g., Gerolsteiner)" },
        { name: "Cucumber", amount: "50", unit: "g", notes: "Peeled, muddled" },
        { name: "Fresh mint", amount: "3", unit: "leaves", notes: "Gently bruised" },
        { name: "Matcha powder", amount: "1/4", unit: "tsp", notes: "Ceremonial grade" },
        { name: "Lemon juice", amount: "5", unit: "ml", notes: "Just a whisper" },
        { name: "Sea salt", amount: "1", unit: "pinch", notes: "Grey Celtic sea salt" },
        { name: "Shiso leaf", amount: "1", unit: "leaf", notes: "Optional, for earthy depth" },
        { name: "Sparkling water", amount: "50", unit: "ml", notes: "Light carbonation" },
      ],
      instructions: [
        "Muddle cucumber with mint and shiso leaf in the bottom of a glass.",
        "Whisk matcha into a tiny amount of warm water until smooth (no lumps).",
        "Strain cucumber mixture through fine mesh into a clean glass.",
        "Add mineral water, matcha paste, lemon juice, and sea salt.",
        "Stir gently until combined.",
        "Add sparkling water last for gentle effervescence.",
        "Serve in a stone or ceramic cup to enhance the mineral experience.",
        "Drink slowly. Close your eyes. Think of rain.",
      ],
      yield: "1 serving (approx. 280ml)",
      difficulty: "easy",
      time_minutes: 10,
    },
    molecular_formula: {
      compounds: [
        { name: "Geosmin", cas_number: "19700-21-1", concentration_ppm: 0.05, function: "Petrichor/earth note", food_grade: true },
        { name: "cis-3-Hexen-1-ol", cas_number: "928-96-1", concentration_ppm: 8, function: "Fresh green/cut grass", food_grade: true },
        { name: "Linalool", cas_number: "78-70-6", concentration_ppm: 12, function: "Herbal freshness", food_grade: true },
        { name: "trans-2-Nonenal", cas_number: "18829-56-6", concentration_ppm: 0.5, function: "Cucumber character", food_grade: true },
        { name: "Calcium chloride", cas_number: "10043-52-4", concentration_ppm: 500, function: "Mineral mouthfeel", food_grade: true },
      ],
      solvent: "Purified water with dissolved minerals (Ca 80ppm, Mg 40ppm, Na 20ppm)",
      preparation: [
        "Prepare mineral water base by dissolving calcium chloride and magnesium sulfate.",
        "Create aroma micro-concentrate: geosmin and trans-2-nonenal at 100x in ethanol.",
        "Add cis-3-hexen-1-ol and linalool to the ethanol concentrate.",
        "Dose 0.1ml of concentrate per liter of mineral water.",
        "Lightly carbonate to 2.5 volumes CO2.",
        "CRITICAL: Geosmin is detectable at 5 parts per trillion. Use extreme precision. Overdose produces unpleasant muddy flavor.",
      ],
    },
    food_safety: {
      allergens: [],
      dietary: ["Vegan", "Gluten-Free", "Nut-Free", "Sugar-Free"],
      shelf_life: "1 day refrigerated",
    },
    pairing_suggestions: [
      "Sashimi with yuzu ponzu",
      "Steamed edamame with sea salt",
      "Cold soba noodles",
      "Fresh oysters",
      "Cucumber and cream cheese tea sandwiches",
    ],
  },
  {
    name: "Umami Cloud",
    description: "Pure savory intensity rendered ethereal: a warm, enveloping broth-like essence that is simultaneously light as air and deeply satisfying, like a hug from the inside.",
    taste_profile: { sweet: 2, sour: 1, salty: 5, bitter: 1, umami: 9 },
    mouthfeel: {
      temperature: "hot",
      viscosity: "medium, broth-like",
      carbonation: 0,
      astringency: 0,
      spiciness: 2,
    },
    aroma_contribution: [
      "Dashi (kelp and bonito)",
      "Roasted mushroom",
      "Aged parmesan rind",
      "Miso paste",
      "Toasted sesame",
      "Truffle essence",
    ],
    home_recipe: {
      ingredients: [
        { name: "Kombu (dried kelp)", amount: "10", unit: "g", notes: "Wipe clean, do not wash" },
        { name: "Bonito flakes", amount: "15", unit: "g", notes: "Thick cut preferred" },
        { name: "Dried shiitake mushrooms", amount: "3", unit: "pieces", notes: "Rehydrated, liquid reserved" },
        { name: "White miso paste", amount: "15", unit: "g", notes: "Shinshu or Shiro" },
        { name: "Parmesan rind", amount: "1", unit: "piece", notes: "Approx 3cm, aged 24+ months" },
        { name: "Soy sauce", amount: "5", unit: "ml", notes: "Naturally brewed" },
        { name: "Mirin", amount: "10", unit: "ml", notes: "Hon mirin, not aji-mirin" },
        { name: "Truffle oil", amount: "3", unit: "drops", notes: "Real truffle infusion, not synthetic" },
        { name: "Water", amount: "500", unit: "ml", notes: "Filtered" },
      ],
      instructions: [
        "Soak kombu in cold water for 30 minutes. Heat slowly until just before boiling. Remove kombu.",
        "Add bonito flakes to the hot kombu water. Steep for 3 minutes, then strain.",
        "In a separate pot, simmer parmesan rind in the dashi for 15 minutes on low heat.",
        "Add mushroom soaking liquid and sliced rehydrated shiitakes.",
        "Remove from heat. Dissolve miso paste through a strainer into the broth (never boil miso).",
        "Add soy sauce and mirin. Stir gently.",
        "Ladle into a warm bowl. Add 2-3 drops of truffle oil on the surface.",
        "Inhale deeply before drinking. The aroma is half the experience.",
      ],
      yield: "2 servings (approx. 250ml each)",
      difficulty: "medium",
      time_minutes: 55,
    },
    molecular_formula: {
      compounds: [
        { name: "Monosodium glutamate", cas_number: "142-47-2", concentration_ppm: 800, function: "Primary umami source", food_grade: true },
        { name: "Disodium inosinate", cas_number: "4691-65-0", concentration_ppm: 100, function: "Umami synergist (fish)", food_grade: true },
        { name: "Disodium guanylate", cas_number: "5550-12-9", concentration_ppm: 100, function: "Umami synergist (mushroom)", food_grade: true },
        { name: "2,4-Dithiapentane", cas_number: "1618-26-4", concentration_ppm: 0.2, function: "Truffle aroma", food_grade: true },
        { name: "1-Octen-3-ol", cas_number: "3391-86-4", concentration_ppm: 10, function: "Mushroom character", food_grade: true },
        { name: "Methional", cas_number: "3268-49-3", concentration_ppm: 5, function: "Brothy/savory depth", food_grade: true },
      ],
      solvent: "Dashi base (kombu and katsuobushi extract in water)",
      preparation: [
        "Prepare traditional dashi: kombu cold extraction 30 min, heat to 80C, add katsuobushi, steep 3 min, strain.",
        "Dissolve MSG, IMP (disodium inosinate), and GMP (disodium guanylate) in warm dashi.",
        "The combination of glutamate + inosinate + guanylate creates synergistic umami up to 8x intensity.",
        "Add 1-octen-3-ol and methional in a micro-dose ethanol solution.",
        "Add 2,4-dithiapentane at exactly 0.2ppm -- this is at the detection threshold for truffle character.",
        "Serve at 65-70 degrees Celsius for optimal aroma release.",
      ],
    },
    food_safety: {
      allergens: ["Fish", "Soy", "Dairy"],
      dietary: ["Gluten-Free"],
      shelf_life: "3 days refrigerated, reheat below 70C",
    },
    pairing_suggestions: [
      "Steamed rice with furikake",
      "Soft-boiled egg with soy sauce",
      "Grilled maitake mushrooms",
      "Handmade udon noodles",
      "Aged gouda cheese",
    ],
  },
];

// ---------------------------------------------------------------------------
// MOCK ATMOSPHERES (6)
// ---------------------------------------------------------------------------

export const mockAtmospheres: AtmosphereProfile[] = [
  {
    name: "Rainy Tokyo Alley",
    description: "Neon-lit rain puddles reflecting kanji signs, the hiss of steam from a ramen shop, warm golden light spilling from a tiny doorway.",
    mood: "contemplative",
    color_palette: ["#1a1a2e", "#e94560", "#0f3460", "#16213e", "#ffc300"],
    ambient_sounds: ["Light rain on pavement", "Distant traffic", "Ramen shop chatter", "Dripping gutters"],
    scent_notes: ["Wet asphalt", "Tonkotsu broth", "Cigarette smoke", "Rain"],
    lighting: "Warm amber from shop windows, cool blue-pink neon reflections",
    temperature_feel: "Cool and damp, with pockets of warmth near doorways",
    energy_level: 3,
    intimacy: 8,
  },
  {
    name: "Midsummer Forest Clearing",
    description: "Dappled sunlight through birch leaves, wildflowers swaying, the drone of bees, and the far-off sound of a stream.",
    mood: "peaceful",
    color_palette: ["#2d5a27", "#8dc63f", "#ffd93d", "#87ceeb", "#f5f5dc"],
    ambient_sounds: ["Birdsong", "Gentle breeze", "Bees buzzing", "Distant stream"],
    scent_notes: ["Fresh grass", "Wildflower pollen", "Pine resin", "Warm earth"],
    lighting: "Bright, dappled golden-green filtered through leaves",
    temperature_feel: "Warm with a gentle breeze, perfect summer temperature",
    energy_level: 4,
    intimacy: 5,
  },
  {
    name: "Underground Jazz Club",
    description: "Low ceilings, warm wood, the shimmer of a cymbal, blue smoke curling through a single spotlight on a saxophone player.",
    mood: "sultry",
    color_palette: ["#1c1c1c", "#8b4513", "#cd853f", "#4169e1", "#daa520"],
    ambient_sounds: ["Muted trumpet", "Upright bass", "Ice in glasses", "Murmured conversation"],
    scent_notes: ["Bourbon", "Leather seats", "Cigar smoke", "Perfume trails"],
    lighting: "Single warm spotlight, deep shadows, amber candles on tables",
    temperature_feel: "Warm and close, body heat mingling in a small space",
    energy_level: 5,
    intimacy: 9,
  },
  {
    name: "Arctic Observatory",
    description: "Glass dome overlooking a frozen tundra. The aurora borealis dances in curtains of green and violet. Complete silence except for the hum of instruments.",
    mood: "awe",
    color_palette: ["#0a0a2e", "#00ff88", "#7b2d8e", "#1a1a3e", "#c0c0c0"],
    ambient_sounds: ["Deep silence", "Faint instrument hum", "Distant wind", "Crackling ice"],
    scent_notes: ["Cold metal", "Recycled air", "Hot coffee from a thermos"],
    lighting: "Aurora green-violet glow from above, instrument panel blue-white",
    temperature_feel: "Climate-controlled warmth inside, visible extreme cold outside",
    energy_level: 2,
    intimacy: 6,
  },
  {
    name: "Moroccan Rooftop Sunset",
    description: "Terracotta rooftop overlooking the medina, brass lanterns flickering to life, the call to prayer echoing across the city as the sun sinks into orange and pink.",
    mood: "transcendent",
    color_palette: ["#ff6b35", "#c44536", "#f7b267", "#772e25", "#eddea4"],
    ambient_sounds: ["Call to prayer", "Market murmur below", "Sparrows", "Wind chimes"],
    scent_notes: ["Mint tea", "Cumin and coriander", "Orange blossom", "Warm stone"],
    lighting: "Golden hour amber fading to warm lantern glow",
    temperature_feel: "Warm stone radiating heat from the day, cooling evening breeze",
    energy_level: 4,
    intimacy: 7,
  },
  {
    name: "Deep Ocean Dive",
    description: "Descending into blue-black water, bioluminescent creatures drifting past like underwater stars, the rhythmic sound of your own breathing in the regulator.",
    mood: "meditative",
    color_palette: ["#000033", "#001a66", "#0044cc", "#00ffcc", "#330066"],
    ambient_sounds: ["Breathing through regulator", "Whale song in distance", "Bubble streams", "Deep current hum"],
    scent_notes: ["Neoprene", "Salt", "Metallic regulator air"],
    lighting: "Bioluminescent blue-green points, headlamp beam in dark water",
    temperature_feel: "Progressively colder with depth, pressure increasing",
    energy_level: 2,
    intimacy: 10,
  },
];

// ---------------------------------------------------------------------------
// MOCK UNIFIED EXPERIENCES (3)
// ---------------------------------------------------------------------------

export const mockUnifiedExperiences: UnifiedExperience[] = [
  {
    name: "Grandmother's House",
    prompt: "The feeling of visiting your grandmother's house as a child",
    texture: mockTextures[3], // Velvet
    flavor: mockFlavors[2],   // Liquid Nostalgia
    atmosphere: {
      name: "Sunday Afternoon Parlor",
      description: "Lace curtains filtering afternoon light, a ticking clock, the warmth of a wool rug under bare feet, and the distant sound of a radio.",
      mood: "nostalgic",
      color_palette: ["#f5e6d0", "#c49a6c", "#8b6914", "#fffff0", "#d4a574"],
      ambient_sounds: ["Ticking clock", "Distant radio", "Kettle whistle", "Floorboards creaking"],
      scent_notes: ["Lavender sachets", "Baking cookies", "Old wood furniture", "Rose water"],
      lighting: "Warm, diffused through lace curtains, honey-golden",
      temperature_feel: "Warm and enveloping, slightly stuffy in a comforting way",
      energy_level: 2,
      intimacy: 9,
    },
  },
  {
    name: "Cyberpunk Night Market",
    prompt: "A cyberpunk night market in the year 2077",
    texture: mockTextures[4], // Brushed Steel
    flavor: mockFlavors[5],   // Umami Cloud
    atmosphere: {
      name: "Neon Bazaar 2077",
      description: "Holographic signs flickering above street food stalls, synthetic rain dripping from overpass cables, drones delivering bowls of ramen overhead.",
      mood: "electric",
      color_palette: ["#0f0f23", "#ff00ff", "#00ffff", "#ff6600", "#1a1a3e"],
      ambient_sounds: ["Synth music", "Sizzling woks", "Drone propellers", "Crowd chatter in five languages"],
      scent_notes: ["Grilled meat", "Ozone from electronics", "Synthetic rain", "Incense"],
      lighting: "Neon magenta and cyan, holographic overlays, harsh LED white from stalls",
      temperature_feel: "Humid warmth from cooking, cool synthetic rain mist",
      energy_level: 9,
      intimacy: 3,
    },
  },
  {
    name: "Meditation at Dawn",
    prompt: "Meditating on a mountain peak at sunrise",
    texture: mockTextures[7], // Aged Oak (for the wooden meditation platform)
    flavor: mockFlavors[4],   // Rain as Flavor
    atmosphere: {
      name: "Summit Silence",
      description: "Above the clouds on a worn stone plateau, the first light painting the sky in rose and gold, absolute stillness broken only by your own breath.",
      mood: "transcendent",
      color_palette: ["#2d1b69", "#ff6b6b", "#ffd93d", "#ffffff", "#87ceeb"],
      ambient_sounds: ["Wind across stone", "Your own breathing", "Distant eagle cry", "Silence"],
      scent_notes: ["Cold mountain air", "Lichen on stone", "Morning dew", "Nothing"],
      lighting: "Pre-dawn deep blue transitioning to golden-rose sunrise",
      temperature_feel: "Bracing cold, warming as the sun rises over the horizon",
      energy_level: 3,
      intimacy: 10,
    },
  },
];

// ---------------------------------------------------------------------------
// HELPER: get a mock texture by name-matching prompt keywords
// ---------------------------------------------------------------------------

export function getMockTextureForPrompt(prompt: string): TextureProfile {
  const lower = prompt.toLowerCase();
  if (lower.includes("silk") || lower.includes("smooth") || lower.includes("satin")) return mockTextures[0];
  if (lower.includes("sand") || lower.includes("rough") || lower.includes("grit")) return mockTextures[1];
  if (lower.includes("ice") || lower.includes("frozen") || lower.includes("cold")) return mockTextures[2];
  if (lower.includes("velvet") || lower.includes("soft") || lower.includes("plush")) return mockTextures[3];
  if (lower.includes("metal") || lower.includes("steel") || lower.includes("iron")) return mockTextures[4];
  if (lower.includes("clay") || lower.includes("wet") || lower.includes("mud")) return mockTextures[5];
  if (lower.includes("rubber") || lower.includes("bounce") || lower.includes("elastic")) return mockTextures[6];
  if (lower.includes("wood") || lower.includes("oak") || lower.includes("bark")) return mockTextures[7];
  // Default: pick based on prompt length hash
  const hash = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return mockTextures[hash % mockTextures.length];
}

export function getMockFlavorForPrompt(prompt: string): FlavorFormula {
  const lower = prompt.toLowerCase();
  if (lower.includes("sunset") || lower.includes("golden") || lower.includes("warm")) return mockFlavors[0];
  if (lower.includes("opposite") || lower.includes("coffee") || lower.includes("cold") || lower.includes("sweet")) return mockFlavors[1];
  if (lower.includes("nostalg") || lower.includes("grandm") || lower.includes("comfort")) return mockFlavors[2];
  if (lower.includes("purple") || lower.includes("color") || lower.includes("berry")) return mockFlavors[3];
  if (lower.includes("rain") || lower.includes("water") || lower.includes("mineral")) return mockFlavors[4];
  if (lower.includes("umami") || lower.includes("savory") || lower.includes("broth")) return mockFlavors[5];
  const hash = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return mockFlavors[hash % mockFlavors.length];
}
