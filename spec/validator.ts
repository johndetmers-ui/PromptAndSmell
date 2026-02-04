/**
 * Open Scent Code (OSC) v1.0 Validator
 *
 * Validates OSC JSON documents against the OSC v1.0 specification.
 * Checks structural validity, type correctness, enum values,
 * percentage sums, required fields, and constraint satisfaction.
 *
 * Usage:
 *   import { validateOSC } from './validator';
 *   const result = validateOSC(myOscData);
 *   if (result.valid) { ... } else { console.error(result.errors); }
 */

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export const INGREDIENT_CATEGORIES = [
  "citrus",
  "floral",
  "woody",
  "oriental",
  "fresh",
  "aromatic",
  "musk",
  "amber",
  "green",
  "fruity",
  "spicy",
  "gourmand",
  "aquatic",
  "leather",
  "animalic",
  "balsamic",
  "powdery",
  "earthy",
  "smoky",
  "herbal",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export const NOTE_TYPES = ["top", "middle", "base", "modifier"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const VOLATILITY_LEVELS = ["high", "medium", "low"] as const;
export type Volatility = (typeof VOLATILITY_LEVELS)[number];

export const SEASONS = [
  "spring",
  "summer",
  "autumn",
  "winter",
  "all",
] as const;
export type Season = (typeof SEASONS)[number];

export const GENDERS = ["masculine", "feminine", "unisex"] as const;
export type Gender = (typeof GENDERS)[number];

export const CONCENTRATION_CATEGORIES = [
  "edc",
  "edt",
  "edp",
  "parfum",
  "extrait",
  "solinote",
  "body_mist",
  "oil",
] as const;
export type ConcentrationCategory =
  (typeof CONCENTRATION_CATEGORIES)[number];

export const SILLAGE_LEVELS = [
  "intimate",
  "moderate",
  "strong",
  "enormous",
] as const;
export type Sillage = (typeof SILLAGE_LEVELS)[number];

export const ACCORD_STRENGTHS = [
  "dominant",
  "supporting",
  "subtle",
] as const;
export type AccordStrength = (typeof ACCORD_STRENGTHS)[number];

export const COST_TIERS = [
  "budget",
  "moderate",
  "premium",
  "luxury",
] as const;
export type CostTier = (typeof COST_TIERS)[number];

export interface Ingredient {
  ingredient: string;
  cas_number?: string;
  iupac_name?: string;
  category: IngredientCategory;
  note_type: NoteType;
  percentage: number;
  intensity?: number;
  volatility?: Volatility;
  odor_description?: string;
  natural?: boolean;
  supplier?: string;
  cost_tier?: CostTier;
}

export interface Metadata {
  name: string;
  description?: string;
  author?: string;
  version?: string;
  created?: string;
  updated?: string;
  tags?: string[];
  mood?: string[];
  season?: Season[];
  intensity?: number;
  gender?: Gender;
  occasion?: string[];
  inspiration?: string;
  parent_id?: string;
  license?: string;
}

export interface Accord {
  name: string;
  description?: string;
  contributing_ingredients?: string[];
  strength?: AccordStrength;
}

export interface EvolutionPhase {
  duration_minutes: number;
  dominant_ingredients: string[];
  character: string;
  intensity?: number;
  sillage?: Sillage;
}

export interface Evolution {
  opening: EvolutionPhase;
  heart: EvolutionPhase;
  drydown: EvolutionPhase;
  total_longevity_hours?: number;
}

export interface Allergen {
  name: string;
  cas_number?: string;
  percentage: number;
  declaration_required?: boolean;
}

export interface RestrictedIngredient {
  ingredient: string;
  cas_number?: string;
  limit_percent: number;
  actual_percent: number;
  compliant?: boolean;
}

export interface Safety {
  ifra_compliant: boolean;
  ifra_version?: string;
  ifra_category?: number;
  allergens?: Allergen[];
  concentration?: ConcentrationCategory;
  max_skin_exposure_percent?: number;
  restricted_ingredients?: RestrictedIngredient[];
  phototoxic?: boolean;
  vegan?: boolean;
  eu_cosmetics_regulation_compliant?: boolean;
  warnings?: string[];
}

export interface ChannelMapping {
  ingredient: string;
  channel: number;
  volume_ml: number;
  flow_rate?: number;
  dispense_order?: number;
  pre_stir?: boolean;
}

export interface Hardware {
  device_profile: string;
  total_volume_ml?: number;
  channel_mappings: ChannelMapping[];
  mix_duration_seconds?: number;
  temperature_celsius?: number;
  calibration_date?: string;
  notes?: string;
}

export interface OSCFormula {
  osc_version: string;
  metadata: Metadata;
  formula: Ingredient[];
  accords?: Accord[];
  evolution?: Evolution;
  safety?: Safety;
  hardware?: Hardware;
}

// ---------------------------------------------------------------------------
// Validation Result Types
// ---------------------------------------------------------------------------

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  path: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Helper Utilities
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;
const SEMVER_PATTERN = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/;
const ISO8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
const TAG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9 _-]*$/;
const PARENT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const IFRA_VERSION_PATTERN = /^\d+(\.\d+)?$/;

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

function validateMetadata(
  metadata: unknown,
  issues: ValidationIssue[]
): void {
  const path = "metadata";

  if (!isObject(metadata)) {
    issues.push({
      path,
      message: "metadata must be an object.",
      severity: "error",
    });
    return;
  }

  // Required: name
  if (!isString(metadata.name)) {
    issues.push({
      path: `${path}.name`,
      message: "metadata.name is required and must be a string.",
      severity: "error",
    });
  } else {
    if (metadata.name.length < 1) {
      issues.push({
        path: `${path}.name`,
        message: "metadata.name must be at least 1 character.",
        severity: "error",
      });
    }
    if (metadata.name.length > 200) {
      issues.push({
        path: `${path}.name`,
        message: "metadata.name must not exceed 200 characters.",
        severity: "error",
      });
    }
  }

  // Optional: description
  if (metadata.description !== undefined) {
    if (!isString(metadata.description)) {
      issues.push({
        path: `${path}.description`,
        message: "metadata.description must be a string.",
        severity: "error",
      });
    } else if (metadata.description.length > 2000) {
      issues.push({
        path: `${path}.description`,
        message: "metadata.description must not exceed 2000 characters.",
        severity: "error",
      });
    }
  }

  // Optional: author
  if (metadata.author !== undefined) {
    if (!isString(metadata.author)) {
      issues.push({
        path: `${path}.author`,
        message: "metadata.author must be a string.",
        severity: "error",
      });
    } else if (metadata.author.length > 200) {
      issues.push({
        path: `${path}.author`,
        message: "metadata.author must not exceed 200 characters.",
        severity: "error",
      });
    }
  }

  // Optional: version
  if (metadata.version !== undefined) {
    if (!isString(metadata.version)) {
      issues.push({
        path: `${path}.version`,
        message: "metadata.version must be a string.",
        severity: "error",
      });
    } else if (!SEMVER_PATTERN.test(metadata.version)) {
      issues.push({
        path: `${path}.version`,
        message:
          "metadata.version must follow semver pattern (e.g., '1.0.0').",
        severity: "error",
      });
    }
  }

  // Optional: created
  if (metadata.created !== undefined) {
    if (!isString(metadata.created)) {
      issues.push({
        path: `${path}.created`,
        message: "metadata.created must be an ISO 8601 datetime string.",
        severity: "error",
      });
    } else if (!ISO8601_PATTERN.test(metadata.created)) {
      issues.push({
        path: `${path}.created`,
        message:
          "metadata.created must be a valid ISO 8601 datetime (e.g., '2026-01-15T10:00:00Z').",
        severity: "warning",
      });
    }
  }

  // Optional: updated
  if (metadata.updated !== undefined) {
    if (!isString(metadata.updated)) {
      issues.push({
        path: `${path}.updated`,
        message: "metadata.updated must be an ISO 8601 datetime string.",
        severity: "error",
      });
    } else if (!ISO8601_PATTERN.test(metadata.updated)) {
      issues.push({
        path: `${path}.updated`,
        message: "metadata.updated must be a valid ISO 8601 datetime.",
        severity: "warning",
      });
    }
  }

  // Optional: tags
  if (metadata.tags !== undefined) {
    if (!isArray(metadata.tags)) {
      issues.push({
        path: `${path}.tags`,
        message: "metadata.tags must be an array of strings.",
        severity: "error",
      });
    } else {
      if (metadata.tags.length > 20) {
        issues.push({
          path: `${path}.tags`,
          message: "metadata.tags must not contain more than 20 items.",
          severity: "error",
        });
      }
      const seen = new Set<string>();
      for (let i = 0; i < metadata.tags.length; i++) {
        const tag = metadata.tags[i];
        if (!isString(tag)) {
          issues.push({
            path: `${path}.tags[${i}]`,
            message: "Each tag must be a string.",
            severity: "error",
          });
        } else {
          if (tag.length < 1 || tag.length > 50) {
            issues.push({
              path: `${path}.tags[${i}]`,
              message: "Each tag must be 1-50 characters.",
              severity: "error",
            });
          }
          if (!TAG_PATTERN.test(tag)) {
            issues.push({
              path: `${path}.tags[${i}]`,
              message:
                "Tags must start with an alphanumeric character and contain only alphanumeric characters, spaces, hyphens, and underscores.",
              severity: "error",
            });
          }
          if (seen.has(tag.toLowerCase())) {
            issues.push({
              path: `${path}.tags[${i}]`,
              message: `Duplicate tag: "${tag}".`,
              severity: "warning",
            });
          }
          seen.add(tag.toLowerCase());
        }
      }
    }
  }

  // Optional: mood
  if (metadata.mood !== undefined) {
    if (!isArray(metadata.mood)) {
      issues.push({
        path: `${path}.mood`,
        message: "metadata.mood must be an array of strings.",
        severity: "error",
      });
    } else {
      if (metadata.mood.length > 10) {
        issues.push({
          path: `${path}.mood`,
          message: "metadata.mood must not contain more than 10 items.",
          severity: "error",
        });
      }
      for (let i = 0; i < metadata.mood.length; i++) {
        if (!isString(metadata.mood[i])) {
          issues.push({
            path: `${path}.mood[${i}]`,
            message: "Each mood must be a string.",
            severity: "error",
          });
        }
      }
    }
  }

  // Optional: season
  if (metadata.season !== undefined) {
    if (!isArray(metadata.season)) {
      issues.push({
        path: `${path}.season`,
        message: "metadata.season must be an array.",
        severity: "error",
      });
    } else {
      if (metadata.season.length > 5) {
        issues.push({
          path: `${path}.season`,
          message: "metadata.season must not contain more than 5 items.",
          severity: "error",
        });
      }
      for (let i = 0; i < metadata.season.length; i++) {
        const s = metadata.season[i];
        if (
          !isString(s) ||
          !(SEASONS as readonly string[]).includes(s)
        ) {
          issues.push({
            path: `${path}.season[${i}]`,
            message: `Invalid season value: "${s}". Must be one of: ${SEASONS.join(", ")}.`,
            severity: "error",
          });
        }
      }
    }
  }

  // Optional: intensity
  if (metadata.intensity !== undefined) {
    if (!isInteger(metadata.intensity)) {
      issues.push({
        path: `${path}.intensity`,
        message: "metadata.intensity must be an integer.",
        severity: "error",
      });
    } else if (metadata.intensity < 1 || metadata.intensity > 10) {
      issues.push({
        path: `${path}.intensity`,
        message: "metadata.intensity must be between 1 and 10.",
        severity: "error",
      });
    }
  }

  // Optional: gender
  if (metadata.gender !== undefined) {
    if (
      !isString(metadata.gender) ||
      !(GENDERS as readonly string[]).includes(metadata.gender)
    ) {
      issues.push({
        path: `${path}.gender`,
        message: `Invalid gender value: "${metadata.gender}". Must be one of: ${GENDERS.join(", ")}.`,
        severity: "error",
      });
    }
  }

  // Optional: occasion
  if (metadata.occasion !== undefined) {
    if (!isArray(metadata.occasion)) {
      issues.push({
        path: `${path}.occasion`,
        message: "metadata.occasion must be an array of strings.",
        severity: "error",
      });
    } else {
      if (metadata.occasion.length > 10) {
        issues.push({
          path: `${path}.occasion`,
          message:
            "metadata.occasion must not contain more than 10 items.",
          severity: "error",
        });
      }
      for (let i = 0; i < metadata.occasion.length; i++) {
        if (!isString(metadata.occasion[i])) {
          issues.push({
            path: `${path}.occasion[${i}]`,
            message: "Each occasion must be a string.",
            severity: "error",
          });
        }
      }
    }
  }

  // Optional: inspiration
  if (metadata.inspiration !== undefined) {
    if (!isString(metadata.inspiration)) {
      issues.push({
        path: `${path}.inspiration`,
        message: "metadata.inspiration must be a string.",
        severity: "error",
      });
    } else if (metadata.inspiration.length > 1000) {
      issues.push({
        path: `${path}.inspiration`,
        message:
          "metadata.inspiration must not exceed 1000 characters.",
        severity: "error",
      });
    }
  }

  // Optional: parent_id
  if (metadata.parent_id !== undefined) {
    if (!isString(metadata.parent_id)) {
      issues.push({
        path: `${path}.parent_id`,
        message: "metadata.parent_id must be a string.",
        severity: "error",
      });
    } else if (!PARENT_ID_PATTERN.test(metadata.parent_id)) {
      issues.push({
        path: `${path}.parent_id`,
        message:
          "metadata.parent_id must contain only alphanumeric characters, hyphens, and underscores.",
        severity: "error",
      });
    }
  }

  // Optional: license
  if (metadata.license !== undefined) {
    if (!isString(metadata.license)) {
      issues.push({
        path: `${path}.license`,
        message: "metadata.license must be a string.",
        severity: "error",
      });
    } else if (metadata.license.length > 100) {
      issues.push({
        path: `${path}.license`,
        message: "metadata.license must not exceed 100 characters.",
        severity: "error",
      });
    }
  }
}

function validateIngredient(
  ingredient: unknown,
  index: number,
  issues: ValidationIssue[]
): void {
  const path = `formula[${index}]`;

  if (!isObject(ingredient)) {
    issues.push({
      path,
      message: "Each formula ingredient must be an object.",
      severity: "error",
    });
    return;
  }

  // Required: ingredient (name)
  if (!isString(ingredient.ingredient)) {
    issues.push({
      path: `${path}.ingredient`,
      message: "ingredient name is required and must be a string.",
      severity: "error",
    });
  } else {
    if (ingredient.ingredient.length < 1) {
      issues.push({
        path: `${path}.ingredient`,
        message: "ingredient name must be at least 1 character.",
        severity: "error",
      });
    }
    if (ingredient.ingredient.length > 200) {
      issues.push({
        path: `${path}.ingredient`,
        message: "ingredient name must not exceed 200 characters.",
        severity: "error",
      });
    }
  }

  // Optional: cas_number
  if (ingredient.cas_number !== undefined) {
    if (!isString(ingredient.cas_number)) {
      issues.push({
        path: `${path}.cas_number`,
        message: "cas_number must be a string.",
        severity: "error",
      });
    } else if (!CAS_PATTERN.test(ingredient.cas_number)) {
      issues.push({
        path: `${path}.cas_number`,
        message: `Invalid CAS number format: "${ingredient.cas_number}". Expected pattern: digits-digits-digit (e.g., "78-70-6").`,
        severity: "error",
      });
    }
  }

  // Optional: iupac_name
  if (ingredient.iupac_name !== undefined) {
    if (!isString(ingredient.iupac_name)) {
      issues.push({
        path: `${path}.iupac_name`,
        message: "iupac_name must be a string.",
        severity: "error",
      });
    } else if (ingredient.iupac_name.length > 500) {
      issues.push({
        path: `${path}.iupac_name`,
        message: "iupac_name must not exceed 500 characters.",
        severity: "error",
      });
    }
  }

  // Required: category
  if (!isString(ingredient.category)) {
    issues.push({
      path: `${path}.category`,
      message: "category is required and must be a string.",
      severity: "error",
    });
  } else if (
    !(INGREDIENT_CATEGORIES as readonly string[]).includes(
      ingredient.category
    )
  ) {
    issues.push({
      path: `${path}.category`,
      message: `Invalid category: "${ingredient.category}". Must be one of: ${INGREDIENT_CATEGORIES.join(", ")}.`,
      severity: "error",
    });
  }

  // Required: note_type
  if (!isString(ingredient.note_type)) {
    issues.push({
      path: `${path}.note_type`,
      message: "note_type is required and must be a string.",
      severity: "error",
    });
  } else if (
    !(NOTE_TYPES as readonly string[]).includes(ingredient.note_type)
  ) {
    issues.push({
      path: `${path}.note_type`,
      message: `Invalid note_type: "${ingredient.note_type}". Must be one of: ${NOTE_TYPES.join(", ")}.`,
      severity: "error",
    });
  }

  // Required: percentage
  if (!isNumber(ingredient.percentage)) {
    issues.push({
      path: `${path}.percentage`,
      message: "percentage is required and must be a number.",
      severity: "error",
    });
  } else {
    if (ingredient.percentage < 0 || ingredient.percentage > 100) {
      issues.push({
        path: `${path}.percentage`,
        message: "percentage must be between 0 and 100.",
        severity: "error",
      });
    }
    // Check precision (max 2 decimal places)
    const decimalStr = String(ingredient.percentage);
    const decimalPart = decimalStr.split(".")[1];
    if (decimalPart && decimalPart.length > 2) {
      issues.push({
        path: `${path}.percentage`,
        message:
          "percentage should have at most 2 decimal places.",
        severity: "warning",
      });
    }
  }

  // Optional: intensity
  if (ingredient.intensity !== undefined) {
    if (!isInteger(ingredient.intensity)) {
      issues.push({
        path: `${path}.intensity`,
        message: "intensity must be an integer.",
        severity: "error",
      });
    } else if (
      ingredient.intensity < 1 ||
      ingredient.intensity > 10
    ) {
      issues.push({
        path: `${path}.intensity`,
        message: "intensity must be between 1 and 10.",
        severity: "error",
      });
    }
  }

  // Optional: volatility
  if (ingredient.volatility !== undefined) {
    if (
      !isString(ingredient.volatility) ||
      !(VOLATILITY_LEVELS as readonly string[]).includes(
        ingredient.volatility
      )
    ) {
      issues.push({
        path: `${path}.volatility`,
        message: `Invalid volatility: "${ingredient.volatility}". Must be one of: ${VOLATILITY_LEVELS.join(", ")}.`,
        severity: "error",
      });
    }
  }

  // Optional: odor_description
  if (ingredient.odor_description !== undefined) {
    if (!isString(ingredient.odor_description)) {
      issues.push({
        path: `${path}.odor_description`,
        message: "odor_description must be a string.",
        severity: "error",
      });
    } else if (ingredient.odor_description.length > 500) {
      issues.push({
        path: `${path}.odor_description`,
        message:
          "odor_description must not exceed 500 characters.",
        severity: "error",
      });
    }
  }

  // Optional: natural
  if (ingredient.natural !== undefined && !isBoolean(ingredient.natural)) {
    issues.push({
      path: `${path}.natural`,
      message: "natural must be a boolean.",
      severity: "error",
    });
  }

  // Optional: supplier
  if (ingredient.supplier !== undefined) {
    if (!isString(ingredient.supplier)) {
      issues.push({
        path: `${path}.supplier`,
        message: "supplier must be a string.",
        severity: "error",
      });
    } else if (ingredient.supplier.length > 200) {
      issues.push({
        path: `${path}.supplier`,
        message: "supplier must not exceed 200 characters.",
        severity: "error",
      });
    }
  }

  // Optional: cost_tier
  if (ingredient.cost_tier !== undefined) {
    if (
      !isString(ingredient.cost_tier) ||
      !(COST_TIERS as readonly string[]).includes(ingredient.cost_tier)
    ) {
      issues.push({
        path: `${path}.cost_tier`,
        message: `Invalid cost_tier: "${ingredient.cost_tier}". Must be one of: ${COST_TIERS.join(", ")}.`,
        severity: "error",
      });
    }
  }
}

function validateFormula(
  formula: unknown,
  issues: ValidationIssue[]
): void {
  const path = "formula";

  if (!isArray(formula)) {
    issues.push({
      path,
      message: "formula must be an array of ingredient objects.",
      severity: "error",
    });
    return;
  }

  if (formula.length < 2) {
    issues.push({
      path,
      message: "formula must contain at least 2 ingredients.",
      severity: "error",
    });
  }

  if (formula.length > 100) {
    issues.push({
      path,
      message: "formula must not contain more than 100 ingredients.",
      severity: "error",
    });
  }

  // Validate each ingredient
  for (let i = 0; i < formula.length; i++) {
    validateIngredient(formula[i], i, issues);
  }

  // Check percentage sum
  let totalPercentage = 0;
  let allPercentagesValid = true;

  for (let i = 0; i < formula.length; i++) {
    const item = formula[i];
    if (isObject(item) && isNumber(item.percentage)) {
      totalPercentage += item.percentage;
    } else {
      allPercentagesValid = false;
    }
  }

  if (allPercentagesValid) {
    // Use a tolerance of 0.1 to accommodate floating-point rounding
    const diff = Math.abs(totalPercentage - 100);
    if (diff > 0.1) {
      issues.push({
        path,
        message: `Formula percentages must sum to 100. Current sum: ${totalPercentage.toFixed(2)}% (difference: ${diff.toFixed(2)}%).`,
        severity: "error",
      });
    } else if (diff > 0.01 && diff <= 0.1) {
      issues.push({
        path,
        message: `Formula percentages sum to ${totalPercentage.toFixed(2)}%, which is within tolerance (0.1) but not exactly 100.`,
        severity: "warning",
      });
    }
  }

  // Check for duplicate ingredient names
  const names = new Map<string, number[]>();
  for (let i = 0; i < formula.length; i++) {
    const item = formula[i];
    if (isObject(item) && isString(item.ingredient)) {
      const key = item.ingredient.toLowerCase();
      if (!names.has(key)) {
        names.set(key, []);
      }
      names.get(key)!.push(i);
    }
  }
  for (const [name, indices] of names) {
    if (indices.length > 1) {
      issues.push({
        path,
        message: `Duplicate ingredient name "${name}" found at indices: ${indices.join(", ")}. Consider combining into a single entry.`,
        severity: "warning",
      });
    }
  }
}

function validateAccords(
  accords: unknown,
  formulaIngredientNames: Set<string>,
  issues: ValidationIssue[]
): void {
  const path = "accords";

  if (!isArray(accords)) {
    issues.push({
      path,
      message: "accords must be an array.",
      severity: "error",
    });
    return;
  }

  if (accords.length > 15) {
    issues.push({
      path,
      message: "accords must not contain more than 15 items.",
      severity: "error",
    });
  }

  const accordNames = new Set<string>();

  for (let i = 0; i < accords.length; i++) {
    const accord = accords[i];
    const accordPath = `${path}[${i}]`;

    if (!isObject(accord)) {
      issues.push({
        path: accordPath,
        message: "Each accord must be an object.",
        severity: "error",
      });
      continue;
    }

    // Required: name
    if (!isString(accord.name)) {
      issues.push({
        path: `${accordPath}.name`,
        message: "accord name is required and must be a string.",
        severity: "error",
      });
    } else {
      if (accord.name.length < 1 || accord.name.length > 100) {
        issues.push({
          path: `${accordPath}.name`,
          message: "accord name must be 1-100 characters.",
          severity: "error",
        });
      }
      if (accordNames.has(accord.name.toLowerCase())) {
        issues.push({
          path: `${accordPath}.name`,
          message: `Duplicate accord name: "${accord.name}".`,
          severity: "warning",
        });
      }
      accordNames.add(accord.name.toLowerCase());
    }

    // Optional: description
    if (accord.description !== undefined) {
      if (!isString(accord.description)) {
        issues.push({
          path: `${accordPath}.description`,
          message: "accord description must be a string.",
          severity: "error",
        });
      } else if (accord.description.length > 500) {
        issues.push({
          path: `${accordPath}.description`,
          message:
            "accord description must not exceed 500 characters.",
          severity: "error",
        });
      }
    }

    // Optional: contributing_ingredients
    if (accord.contributing_ingredients !== undefined) {
      if (!isArray(accord.contributing_ingredients)) {
        issues.push({
          path: `${accordPath}.contributing_ingredients`,
          message: "contributing_ingredients must be an array.",
          severity: "error",
        });
      } else {
        if (accord.contributing_ingredients.length < 2) {
          issues.push({
            path: `${accordPath}.contributing_ingredients`,
            message:
              "contributing_ingredients must contain at least 2 items.",
            severity: "error",
          });
        }
        if (accord.contributing_ingredients.length > 20) {
          issues.push({
            path: `${accordPath}.contributing_ingredients`,
            message:
              "contributing_ingredients must not contain more than 20 items.",
            severity: "error",
          });
        }
        for (
          let j = 0;
          j < accord.contributing_ingredients.length;
          j++
        ) {
          const ing = accord.contributing_ingredients[j];
          if (!isString(ing)) {
            issues.push({
              path: `${accordPath}.contributing_ingredients[${j}]`,
              message:
                "Each contributing ingredient must be a string.",
              severity: "error",
            });
          } else if (!formulaIngredientNames.has(ing)) {
            issues.push({
              path: `${accordPath}.contributing_ingredients[${j}]`,
              message: `Contributing ingredient "${ing}" is not present in the formula.`,
              severity: "warning",
            });
          }
        }
      }
    }

    // Optional: strength
    if (accord.strength !== undefined) {
      if (
        !isString(accord.strength) ||
        !(ACCORD_STRENGTHS as readonly string[]).includes(
          accord.strength
        )
      ) {
        issues.push({
          path: `${accordPath}.strength`,
          message: `Invalid accord strength: "${accord.strength}". Must be one of: ${ACCORD_STRENGTHS.join(", ")}.`,
          severity: "error",
        });
      }
    }
  }
}

function validateEvolutionPhase(
  phase: unknown,
  phaseName: string,
  formulaIngredientNames: Set<string>,
  issues: ValidationIssue[]
): void {
  const path = `evolution.${phaseName}`;

  if (!isObject(phase)) {
    issues.push({
      path,
      message: `evolution.${phaseName} must be an object.`,
      severity: "error",
    });
    return;
  }

  // Required: duration_minutes
  if (!isInteger(phase.duration_minutes)) {
    issues.push({
      path: `${path}.duration_minutes`,
      message: "duration_minutes is required and must be an integer.",
      severity: "error",
    });
  } else if (
    phase.duration_minutes < 1 ||
    phase.duration_minutes > 1440
  ) {
    issues.push({
      path: `${path}.duration_minutes`,
      message: "duration_minutes must be between 1 and 1440.",
      severity: "error",
    });
  }

  // Required: dominant_ingredients
  if (!isArray(phase.dominant_ingredients)) {
    issues.push({
      path: `${path}.dominant_ingredients`,
      message:
        "dominant_ingredients is required and must be an array.",
      severity: "error",
    });
  } else {
    if (phase.dominant_ingredients.length < 1) {
      issues.push({
        path: `${path}.dominant_ingredients`,
        message:
          "dominant_ingredients must contain at least 1 item.",
        severity: "error",
      });
    }
    if (phase.dominant_ingredients.length > 10) {
      issues.push({
        path: `${path}.dominant_ingredients`,
        message:
          "dominant_ingredients must not contain more than 10 items.",
        severity: "error",
      });
    }
    for (let i = 0; i < phase.dominant_ingredients.length; i++) {
      const ing = phase.dominant_ingredients[i];
      if (!isString(ing)) {
        issues.push({
          path: `${path}.dominant_ingredients[${i}]`,
          message: "Each dominant ingredient must be a string.",
          severity: "error",
        });
      } else if (!formulaIngredientNames.has(ing)) {
        issues.push({
          path: `${path}.dominant_ingredients[${i}]`,
          message: `Dominant ingredient "${ing}" is not present in the formula.`,
          severity: "warning",
        });
      }
    }
  }

  // Required: character
  if (!isString(phase.character)) {
    issues.push({
      path: `${path}.character`,
      message: "character is required and must be a string.",
      severity: "error",
    });
  } else {
    if (phase.character.length < 1) {
      issues.push({
        path: `${path}.character`,
        message: "character must be at least 1 character.",
        severity: "error",
      });
    }
    if (phase.character.length > 500) {
      issues.push({
        path: `${path}.character`,
        message: "character must not exceed 500 characters.",
        severity: "error",
      });
    }
  }

  // Optional: intensity
  if (phase.intensity !== undefined) {
    if (!isInteger(phase.intensity)) {
      issues.push({
        path: `${path}.intensity`,
        message: "phase intensity must be an integer.",
        severity: "error",
      });
    } else if (phase.intensity < 1 || phase.intensity > 10) {
      issues.push({
        path: `${path}.intensity`,
        message: "phase intensity must be between 1 and 10.",
        severity: "error",
      });
    }
  }

  // Optional: sillage
  if (phase.sillage !== undefined) {
    if (
      !isString(phase.sillage) ||
      !(SILLAGE_LEVELS as readonly string[]).includes(phase.sillage)
    ) {
      issues.push({
        path: `${path}.sillage`,
        message: `Invalid sillage: "${phase.sillage}". Must be one of: ${SILLAGE_LEVELS.join(", ")}.`,
        severity: "error",
      });
    }
  }
}

function validateEvolution(
  evolution: unknown,
  formulaIngredientNames: Set<string>,
  issues: ValidationIssue[]
): void {
  const path = "evolution";

  if (!isObject(evolution)) {
    issues.push({
      path,
      message: "evolution must be an object.",
      severity: "error",
    });
    return;
  }

  // Required phases
  const requiredPhases: Array<"opening" | "heart" | "drydown"> = [
    "opening",
    "heart",
    "drydown",
  ];

  for (const phase of requiredPhases) {
    if (evolution[phase] === undefined) {
      issues.push({
        path: `${path}.${phase}`,
        message: `evolution.${phase} is required.`,
        severity: "error",
      });
    } else {
      validateEvolutionPhase(
        evolution[phase],
        phase,
        formulaIngredientNames,
        issues
      );
    }
  }

  // Optional: total_longevity_hours
  if (evolution.total_longevity_hours !== undefined) {
    if (!isNumber(evolution.total_longevity_hours)) {
      issues.push({
        path: `${path}.total_longevity_hours`,
        message: "total_longevity_hours must be a number.",
        severity: "error",
      });
    } else if (
      evolution.total_longevity_hours < 0.5 ||
      evolution.total_longevity_hours > 48
    ) {
      issues.push({
        path: `${path}.total_longevity_hours`,
        message:
          "total_longevity_hours must be between 0.5 and 48.",
        severity: "error",
      });
    }
  }

  // Cross-check: total longevity should roughly equal sum of phase durations
  if (
    isObject(evolution.opening) &&
    isObject(evolution.heart) &&
    isObject(evolution.drydown) &&
    isNumber(evolution.total_longevity_hours)
  ) {
    const opening = evolution.opening as Record<string, unknown>;
    const heart = evolution.heart as Record<string, unknown>;
    const drydown = evolution.drydown as Record<string, unknown>;

    if (
      isInteger(opening.duration_minutes) &&
      isInteger(heart.duration_minutes) &&
      isInteger(drydown.duration_minutes)
    ) {
      const totalMinutes =
        (opening.duration_minutes as number) +
        (heart.duration_minutes as number) +
        (drydown.duration_minutes as number);
      const totalHoursFromPhases = totalMinutes / 60;
      const declaredHours = evolution.total_longevity_hours as number;

      // Allow generous tolerance since phases can overlap
      if (
        Math.abs(totalHoursFromPhases - declaredHours) >
        declaredHours * 0.5
      ) {
        issues.push({
          path: `${path}.total_longevity_hours`,
          message: `total_longevity_hours (${declaredHours}h) differs significantly from the sum of phase durations (${totalHoursFromPhases.toFixed(1)}h). This may indicate an error, though phases can overlap.`,
          severity: "warning",
        });
      }
    }
  }
}

function validateSafety(
  safety: unknown,
  issues: ValidationIssue[]
): void {
  const path = "safety";

  if (!isObject(safety)) {
    issues.push({
      path,
      message: "safety must be an object.",
      severity: "error",
    });
    return;
  }

  // Required: ifra_compliant
  if (!isBoolean(safety.ifra_compliant)) {
    issues.push({
      path: `${path}.ifra_compliant`,
      message:
        "ifra_compliant is required and must be a boolean.",
      severity: "error",
    });
  }

  // Optional: ifra_version
  if (safety.ifra_version !== undefined) {
    if (!isString(safety.ifra_version)) {
      issues.push({
        path: `${path}.ifra_version`,
        message: "ifra_version must be a string.",
        severity: "error",
      });
    } else if (!IFRA_VERSION_PATTERN.test(safety.ifra_version)) {
      issues.push({
        path: `${path}.ifra_version`,
        message:
          "ifra_version must be a version number (e.g., '51.0').",
        severity: "error",
      });
    }
  }

  // Optional: ifra_category
  if (safety.ifra_category !== undefined) {
    if (!isInteger(safety.ifra_category)) {
      issues.push({
        path: `${path}.ifra_category`,
        message: "ifra_category must be an integer.",
        severity: "error",
      });
    } else if (safety.ifra_category < 1 || safety.ifra_category > 11) {
      issues.push({
        path: `${path}.ifra_category`,
        message: "ifra_category must be between 1 and 11.",
        severity: "error",
      });
    }
  }

  // Optional: allergens
  if (safety.allergens !== undefined) {
    if (!isArray(safety.allergens)) {
      issues.push({
        path: `${path}.allergens`,
        message: "allergens must be an array.",
        severity: "error",
      });
    } else {
      if (safety.allergens.length > 30) {
        issues.push({
          path: `${path}.allergens`,
          message:
            "allergens must not contain more than 30 items.",
          severity: "error",
        });
      }
      for (let i = 0; i < safety.allergens.length; i++) {
        const allergen = safety.allergens[i];
        const allergenPath = `${path}.allergens[${i}]`;

        if (!isObject(allergen)) {
          issues.push({
            path: allergenPath,
            message: "Each allergen must be an object.",
            severity: "error",
          });
          continue;
        }

        if (!isString(allergen.name)) {
          issues.push({
            path: `${allergenPath}.name`,
            message: "allergen name is required and must be a string.",
            severity: "error",
          });
        }

        if (!isNumber(allergen.percentage)) {
          issues.push({
            path: `${allergenPath}.percentage`,
            message:
              "allergen percentage is required and must be a number.",
            severity: "error",
          });
        } else if (
          allergen.percentage < 0 ||
          allergen.percentage > 100
        ) {
          issues.push({
            path: `${allergenPath}.percentage`,
            message:
              "allergen percentage must be between 0 and 100.",
            severity: "error",
          });
        }

        if (allergen.cas_number !== undefined) {
          if (!isString(allergen.cas_number)) {
            issues.push({
              path: `${allergenPath}.cas_number`,
              message: "allergen cas_number must be a string.",
              severity: "error",
            });
          } else if (!CAS_PATTERN.test(allergen.cas_number)) {
            issues.push({
              path: `${allergenPath}.cas_number`,
              message: `Invalid allergen CAS number format: "${allergen.cas_number}".`,
              severity: "error",
            });
          }
        }

        if (
          allergen.declaration_required !== undefined &&
          !isBoolean(allergen.declaration_required)
        ) {
          issues.push({
            path: `${allergenPath}.declaration_required`,
            message: "declaration_required must be a boolean.",
            severity: "error",
          });
        }
      }
    }
  }

  // Optional: concentration
  if (safety.concentration !== undefined) {
    if (
      !isString(safety.concentration) ||
      !(CONCENTRATION_CATEGORIES as readonly string[]).includes(
        safety.concentration
      )
    ) {
      issues.push({
        path: `${path}.concentration`,
        message: `Invalid concentration: "${safety.concentration}". Must be one of: ${CONCENTRATION_CATEGORIES.join(", ")}.`,
        severity: "error",
      });
    }
  }

  // Optional: max_skin_exposure_percent
  if (safety.max_skin_exposure_percent !== undefined) {
    if (!isNumber(safety.max_skin_exposure_percent)) {
      issues.push({
        path: `${path}.max_skin_exposure_percent`,
        message: "max_skin_exposure_percent must be a number.",
        severity: "error",
      });
    } else if (
      safety.max_skin_exposure_percent < 0 ||
      safety.max_skin_exposure_percent > 100
    ) {
      issues.push({
        path: `${path}.max_skin_exposure_percent`,
        message:
          "max_skin_exposure_percent must be between 0 and 100.",
        severity: "error",
      });
    }
  }

  // Optional: restricted_ingredients
  if (safety.restricted_ingredients !== undefined) {
    if (!isArray(safety.restricted_ingredients)) {
      issues.push({
        path: `${path}.restricted_ingredients`,
        message: "restricted_ingredients must be an array.",
        severity: "error",
      });
    } else {
      for (
        let i = 0;
        i < safety.restricted_ingredients.length;
        i++
      ) {
        const ri = safety.restricted_ingredients[i];
        const riPath = `${path}.restricted_ingredients[${i}]`;

        if (!isObject(ri)) {
          issues.push({
            path: riPath,
            message:
              "Each restricted ingredient must be an object.",
            severity: "error",
          });
          continue;
        }

        if (!isString(ri.ingredient)) {
          issues.push({
            path: `${riPath}.ingredient`,
            message:
              "restricted ingredient name is required.",
            severity: "error",
          });
        }

        if (!isNumber(ri.limit_percent)) {
          issues.push({
            path: `${riPath}.limit_percent`,
            message: "limit_percent is required and must be a number.",
            severity: "error",
          });
        }

        if (!isNumber(ri.actual_percent)) {
          issues.push({
            path: `${riPath}.actual_percent`,
            message:
              "actual_percent is required and must be a number.",
            severity: "error",
          });
        }

        // Cross-check: if compliant is provided, verify it
        if (
          isNumber(ri.limit_percent) &&
          isNumber(ri.actual_percent) &&
          isBoolean(ri.compliant)
        ) {
          const shouldBeCompliant =
            ri.actual_percent <= ri.limit_percent;
          if (ri.compliant !== shouldBeCompliant) {
            issues.push({
              path: `${riPath}.compliant`,
              message: `compliant flag is ${ri.compliant} but actual_percent (${ri.actual_percent}) ${shouldBeCompliant ? "is" : "is not"} within limit_percent (${ri.limit_percent}).`,
              severity: "error",
            });
          }
        }

        if (ri.cas_number !== undefined) {
          if (
            !isString(ri.cas_number) ||
            !CAS_PATTERN.test(ri.cas_number)
          ) {
            issues.push({
              path: `${riPath}.cas_number`,
              message: "Invalid CAS number format.",
              severity: "error",
            });
          }
        }
      }
    }
  }

  // Optional booleans
  for (const field of [
    "phototoxic",
    "vegan",
    "eu_cosmetics_regulation_compliant",
  ]) {
    if (
      safety[field] !== undefined &&
      !isBoolean(safety[field])
    ) {
      issues.push({
        path: `${path}.${field}`,
        message: `${field} must be a boolean.`,
        severity: "error",
      });
    }
  }

  // Optional: warnings
  if (safety.warnings !== undefined) {
    if (!isArray(safety.warnings)) {
      issues.push({
        path: `${path}.warnings`,
        message: "warnings must be an array of strings.",
        severity: "error",
      });
    } else {
      if (safety.warnings.length > 20) {
        issues.push({
          path: `${path}.warnings`,
          message:
            "warnings must not contain more than 20 items.",
          severity: "error",
        });
      }
      for (let i = 0; i < safety.warnings.length; i++) {
        if (!isString(safety.warnings[i])) {
          issues.push({
            path: `${path}.warnings[${i}]`,
            message: "Each warning must be a string.",
            severity: "error",
          });
        }
      }
    }
  }
}

function validateHardware(
  hardware: unknown,
  formulaIngredientNames: Set<string>,
  issues: ValidationIssue[]
): void {
  const path = "hardware";

  if (!isObject(hardware)) {
    issues.push({
      path,
      message: "hardware must be an object.",
      severity: "error",
    });
    return;
  }

  // Required: device_profile
  if (!isString(hardware.device_profile)) {
    issues.push({
      path: `${path}.device_profile`,
      message:
        "device_profile is required and must be a string.",
      severity: "error",
    });
  } else if (
    hardware.device_profile.length < 1 ||
    hardware.device_profile.length > 100
  ) {
    issues.push({
      path: `${path}.device_profile`,
      message: "device_profile must be 1-100 characters.",
      severity: "error",
    });
  }

  // Optional: total_volume_ml
  if (hardware.total_volume_ml !== undefined) {
    if (!isNumber(hardware.total_volume_ml)) {
      issues.push({
        path: `${path}.total_volume_ml`,
        message: "total_volume_ml must be a number.",
        severity: "error",
      });
    } else if (
      hardware.total_volume_ml < 0.1 ||
      hardware.total_volume_ml > 500
    ) {
      issues.push({
        path: `${path}.total_volume_ml`,
        message:
          "total_volume_ml must be between 0.1 and 500.",
        severity: "error",
      });
    }
  }

  // Required: channel_mappings
  if (!isArray(hardware.channel_mappings)) {
    issues.push({
      path: `${path}.channel_mappings`,
      message:
        "channel_mappings is required and must be an array.",
      severity: "error",
    });
  } else {
    if (hardware.channel_mappings.length < 1) {
      issues.push({
        path: `${path}.channel_mappings`,
        message:
          "channel_mappings must contain at least 1 item.",
        severity: "error",
      });
    }
    if (hardware.channel_mappings.length > 32) {
      issues.push({
        path: `${path}.channel_mappings`,
        message:
          "channel_mappings must not contain more than 32 items.",
        severity: "error",
      });
    }

    const usedChannels = new Set<number>();

    for (let i = 0; i < hardware.channel_mappings.length; i++) {
      const mapping = hardware.channel_mappings[i];
      const mapPath = `${path}.channel_mappings[${i}]`;

      if (!isObject(mapping)) {
        issues.push({
          path: mapPath,
          message: "Each channel mapping must be an object.",
          severity: "error",
        });
        continue;
      }

      // Required: ingredient
      if (!isString(mapping.ingredient)) {
        issues.push({
          path: `${mapPath}.ingredient`,
          message:
            "channel mapping ingredient is required and must be a string.",
          severity: "error",
        });
      } else if (!formulaIngredientNames.has(mapping.ingredient)) {
        issues.push({
          path: `${mapPath}.ingredient`,
          message: `Channel mapping ingredient "${mapping.ingredient}" is not present in the formula.`,
          severity: "warning",
        });
      }

      // Required: channel
      if (!isInteger(mapping.channel)) {
        issues.push({
          path: `${mapPath}.channel`,
          message:
            "channel is required and must be an integer.",
          severity: "error",
        });
      } else {
        if (mapping.channel < 1 || mapping.channel > 32) {
          issues.push({
            path: `${mapPath}.channel`,
            message: "channel must be between 1 and 32.",
            severity: "error",
          });
        }
        if (usedChannels.has(mapping.channel)) {
          issues.push({
            path: `${mapPath}.channel`,
            message: `Channel ${mapping.channel} is already assigned to another ingredient.`,
            severity: "error",
          });
        }
        usedChannels.add(mapping.channel);
      }

      // Required: volume_ml
      if (!isNumber(mapping.volume_ml)) {
        issues.push({
          path: `${mapPath}.volume_ml`,
          message:
            "volume_ml is required and must be a number.",
          severity: "error",
        });
      } else if (
        mapping.volume_ml < 0.01 ||
        mapping.volume_ml > 100
      ) {
        issues.push({
          path: `${mapPath}.volume_ml`,
          message:
            "volume_ml must be between 0.01 and 100.",
          severity: "error",
        });
      }

      // Optional: flow_rate
      if (mapping.flow_rate !== undefined) {
        if (!isNumber(mapping.flow_rate)) {
          issues.push({
            path: `${mapPath}.flow_rate`,
            message: "flow_rate must be a number.",
            severity: "error",
          });
        } else if (
          mapping.flow_rate < 0.001 ||
          mapping.flow_rate > 10
        ) {
          issues.push({
            path: `${mapPath}.flow_rate`,
            message:
              "flow_rate must be between 0.001 and 10 ml/s.",
            severity: "error",
          });
        }
      }

      // Optional: dispense_order
      if (mapping.dispense_order !== undefined) {
        if (!isInteger(mapping.dispense_order)) {
          issues.push({
            path: `${mapPath}.dispense_order`,
            message: "dispense_order must be an integer.",
            severity: "error",
          });
        } else if (mapping.dispense_order < 1) {
          issues.push({
            path: `${mapPath}.dispense_order`,
            message: "dispense_order must be >= 1.",
            severity: "error",
          });
        }
      }

      // Optional: pre_stir
      if (
        mapping.pre_stir !== undefined &&
        !isBoolean(mapping.pre_stir)
      ) {
        issues.push({
          path: `${mapPath}.pre_stir`,
          message: "pre_stir must be a boolean.",
          severity: "error",
        });
      }
    }
  }

  // Optional: mix_duration_seconds
  if (hardware.mix_duration_seconds !== undefined) {
    if (!isInteger(hardware.mix_duration_seconds)) {
      issues.push({
        path: `${path}.mix_duration_seconds`,
        message: "mix_duration_seconds must be an integer.",
        severity: "error",
      });
    } else if (
      hardware.mix_duration_seconds < 0 ||
      hardware.mix_duration_seconds > 600
    ) {
      issues.push({
        path: `${path}.mix_duration_seconds`,
        message:
          "mix_duration_seconds must be between 0 and 600.",
        severity: "error",
      });
    }
  }

  // Optional: temperature_celsius
  if (hardware.temperature_celsius !== undefined) {
    if (!isNumber(hardware.temperature_celsius)) {
      issues.push({
        path: `${path}.temperature_celsius`,
        message: "temperature_celsius must be a number.",
        severity: "error",
      });
    } else if (
      hardware.temperature_celsius < 10 ||
      hardware.temperature_celsius > 60
    ) {
      issues.push({
        path: `${path}.temperature_celsius`,
        message:
          "temperature_celsius must be between 10 and 60.",
        severity: "error",
      });
    }
  }

  // Optional: calibration_date
  if (hardware.calibration_date !== undefined) {
    if (!isString(hardware.calibration_date)) {
      issues.push({
        path: `${path}.calibration_date`,
        message: "calibration_date must be a string.",
        severity: "error",
      });
    } else if (
      !/^\d{4}-\d{2}-\d{2}$/.test(hardware.calibration_date)
    ) {
      issues.push({
        path: `${path}.calibration_date`,
        message:
          "calibration_date must be in YYYY-MM-DD format.",
        severity: "warning",
      });
    }
  }

  // Optional: notes
  if (hardware.notes !== undefined) {
    if (!isString(hardware.notes)) {
      issues.push({
        path: `${path}.notes`,
        message: "hardware notes must be a string.",
        severity: "error",
      });
    } else if (hardware.notes.length > 500) {
      issues.push({
        path: `${path}.notes`,
        message: "hardware notes must not exceed 500 characters.",
        severity: "error",
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Main Validation Function
// ---------------------------------------------------------------------------

/**
 * Validates an OSC JSON object against the OSC v1.0 specification.
 *
 * Returns a ValidationResult containing:
 * - `valid`: true if there are no errors (warnings are acceptable)
 * - `errors`: array of error-level issues that make the document invalid
 * - `warnings`: array of warning-level issues that suggest improvements
 *
 * @param data - The OSC document to validate (unknown type for safety)
 * @returns ValidationResult
 *
 * @example
 * ```typescript
 * import { validateOSC } from './validator';
 *
 * const myFormula = JSON.parse(fs.readFileSync('my-scent.osc.json', 'utf-8'));
 * const result = validateOSC(myFormula);
 *
 * if (result.valid) {
 *   console.log('Formula is valid!');
 *   if (result.warnings.length > 0) {
 *     console.log('Warnings:', result.warnings);
 *   }
 * } else {
 *   console.error('Validation failed:');
 *   for (const error of result.errors) {
 *     console.error(`  [${error.path}] ${error.message}`);
 *   }
 * }
 * ```
 */
export function validateOSC(data: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Top-level must be an object
  if (!isObject(data)) {
    issues.push({
      path: "",
      message:
        "OSC document must be a JSON object at the top level.",
      severity: "error",
    });
    return {
      valid: false,
      errors: issues.filter((i) => i.severity === "error"),
      warnings: issues.filter((i) => i.severity === "warning"),
    };
  }

  // Required: osc_version
  if (!isString(data.osc_version)) {
    issues.push({
      path: "osc_version",
      message:
        "osc_version is required and must be a string.",
      severity: "error",
    });
  } else if (data.osc_version !== "1.0") {
    issues.push({
      path: "osc_version",
      message: `Unsupported OSC version: "${data.osc_version}". This validator supports version "1.0".`,
      severity: "error",
    });
  }

  // Required: metadata
  if (data.metadata === undefined) {
    issues.push({
      path: "metadata",
      message: "metadata is required.",
      severity: "error",
    });
  } else {
    validateMetadata(data.metadata, issues);
  }

  // Required: formula
  if (data.formula === undefined) {
    issues.push({
      path: "formula",
      message: "formula is required.",
      severity: "error",
    });
  } else {
    validateFormula(data.formula, issues);
  }

  // Build a set of formula ingredient names for cross-referencing
  const formulaIngredientNames = new Set<string>();
  if (isArray(data.formula)) {
    for (const item of data.formula) {
      if (isObject(item) && isString(item.ingredient)) {
        formulaIngredientNames.add(item.ingredient);
      }
    }
  }

  // Optional: accords
  if (data.accords !== undefined) {
    validateAccords(data.accords, formulaIngredientNames, issues);
  }

  // Optional: evolution
  if (data.evolution !== undefined) {
    validateEvolution(
      data.evolution,
      formulaIngredientNames,
      issues
    );
  }

  // Optional: safety
  if (data.safety !== undefined) {
    validateSafety(data.safety, issues);
  }

  // Optional: hardware
  if (data.hardware !== undefined) {
    validateHardware(data.hardware, formulaIngredientNames, issues);
  }

  // Check for unknown top-level keys
  const knownTopLevelKeys = new Set([
    "osc_version",
    "metadata",
    "formula",
    "accords",
    "evolution",
    "safety",
    "hardware",
  ]);
  for (const key of Object.keys(data)) {
    if (!knownTopLevelKeys.has(key)) {
      issues.push({
        path: key,
        message: `Unknown top-level field: "${key}". This field is not part of the OSC v1.0 specification and will be ignored.`,
        severity: "warning",
      });
    }
  }

  // Structural warnings
  if (isArray(data.formula) && data.formula.length > 0) {
    // Warn if no base notes
    const hasBaseNote = data.formula.some(
      (item: unknown) =>
        isObject(item) && item.note_type === "base"
    );
    if (!hasBaseNote) {
      issues.push({
        path: "formula",
        message:
          "Formula contains no base notes. Most fragrances require base notes for longevity and structure.",
        severity: "warning",
      });
    }

    // Warn if no top notes
    const hasTopNote = data.formula.some(
      (item: unknown) =>
        isObject(item) && item.note_type === "top"
    );
    if (!hasTopNote) {
      issues.push({
        path: "formula",
        message:
          "Formula contains no top notes. The opening impression may be weak or absent.",
        severity: "warning",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Convenience Functions
// ---------------------------------------------------------------------------

/**
 * Parses a JSON string and validates it as an OSC document.
 *
 * @param jsonString - The JSON string to parse and validate
 * @returns ValidationResult with an additional parse error if JSON is invalid
 */
export function validateOSCString(
  jsonString: string
): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unknown parse error";
    return {
      valid: false,
      errors: [
        {
          path: "",
          message: `Invalid JSON: ${message}`,
          severity: "error",
        },
      ],
      warnings: [],
    };
  }
  return validateOSC(data);
}

/**
 * Returns a formatted string summarizing validation results.
 *
 * @param result - The ValidationResult to format
 * @returns A human-readable summary string
 */
export function formatValidationResult(
  result: ValidationResult
): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push("VALID: OSC document passes all validation checks.");
  } else {
    lines.push(
      `INVALID: OSC document has ${result.errors.length} error(s).`
    );
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Errors:");
    for (const error of result.errors) {
      const pathStr = error.path ? `[${error.path}]` : "[root]";
      lines.push(`  ${pathStr} ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of result.warnings) {
      const pathStr = warning.path
        ? `[${warning.path}]`
        : "[root]";
      lines.push(`  ${pathStr} ${warning.message}`);
    }
  }

  return lines.join("\n");
}
