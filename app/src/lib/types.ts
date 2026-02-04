// --- Core Scent Types ---

export type NoteType = "top" | "middle" | "base";

export type ScentCategory =
  | "citrus"
  | "floral"
  | "woody"
  | "fresh"
  | "oriental"
  | "musk"
  | "green"
  | "fruity"
  | "spicy"
  | "aquatic"
  | "gourmand"
  | "leather"
  | "aromatic"
  | "amber"
  | "powdery"
  | "earthy"
  | "smoky"
  | "herbal"
  | "animalic"
  | "balsamic";

export interface Ingredient {
  name: string;
  cas_number: string;
  category: ScentCategory;
  note_type: NoteType;
  percentage: number;
  intensity: number; // 1-10
}

export interface IngredientDatabaseEntry {
  name: string;
  cas_number: string;
  category: ScentCategory;
  note_type: NoteType;
  typical_percentage_range: { min: number; max: number };
  volatility: "high" | "medium" | "low";
  description: string;
  common_pairings: string[];
}

export interface Evolution {
  opening: string[];
  heart: string[];
  drydown: string[];
}

export interface Accord {
  name: string;
  strength: number; // 0-100
  ingredients: string[];
}

export interface SafetyInfo {
  ifra_compliance: boolean;
  allergens: string[];
  max_skin_concentration: number;
  notes: string;
}

export interface HardwareConfig {
  device_id: string;
  firmware_version: string;
  channels: number;
  calibration_date: string;
  cartridges: {
    slot: number;
    ingredient: string;
    fill_level: number;
  }[];
}

export interface OSCFormula {
  id: string;
  version: string;
  name: string;
  description: string;
  prompt: string;
  creator: string;
  created_at: string;
  ingredients: Ingredient[];
  evolution: Evolution;
  accords: Accord[];
  mood: string[];
  season: string[];
  intensity: number; // 1-10
  longevity_hours: number;
  sillage: "intimate" | "moderate" | "strong" | "enormous";
  safety: SafetyInfo;
  tags: string[];
}

// --- Gallery and Display Types ---

export interface ScentCard {
  id: string;
  name: string;
  description: string;
  creator: string;
  creator_avatar?: string;
  ingredients: Ingredient[];
  mood: string[];
  season: string[];
  tags: string[];
  likes: number;
  remixes: number;
  created_at: string;
  intensity: number;
}

// --- User Types ---

export interface ScentGenome {
  citrus: number;
  floral: number;
  woody: number;
  fresh: number;
  oriental: number;
  gourmand: number;
  spicy: number;
  aquatic: number;
  green: number;
  fruity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  scent_genome: ScentGenome;
  created_scents: ScentCard[];
  saved_scents: ScentCard[];
  stats: {
    scents_created: number;
    total_likes: number;
    total_remixes: number;
  };
  joined_date: string;
}

// --- API Types ---

export interface GenerateRequest {
  prompt: string;
  preferences?: {
    intensity?: number;
    longevity?: number;
    style?: string;
  };
}

export interface GenerateResponse {
  formula: OSCFormula;
  suggestions: string[];
  processing_time_ms: number;
}

export interface IterateRequest {
  formula_id: string;
  modification: string;
  current_formula: OSCFormula;
}

export interface IterateResponse {
  formula: OSCFormula;
  changes: {
    added: string[];
    removed: string[];
    adjusted: { name: string; old_pct: number; new_pct: number }[];
  };
  suggestions: string[];
}

// --- History Types ---

export interface HistoryEntry {
  id: string;
  prompt: string;
  formula: OSCFormula;
  timestamp: string;
  type: "initial" | "iteration";
}
