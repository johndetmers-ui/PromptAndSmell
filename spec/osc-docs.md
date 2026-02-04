# Open Scent Code (OSC) Specification Documentation

**Version**: 1.0
**Last Updated**: 2026-02-03
**Status**: Draft

---

## Table of Contents

1. [What is OSC](#what-is-osc)
2. [Why OSC Exists](#why-osc-exists)
3. [Format Overview](#format-overview)
4. [Field-by-Field Reference](#field-by-field-reference)
5. [Complete Example Scents](#complete-example-scents)
6. [Ingredient Taxonomy and Categories](#ingredient-taxonomy-and-categories)
7. [Note Types Explained](#note-types-explained)
8. [Evolution Model](#evolution-model)
9. [Safety and IFRA Compliance](#safety-and-ifra-compliance)
10. [Hardware Integration](#hardware-integration)
11. [Versioning and Compatibility](#versioning-and-compatibility)

---

## What is OSC

Open Scent Code (OSC) is a JSON-based, machine-readable specification for describing fragrance formulas. It provides a standardized way to represent everything about a scent: what ingredients it contains, in what proportions, how it evolves over time, whether it meets safety standards, and how to physically dispense it with hardware.

OSC is designed to be:

- **Human-readable**: Any perfumer or enthusiast can open an OSC file and understand the formula.
- **Machine-parseable**: Software can validate, transform, visualize, and generate OSC documents programmatically.
- **Complete**: An OSC document contains enough information to reproduce a scent, visualize it, assess its safety, and dispense it.
- **Portable**: OSC is plain JSON. It works with any programming language, any database, any version control system, and any file transfer mechanism.
- **Extensible**: The schema allows optional fields and can be extended in future versions without breaking backward compatibility.

---

## Why OSC Exists

The fragrance industry has no equivalent of MIDI (music), SVG (graphics), glTF (3D), or USD (scenes). Fragrance formulas are stored in:

- Proprietary spreadsheets locked in corporate systems
- Handwritten notebooks
- PDFs that are not machine-readable
- Verbal descriptions that are inherently imprecise

This lack of standardization creates several problems:

1. **No interoperability**: A formula created in one tool cannot be imported into another.
2. **No version control**: There is no standard way to track changes to a formula over time.
3. **No programmatic access**: Software cannot read, write, or transform formulas without custom parsing logic for each format.
4. **No sharing standard**: There is no common format for sharing formulas between perfumers, platforms, or hardware devices.
5. **No validation**: There is no way to automatically check whether a formula is chemically valid, balanced, or safe.

OSC solves all of these problems by providing a single, open, well-documented format that any tool can implement.

---

## Format Overview

An OSC document is a JSON object with the following top-level structure:

```json
{
  "osc_version": "1.0",
  "metadata": { ... },
  "formula": [ ... ],
  "accords": [ ... ],
  "evolution": { ... },
  "safety": { ... },
  "hardware": { ... }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `osc_version` | string | Must be "1.0" for this version of the spec |
| `metadata` | object | Descriptive information about the fragrance |
| `formula` | array | The ingredient list with percentages |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `accords` | array | Named emergent scent profiles |
| `evolution` | object | How the scent changes over time |
| `safety` | object | IFRA compliance and allergen data |
| `hardware` | object | Physical dispenser configuration |

### File Conventions

- **File extension**: `.osc.json` or `.osc`
- **MIME type**: `application/vnd.osc+json`
- **Encoding**: UTF-8
- **Character set**: Unicode

---

## Field-by-Field Reference

### `osc_version`

- **Type**: string
- **Required**: Yes
- **Value**: Must be `"1.0"` for documents conforming to this version of the specification.
- **Purpose**: Allows parsers to determine which version of the spec to validate against.

### `metadata`

An object containing descriptive information about the fragrance.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | 1-200 characters | The name of the fragrance |
| `description` | string | No | Max 2000 characters | A prose description of the scent |
| `author` | string | No | Max 200 characters | The creator's name or identifier |
| `version` | string | No | Semver pattern | Formula version (e.g., "1.0.0") |
| `created` | string | No | ISO 8601 datetime | When the formula was created |
| `updated` | string | No | ISO 8601 datetime | When the formula was last modified |
| `tags` | string[] | No | Max 20 items, each 1-50 chars | Searchable tags |
| `mood` | string[] | No | Max 10 items | Mood descriptors |
| `season` | string[] | No | Enum: spring, summer, autumn, winter, all | Recommended seasons |
| `intensity` | integer | No | 1-10 | Overall intensity rating |
| `gender` | string | No | Enum: masculine, feminine, unisex | Gender expression |
| `occasion` | string[] | No | Max 10 items | Suggested occasions |
| `inspiration` | string | No | Max 1000 characters | The original prompt or inspiration |
| `parent_id` | string | No | Alphanumeric with hyphens/underscores | ID of the parent formula if remixed |
| `license` | string | No | Max 100 characters | License for sharing |

### `formula`

An array of ingredient objects. The `percentage` values of all ingredients must sum to exactly 100 (with a tolerance of 0.1 to accommodate rounding). The array must contain between 2 and 100 ingredients.

Each ingredient object:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `ingredient` | string | Yes | 1-200 characters | Common name of the ingredient |
| `cas_number` | string | No | Pattern: `^\d{2,7}-\d{2}-\d$` | CAS registry number |
| `iupac_name` | string | No | Max 500 characters | IUPAC systematic name |
| `category` | string | Yes | Enum (see below) | Olfactory category |
| `note_type` | string | Yes | Enum: top, middle, base, modifier | Pyramid position |
| `percentage` | number | Yes | 0-100, precision to 0.01 | Percentage of total formula |
| `intensity` | integer | No | 1-10 | Olfactory intensity at this percentage |
| `volatility` | string | No | Enum: high, medium, low | Evaporation rate |
| `odor_description` | string | No | Max 500 characters | How the ingredient smells |
| `natural` | boolean | No | - | Whether naturally derived |
| `supplier` | string | No | Max 200 characters | Ingredient source |
| `cost_tier` | string | No | Enum: budget, moderate, premium, luxury | Relative cost |

**Category enum values**: citrus, floral, woody, oriental, fresh, aromatic, musk, amber, green, fruity, spicy, gourmand, aquatic, leather, animalic, balsamic, powdery, earthy, smoky, herbal

### `accords`

An array of accord objects describing emergent scent profiles.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | 1-100 characters | Name of the accord |
| `description` | string | No | Max 500 characters | Description of the accord's character |
| `contributing_ingredients` | string[] | No | 2-20 items | Ingredients that create this accord |
| `strength` | string | No | Enum: dominant, supporting, subtle | Prominence in the composition |

### `evolution`

An object with three required phase objects describing how the scent changes over time.

Each phase object:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `duration_minutes` | integer | Yes | 1-1440 | How long the phase lasts |
| `dominant_ingredients` | string[] | Yes | 1-10 items | Most prominent ingredients |
| `character` | string | Yes | 1-500 characters | Prose description of this phase |
| `intensity` | integer | No | 1-10 | Intensity during this phase |
| `sillage` | string | No | Enum: intimate, moderate, strong, enormous | Projection level |

The evolution object also has an optional `total_longevity_hours` field (number, 0.5-48).

### `safety`

An object containing regulatory and safety information.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `ifra_compliant` | boolean | Yes | - | Whether IFRA-compliant |
| `ifra_version` | string | No | Pattern: `^\d+(\.\d+)?$` | IFRA standard version |
| `ifra_category` | integer | No | 1-11 | IFRA product category |
| `allergens` | array | No | Max 30 items | Allergens with concentrations |
| `concentration` | string | No | Enum (see schema) | Concentration category |
| `max_skin_exposure_percent` | number | No | 0-100 | Max recommended skin application |
| `restricted_ingredients` | array | No | - | IFRA-restricted ingredients and limits |
| `phototoxic` | boolean | No | - | Contains phototoxic ingredients |
| `vegan` | boolean | No | - | All ingredients are vegan |
| `eu_cosmetics_regulation_compliant` | boolean | No | - | Meets EU cosmetics regulation |
| `warnings` | string[] | No | Max 20 items | Human-readable warnings |

### `hardware`

An optional object for physical dispensing configuration.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `device_profile` | string | Yes | 1-100 characters | Hardware device identifier |
| `total_volume_ml` | number | No | 0.1-500 | Total volume to produce |
| `channel_mappings` | array | Yes | 1-32 items | Ingredient-to-channel mappings |
| `mix_duration_seconds` | integer | No | 0-600 | Post-dispense mixing time |
| `temperature_celsius` | number | No | 10-60 | Dispensing temperature |
| `calibration_date` | string | No | ISO 8601 date | Last calibration date |
| `notes` | string | No | Max 500 characters | Operator notes |

---

## Complete Example Scents

### Example 1: Fresh Citrus Cologne

A bright, invigorating citrus cologne inspired by Mediterranean mornings. Clean, sparkling, and transparent with an aromatic herbal heart and a soft musky base.

```json
{
  "osc_version": "1.0",
  "metadata": {
    "name": "Mediterranean Dawn",
    "description": "A bright, invigorating citrus cologne inspired by Mediterranean mornings. Sparkling bergamot and lemon open over a heart of lavender and rosemary, settling into a clean base of white cedar and white musk.",
    "author": "promptandsmell",
    "version": "1.0.0",
    "created": "2026-01-15T10:00:00Z",
    "tags": ["citrus", "fresh", "cologne", "summer", "daytime"],
    "mood": ["energizing", "clean", "optimistic"],
    "season": ["spring", "summer"],
    "intensity": 4,
    "gender": "unisex",
    "occasion": ["office", "casual", "sport"],
    "inspiration": "The smell of a lemon grove on the Amalfi Coast at sunrise, with sea air and wild herbs"
  },
  "formula": [
    {
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 12.0,
      "intensity": 7,
      "volatility": "high",
      "odor_description": "Bright, sparkling citrus with a slightly bitter, aromatic green facet",
      "natural": true
    },
    {
      "ingredient": "Lemon",
      "cas_number": "8008-56-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 8.0,
      "intensity": 7,
      "volatility": "high",
      "odor_description": "Sharp, zesty, clean citrus peel",
      "natural": true
    },
    {
      "ingredient": "Grapefruit",
      "cas_number": "8016-20-4",
      "category": "citrus",
      "note_type": "top",
      "percentage": 5.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Tart, juicy, slightly bitter pink citrus",
      "natural": true
    },
    {
      "ingredient": "Petitgrain",
      "cas_number": "8014-17-3",
      "category": "citrus",
      "note_type": "top",
      "percentage": 4.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Green, woody, slightly bitter citrus leaf",
      "natural": true
    },
    {
      "ingredient": "Lavender",
      "cas_number": "8000-28-0",
      "category": "aromatic",
      "note_type": "middle",
      "percentage": 8.0,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Clean, herbaceous, slightly camphorous floral",
      "natural": true
    },
    {
      "ingredient": "Rosemary",
      "cas_number": "8000-25-7",
      "category": "aromatic",
      "note_type": "middle",
      "percentage": 4.0,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Sharp, camphoraceous, green herbal",
      "natural": true
    },
    {
      "ingredient": "Hedione",
      "cas_number": "24851-98-7",
      "category": "fresh",
      "note_type": "middle",
      "percentage": 15.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Transparent, airy, jasmine-like radiance",
      "natural": false
    },
    {
      "ingredient": "Neroli",
      "cas_number": "8016-38-4",
      "category": "floral",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Sweet, honeyed orange blossom with green facets",
      "natural": true
    },
    {
      "ingredient": "Linalool",
      "cas_number": "78-70-6",
      "category": "fresh",
      "note_type": "modifier",
      "percentage": 5.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Clean, fresh, slightly floral with a woody undertone",
      "natural": false
    },
    {
      "ingredient": "Cedarwood (Virginia)",
      "cas_number": "8000-27-9",
      "category": "woody",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Dry, pencil-shaving cedar with a soft, creamy quality",
      "natural": true
    },
    {
      "ingredient": "White Musk (Galaxolide)",
      "cas_number": "1222-05-5",
      "category": "musk",
      "note_type": "base",
      "percentage": 12.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Clean, powdery, skin-like musk with a laundry-fresh quality",
      "natural": false
    },
    {
      "ingredient": "Ambroxan",
      "cas_number": "6790-58-5",
      "category": "amber",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Warm, mineral, ambergris-like with a salty, crystalline edge",
      "natural": false
    },
    {
      "ingredient": "Iso E Super",
      "cas_number": "54464-57-2",
      "category": "woody",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Velvety, smooth, woody-amber with a chameleon-like quality",
      "natural": false
    }
  ],
  "accords": [
    {
      "name": "Citrus Burst",
      "description": "A sparkling, multi-faceted citrus opening combining bergamot's bitterness with lemon's sharpness and grapefruit's tartness",
      "contributing_ingredients": ["Bergamot", "Lemon", "Grapefruit", "Petitgrain"],
      "strength": "dominant"
    },
    {
      "name": "Aromatic Herbal",
      "description": "A clean, herbaceous heart blending Mediterranean lavender with sharp rosemary",
      "contributing_ingredients": ["Lavender", "Rosemary", "Linalool"],
      "strength": "supporting"
    },
    {
      "name": "Clean Skin",
      "description": "A transparent, skin-like base of white musk, ambroxan, and sheer woods",
      "contributing_ingredients": ["White Musk (Galaxolide)", "Ambroxan", "Iso E Super"],
      "strength": "supporting"
    }
  ],
  "evolution": {
    "opening": {
      "duration_minutes": 15,
      "dominant_ingredients": ["Bergamot", "Lemon", "Grapefruit", "Petitgrain"],
      "character": "An immediate burst of bright, sparkling citrus. Bergamot leads with its aromatic bitterness, supported by the sharpness of lemon and the juiciness of grapefruit. Petitgrain adds a green, leafy dimension.",
      "intensity": 7,
      "sillage": "strong"
    },
    "heart": {
      "duration_minutes": 120,
      "dominant_ingredients": ["Lavender", "Hedione", "Neroli", "Rosemary"],
      "character": "As the citrus softens, a clean aromatic heart emerges. Lavender and rosemary provide herbaceous structure while hedione adds transparent radiance. Neroli bridges the citrus top to the herbal heart with its sweet orange blossom character.",
      "intensity": 5,
      "sillage": "moderate"
    },
    "drydown": {
      "duration_minutes": 240,
      "dominant_ingredients": ["Cedarwood (Virginia)", "White Musk (Galaxolide)", "Ambroxan", "Iso E Super"],
      "character": "A soft, clean, woody-musky base. Virginia cedar provides dry warmth, white musk creates a clean skin-scent quality, and ambroxan adds a mineral, slightly salty warmth. Iso E Super smooths everything into a cohesive, velvety finish.",
      "intensity": 3,
      "sillage": "intimate"
    },
    "total_longevity_hours": 6
  },
  "safety": {
    "ifra_compliant": true,
    "ifra_version": "51.0",
    "ifra_category": 4,
    "allergens": [
      { "name": "Linalool", "cas_number": "78-70-6", "percentage": 5.0, "declaration_required": true },
      { "name": "Limonene", "percentage": 3.2, "declaration_required": true },
      { "name": "Citral", "percentage": 0.8, "declaration_required": true },
      { "name": "Geraniol", "percentage": 0.3, "declaration_required": true }
    ],
    "concentration": "edc",
    "max_skin_exposure_percent": 100,
    "phototoxic": false,
    "vegan": true,
    "warnings": [
      "Contains linalool, limonene, citral, and geraniol which may cause allergic reactions in sensitive individuals.",
      "Bergamot oil in this formula is furocourmarin-free (FCF) to avoid phototoxicity."
    ]
  }
}
```

### Example 2: Warm Oriental Perfume

A rich, opulent oriental perfume with saffron, rose, oud, and amber. Deep, sensual, and long-lasting.

```json
{
  "osc_version": "1.0",
  "metadata": {
    "name": "Ember Throne",
    "description": "A rich, opulent oriental perfume. Saffron and pink pepper ignite the opening before giving way to a smoldering heart of Turkish rose and oud. The base is a deep, resinous foundation of amber, benzoin, and sandalwood that lasts for hours.",
    "author": "promptandsmell",
    "version": "1.0.0",
    "created": "2026-01-16T14:30:00Z",
    "tags": ["oriental", "oud", "rose", "saffron", "luxury", "niche"],
    "mood": ["sensual", "mysterious", "powerful", "confident"],
    "season": ["autumn", "winter"],
    "intensity": 8,
    "gender": "unisex",
    "occasion": ["evening", "date night", "special occasion"],
    "inspiration": "A candlelit room in an ancient palace, with rose petals scattered on warm sandstone and oud smoke rising from a brass censer"
  },
  "formula": [
    {
      "ingredient": "Saffron (Safraleine)",
      "cas_number": "54440-17-4",
      "category": "spicy",
      "note_type": "top",
      "percentage": 2.0,
      "intensity": 8,
      "volatility": "high",
      "odor_description": "Metallic, leathery, honeyed spice with a dried-hay facet",
      "natural": false
    },
    {
      "ingredient": "Pink Pepper",
      "cas_number": "68650-39-5",
      "category": "spicy",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Bright, rosy, slightly fruity pepper with a woody undertone",
      "natural": true
    },
    {
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 4.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Aromatic, slightly bitter citrus to add lift to the opening",
      "natural": true
    },
    {
      "ingredient": "Cardamom",
      "cas_number": "8000-66-6",
      "category": "spicy",
      "note_type": "top",
      "percentage": 2.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Cool, aromatic, camphoraceous spice with eucalyptus facets",
      "natural": true
    },
    {
      "ingredient": "Rose Absolute (Turkish)",
      "cas_number": "8007-01-0",
      "category": "floral",
      "note_type": "middle",
      "percentage": 8.0,
      "intensity": 8,
      "volatility": "medium",
      "odor_description": "Deep, honeyed, jammy rose with a slightly spicy, wine-like facet",
      "natural": true,
      "cost_tier": "luxury"
    },
    {
      "ingredient": "Oud (Synthetic Accord)",
      "category": "woody",
      "note_type": "middle",
      "percentage": 6.0,
      "intensity": 9,
      "volatility": "medium",
      "odor_description": "Complex, animalic, barnyard-like woodiness with medicinal and smoky facets",
      "natural": false
    },
    {
      "ingredient": "Frankincense (Olibanum)",
      "cas_number": "8016-36-2",
      "category": "smoky",
      "note_type": "middle",
      "percentage": 4.0,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Resinous, lemony, slightly balsamic incense smoke",
      "natural": true
    },
    {
      "ingredient": "Cypriol (Nagarmotha)",
      "cas_number": "51585-37-0",
      "category": "woody",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Dark, smoky, earthy, leathery woody note reminiscent of oud",
      "natural": true
    },
    {
      "ingredient": "Labdanum",
      "cas_number": "8016-26-0",
      "category": "amber",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 7,
      "volatility": "low",
      "odor_description": "Rich, warm, honeyed amber with leathery and balsamic facets",
      "natural": true
    },
    {
      "ingredient": "Benzoin (Siam)",
      "cas_number": "9000-05-9",
      "category": "balsamic",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 6,
      "volatility": "low",
      "odor_description": "Sweet, warm, vanillic balsam with a slightly chocolatey quality",
      "natural": true
    },
    {
      "ingredient": "Sandalwood (Australian)",
      "cas_number": "8006-87-9",
      "category": "woody",
      "note_type": "base",
      "percentage": 12.0,
      "intensity": 6,
      "volatility": "low",
      "odor_description": "Creamy, milky, smooth wood with a subtle sweetness",
      "natural": true,
      "cost_tier": "premium"
    },
    {
      "ingredient": "Vanilla Absolute",
      "cas_number": "8024-06-4",
      "category": "gourmand",
      "note_type": "base",
      "percentage": 5.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Rich, dark, boozy vanilla with a leathery, smoky depth",
      "natural": true,
      "cost_tier": "luxury"
    },
    {
      "ingredient": "Cashmeran",
      "cas_number": "33704-61-9",
      "category": "musk",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Warm, musky, velvety, slightly spicy with a clean, woody nuance",
      "natural": false
    },
    {
      "ingredient": "Civet (Synthetic)",
      "category": "animalic",
      "note_type": "base",
      "percentage": 1.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Warm, animalic, sensual undertone that adds depth and carnality",
      "natural": false
    },
    {
      "ingredient": "Iso E Super",
      "cas_number": "54464-57-2",
      "category": "woody",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Smooth, velvety woody-amber that creates a halo effect",
      "natural": false
    },
    {
      "ingredient": "Styrax",
      "cas_number": "8024-01-9",
      "category": "balsamic",
      "note_type": "base",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Sweet, balsamic, slightly leathery with a cinnamon-like nuance",
      "natural": true
    },
    {
      "ingredient": "Musk (Ethylene Brassylate)",
      "cas_number": "105-95-3",
      "category": "musk",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Soft, sweet, powdery musk with a clean, skin-like quality",
      "natural": false
    },
    {
      "ingredient": "Coumarin",
      "cas_number": "91-64-5",
      "category": "powdery",
      "note_type": "modifier",
      "percentage": 2.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Warm, hay-like, tonka-bean sweetness with a powdery quality",
      "natural": false
    },
    {
      "ingredient": "Eugenol",
      "cas_number": "97-53-0",
      "category": "spicy",
      "note_type": "modifier",
      "percentage": 0.5,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Warm, clove-like spice",
      "natural": true
    },
    {
      "ingredient": "Indole",
      "cas_number": "120-72-9",
      "category": "animalic",
      "note_type": "modifier",
      "percentage": 0.1,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "At trace levels: a dark, narcotic floral depth. Enhances rose and adds carnality.",
      "natural": false
    },
    {
      "ingredient": "Damascenone",
      "category": "fruity",
      "note_type": "modifier",
      "percentage": 0.05,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Extremely potent; adds a jammy, dried-fruit, wine-like facet to the rose",
      "natural": false
    },
    {
      "ingredient": "Methyl Laitone",
      "category": "gourmand",
      "note_type": "modifier",
      "percentage": 1.35,
      "intensity": 3,
      "volatility": "medium",
      "odor_description": "Creamy, coconut-like, milky smoothness",
      "natural": false
    }
  ],
  "accords": [
    {
      "name": "Rose-Oud",
      "description": "The classic Middle Eastern pairing of deep, honeyed rose with animalic, smoky oud",
      "contributing_ingredients": ["Rose Absolute (Turkish)", "Oud (Synthetic Accord)", "Cypriol (Nagarmotha)", "Indole"],
      "strength": "dominant"
    },
    {
      "name": "Amber",
      "description": "A warm, resinous amber base built from labdanum, benzoin, vanilla, and coumarin",
      "contributing_ingredients": ["Labdanum", "Benzoin (Siam)", "Vanilla Absolute", "Coumarin"],
      "strength": "dominant"
    },
    {
      "name": "Spice Constellation",
      "description": "A complex spice accord of saffron, cardamom, pink pepper, and eugenol creating warmth without sharpness",
      "contributing_ingredients": ["Saffron (Safraleine)", "Pink Pepper", "Cardamom", "Eugenol"],
      "strength": "supporting"
    },
    {
      "name": "Incense Smoke",
      "description": "Smoky, resinous church-incense quality from frankincense and styrax",
      "contributing_ingredients": ["Frankincense (Olibanum)", "Styrax"],
      "strength": "supporting"
    }
  ],
  "evolution": {
    "opening": {
      "duration_minutes": 20,
      "dominant_ingredients": ["Saffron (Safraleine)", "Pink Pepper", "Bergamot", "Cardamom"],
      "character": "An arresting, spicy-metallic opening. Saffron hits first with its distinctive leathery, honeyed character, immediately supported by the rosy brightness of pink pepper. Bergamot adds a brief citrus lift while cardamom contributes cool, aromatic freshness. The overall impression is warm, luxurious, and attention-grabbing.",
      "intensity": 8,
      "sillage": "strong"
    },
    "heart": {
      "duration_minutes": 180,
      "dominant_ingredients": ["Rose Absolute (Turkish)", "Oud (Synthetic Accord)", "Frankincense (Olibanum)", "Cypriol (Nagarmotha)"],
      "character": "The heart is where this fragrance truly reveals itself. Turkish rose blooms in full, deep and jammy, intertwined with the animalic complexity of oud. Frankincense adds a church-like solemnity while cypriol reinforces the dark, smoky woodiness. This is the signature of the scent: opulent, slightly mysterious, and deeply sensual.",
      "intensity": 8,
      "sillage": "strong"
    },
    "drydown": {
      "duration_minutes": 480,
      "dominant_ingredients": ["Sandalwood (Australian)", "Labdanum", "Benzoin (Siam)", "Cashmeran", "Vanilla Absolute"],
      "character": "The drydown is a warm, enveloping cocoon. Sandalwood provides a creamy, milky foundation. Labdanum and benzoin create a rich amber glow. Vanilla adds dark sweetness without becoming gourmand. Cashmeran wraps everything in a velvety, musky softness. The scent becomes increasingly intimate and skin-like over time.",
      "intensity": 6,
      "sillage": "moderate"
    },
    "total_longevity_hours": 12
  },
  "safety": {
    "ifra_compliant": true,
    "ifra_version": "51.0",
    "ifra_category": 4,
    "allergens": [
      { "name": "Eugenol", "cas_number": "97-53-0", "percentage": 0.5, "declaration_required": true },
      { "name": "Coumarin", "cas_number": "91-64-5", "percentage": 2.0, "declaration_required": true },
      { "name": "Citronellol", "percentage": 0.4, "declaration_required": true },
      { "name": "Geraniol", "percentage": 0.3, "declaration_required": true },
      { "name": "Linalool", "percentage": 0.2, "declaration_required": true }
    ],
    "concentration": "edp",
    "max_skin_exposure_percent": 100,
    "phototoxic": false,
    "vegan": true,
    "warnings": [
      "Contains eugenol, coumarin, citronellol, geraniol, and linalool.",
      "This is an EDP-strength concentration. Apply sparingly; the scent is powerful.",
      "All animalic notes (civet, indole) are synthetic and vegan."
    ]
  }
}
```

### Example 3: Green Forest Accord

A naturalistic forest accord evoking damp earth, pine needles, moss, and distant wildflowers after rain.

```json
{
  "osc_version": "1.0",
  "metadata": {
    "name": "Petrichor Canopy",
    "description": "A naturalistic green accord evoking the deep interior of a temperate forest after rainfall. Crisp pine and fir needles mix with damp oakmoss, wet earth, and the distant sweetness of wildflowers. Designed to smell like nature rather than perfume.",
    "author": "promptandsmell",
    "version": "1.0.0",
    "created": "2026-01-17T09:15:00Z",
    "tags": ["green", "forest", "nature", "earthy", "moss", "rain"],
    "mood": ["contemplative", "peaceful", "grounded", "meditative"],
    "season": ["spring", "autumn"],
    "intensity": 5,
    "gender": "unisex",
    "occasion": ["casual", "outdoor", "meditation"],
    "inspiration": "Walking through an old-growth forest in the Pacific Northwest after a morning rain"
  },
  "formula": [
    {
      "ingredient": "Galbanum",
      "cas_number": "8023-91-4",
      "category": "green",
      "note_type": "top",
      "percentage": 4.0,
      "intensity": 7,
      "volatility": "high",
      "odor_description": "Intensely green, sharp, leafy, with a rubbery-metallic edge",
      "natural": true
    },
    {
      "ingredient": "Pine Needle",
      "cas_number": "8002-09-3",
      "category": "aromatic",
      "note_type": "top",
      "percentage": 6.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Fresh, resinous, balsamic conifer needles",
      "natural": true
    },
    {
      "ingredient": "Juniper Berry",
      "cas_number": "8012-91-7",
      "category": "aromatic",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Crisp, gin-like, slightly peppery conifer berry",
      "natural": true
    },
    {
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 4,
      "volatility": "high",
      "odor_description": "Light citrus lift to brighten the green opening",
      "natural": true
    },
    {
      "ingredient": "Violet Leaf Absolute",
      "cas_number": "8024-08-6",
      "category": "green",
      "note_type": "middle",
      "percentage": 4.0,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Intensely green, watery, cucumber-like leaf with a slightly earthy quality",
      "natural": true,
      "cost_tier": "premium"
    },
    {
      "ingredient": "Fir Balsam Absolute",
      "cas_number": "8021-28-1",
      "category": "woody",
      "note_type": "middle",
      "percentage": 5.0,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Deep, balsamic, resinous, forest-like warmth",
      "natural": true
    },
    {
      "ingredient": "Geranium",
      "cas_number": "8000-46-2",
      "category": "floral",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Green, rosy, slightly minty herbal note to add a wildflower facet",
      "natural": true
    },
    {
      "ingredient": "Hedione",
      "cas_number": "24851-98-7",
      "category": "fresh",
      "note_type": "middle",
      "percentage": 8.0,
      "intensity": 3,
      "volatility": "medium",
      "odor_description": "Transparent, dewy, fresh air effect",
      "natural": false
    },
    {
      "ingredient": "Clary Sage",
      "cas_number": "8016-63-5",
      "category": "herbal",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Herbaceous, slightly sweet, tea-like, earthy",
      "natural": true
    },
    {
      "ingredient": "Oakmoss (Synthetic)",
      "category": "earthy",
      "note_type": "base",
      "percentage": 5.0,
      "intensity": 6,
      "volatility": "low",
      "odor_description": "Damp, mossy, earthy, forest-floor character with a slightly marine facet",
      "natural": false
    },
    {
      "ingredient": "Vetiver (Haiti)",
      "cas_number": "8016-96-4",
      "category": "woody",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 6,
      "volatility": "low",
      "odor_description": "Earthy, rooty, smoky, with a damp soil quality",
      "natural": true
    },
    {
      "ingredient": "Patchouli",
      "cas_number": "8014-09-3",
      "category": "earthy",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Damp earth, dark, slightly sweet, camphoraceous",
      "natural": true
    },
    {
      "ingredient": "Cedarwood (Atlas)",
      "cas_number": "8000-27-9",
      "category": "woody",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Dry, warm, pencil-shaving cedar with a slightly creamy facet",
      "natural": true
    },
    {
      "ingredient": "Cypress",
      "cas_number": "8013-86-3",
      "category": "woody",
      "note_type": "base",
      "percentage": 4.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Dry, coniferous, slightly smoky evergreen wood",
      "natural": true
    },
    {
      "ingredient": "Iso E Super",
      "cas_number": "54464-57-2",
      "category": "woody",
      "note_type": "base",
      "percentage": 12.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Smooth, woody, amber-like halo effect",
      "natural": false
    },
    {
      "ingredient": "Cetalox",
      "cas_number": "3738-00-9",
      "category": "amber",
      "note_type": "base",
      "percentage": 5.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Clean, crystalline, ambergris-like with a woody-mineral quality",
      "natural": false
    },
    {
      "ingredient": "Habanolide",
      "cas_number": "34902-57-3",
      "category": "musk",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Clean, slightly metallic musk with a woody facet",
      "natural": false
    },
    {
      "ingredient": "Florhydral",
      "category": "green",
      "note_type": "modifier",
      "percentage": 1.5,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Green, hyacinth-like, watery, dewy",
      "natural": false
    },
    {
      "ingredient": "Cis-3-Hexenol",
      "cas_number": "928-96-1",
      "category": "green",
      "note_type": "modifier",
      "percentage": 1.5,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Fresh-cut grass, intensely green, natural, watery leaf",
      "natural": false
    }
  ],
  "accords": [
    {
      "name": "Forest Floor",
      "description": "Damp, mossy, earthy foundation evoking wet soil and decomposing leaves",
      "contributing_ingredients": ["Oakmoss (Synthetic)", "Vetiver (Haiti)", "Patchouli"],
      "strength": "dominant"
    },
    {
      "name": "Conifer Canopy",
      "description": "Fresh, resinous pine and fir needle accord with juniper highlights",
      "contributing_ingredients": ["Pine Needle", "Fir Balsam Absolute", "Juniper Berry", "Cypress"],
      "strength": "dominant"
    },
    {
      "name": "Petrichor",
      "description": "The smell of rain on dry earth, created by green notes, minerality, and dampness",
      "contributing_ingredients": ["Galbanum", "Violet Leaf Absolute", "Hedione", "Cis-3-Hexenol"],
      "strength": "supporting"
    }
  ],
  "evolution": {
    "opening": {
      "duration_minutes": 20,
      "dominant_ingredients": ["Galbanum", "Pine Needle", "Juniper Berry", "Cis-3-Hexenol"],
      "character": "An immediate hit of sharp green and crisp conifer. Galbanum provides the metallic, vegetal snap while pine needles and juniper create a crystalline forest-air impression. Cis-3-hexenol adds a fleeting burst of fresh-cut grass and wet leaves.",
      "intensity": 6,
      "sillage": "moderate"
    },
    "heart": {
      "duration_minutes": 120,
      "dominant_ingredients": ["Violet Leaf Absolute", "Fir Balsam Absolute", "Hedione", "Clary Sage"],
      "character": "The heart softens into a more rounded, naturalistic green. Violet leaf provides a watery, cucumber-tinged greenness. Fir balsam adds deep, resinous warmth. Hedione creates an impression of clean, damp air moving through trees. Clary sage adds an herbal, almost tea-like nuance.",
      "intensity": 5,
      "sillage": "moderate"
    },
    "drydown": {
      "duration_minutes": 360,
      "dominant_ingredients": ["Vetiver (Haiti)", "Oakmoss (Synthetic)", "Cedarwood (Atlas)", "Patchouli", "Iso E Super"],
      "character": "The drydown is all earth, moss, and wood. Vetiver dominates with its rooty, smoky character. Oakmoss adds damp forest-floor mossyness. Cedar and patchouli provide warm, woody structure. The overall effect is of standing deep in an ancient forest, surrounded by old trees and damp earth.",
      "intensity": 4,
      "sillage": "intimate"
    },
    "total_longevity_hours": 8
  },
  "safety": {
    "ifra_compliant": true,
    "ifra_version": "51.0",
    "ifra_category": 4,
    "allergens": [
      { "name": "Linalool", "percentage": 1.2, "declaration_required": true },
      { "name": "Limonene", "percentage": 0.8, "declaration_required": true },
      { "name": "Citronellol", "percentage": 0.5, "declaration_required": true },
      { "name": "Geraniol", "percentage": 0.4, "declaration_required": true }
    ],
    "concentration": "edp",
    "phototoxic": false,
    "vegan": true,
    "warnings": [
      "Oakmoss in this formula is a synthetic replacement (Evernyl/Veramoss) compliant with current IFRA restrictions.",
      "Contains linalool, limonene, citronellol, and geraniol."
    ]
  }
}
```

### Example 4: Gourmand Vanilla

A warm, cozy gourmand fragrance centered on rich vanilla with supporting notes of tonka bean, coffee, caramel, and warm spices.

```json
{
  "osc_version": "1.0",
  "metadata": {
    "name": "Velvet Craving",
    "description": "A warm, enveloping gourmand fragrance built around rich Bourbon vanilla. Roasted coffee and a touch of rum open the scent before revealing a heart of caramelized tonka bean, praline, and warm cinnamon. The base is a deep, resinous blanket of benzoin, musk, and sandalwood.",
    "author": "promptandsmell",
    "version": "1.0.0",
    "created": "2026-01-18T16:00:00Z",
    "tags": ["gourmand", "vanilla", "coffee", "cozy", "sweet", "comfort"],
    "mood": ["cozy", "comforting", "indulgent", "warm"],
    "season": ["autumn", "winter"],
    "intensity": 7,
    "gender": "unisex",
    "occasion": ["casual", "evening", "cozy night in"],
    "inspiration": "A Parisian patisserie in winter: warm vanilla custard, espresso, caramelized sugar, and buttery pastry"
  },
  "formula": [
    {
      "ingredient": "Coffee Absolute",
      "cas_number": "8001-67-0",
      "category": "gourmand",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 7,
      "volatility": "high",
      "odor_description": "Rich, roasted, slightly bitter espresso with dark chocolate undertones",
      "natural": true,
      "cost_tier": "premium"
    },
    {
      "ingredient": "Cardamom",
      "cas_number": "8000-66-6",
      "category": "spicy",
      "note_type": "top",
      "percentage": 2.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Cool, aromatic spice that bridges coffee and vanilla",
      "natural": true
    },
    {
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 4,
      "volatility": "high",
      "odor_description": "Light citrus lift to prevent the opening from being too heavy",
      "natural": true
    },
    {
      "ingredient": "Pink Pepper",
      "cas_number": "68650-39-5",
      "category": "spicy",
      "note_type": "top",
      "percentage": 1.5,
      "intensity": 4,
      "volatility": "high",
      "odor_description": "Bright, rosy pepper to add sparkle to the sweet opening",
      "natural": true
    },
    {
      "ingredient": "Rum Absolute",
      "category": "gourmand",
      "note_type": "top",
      "percentage": 1.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Boozy, sweet, caramelized sugar with a slight molasses quality",
      "natural": true
    },
    {
      "ingredient": "Cinnamon (Ceylon)",
      "cas_number": "8015-91-6",
      "category": "spicy",
      "note_type": "middle",
      "percentage": 1.5,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Warm, sweet, slightly woody spice",
      "natural": true
    },
    {
      "ingredient": "Tonka Bean Absolute",
      "cas_number": "8046-22-8",
      "category": "gourmand",
      "note_type": "middle",
      "percentage": 5.0,
      "intensity": 6,
      "volatility": "medium",
      "odor_description": "Warm, sweet, hay-like, almond-cherry quality with a tobacco facet",
      "natural": true,
      "cost_tier": "premium"
    },
    {
      "ingredient": "Heliotropin",
      "cas_number": "120-57-0",
      "category": "powdery",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Sweet, powdery, almond-cherry, marzipan-like",
      "natural": false
    },
    {
      "ingredient": "Caramel (Ethyl Maltol)",
      "cas_number": "4940-11-8",
      "category": "gourmand",
      "note_type": "middle",
      "percentage": 1.0,
      "intensity": 7,
      "volatility": "medium",
      "odor_description": "Intensely sweet, cotton candy, caramelized sugar",
      "natural": false
    },
    {
      "ingredient": "Cocoa Absolute",
      "category": "gourmand",
      "note_type": "middle",
      "percentage": 2.0,
      "intensity": 5,
      "volatility": "medium",
      "odor_description": "Dark chocolate, roasted cacao, slightly bitter and dusty",
      "natural": true
    },
    {
      "ingredient": "Vanilla Absolute (Bourbon)",
      "cas_number": "8024-06-4",
      "category": "gourmand",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 8,
      "volatility": "low",
      "odor_description": "Rich, creamy, dark vanilla with boozy, leathery, and balsamic facets",
      "natural": true,
      "cost_tier": "luxury"
    },
    {
      "ingredient": "Vanillin",
      "cas_number": "121-33-5",
      "category": "gourmand",
      "note_type": "base",
      "percentage": 4.0,
      "intensity": 7,
      "volatility": "low",
      "odor_description": "Pure vanilla sweetness, clean and straightforward",
      "natural": false
    },
    {
      "ingredient": "Benzoin (Siam)",
      "cas_number": "9000-05-9",
      "category": "balsamic",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Sweet, warm, vanillic balsam that reinforces the vanilla",
      "natural": true
    },
    {
      "ingredient": "Sandalwood (Australian)",
      "cas_number": "8006-87-9",
      "category": "woody",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Creamy, milky, smooth wood that adds sophistication to the sweetness",
      "natural": true,
      "cost_tier": "premium"
    },
    {
      "ingredient": "Cashmeran",
      "cas_number": "33704-61-9",
      "category": "musk",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Warm, musky, velvety, slightly spicy. Adds a cashmere-blanket quality.",
      "natural": false
    },
    {
      "ingredient": "Musk (Galaxolide)",
      "cas_number": "1222-05-5",
      "category": "musk",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Clean, slightly sweet, powdery musk",
      "natural": false
    },
    {
      "ingredient": "Coumarin",
      "cas_number": "91-64-5",
      "category": "powdery",
      "note_type": "modifier",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Warm, hay-like, tonka-like sweetness that bridges gourmand and woody",
      "natural": false
    },
    {
      "ingredient": "Labdanum",
      "cas_number": "8016-26-0",
      "category": "amber",
      "note_type": "base",
      "percentage": 4.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Warm, honeyed, slightly leathery amber resin",
      "natural": true
    },
    {
      "ingredient": "Iso E Super",
      "cas_number": "54464-57-2",
      "category": "woody",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Smooth woody-amber that adds depth without competing with the sweetness",
      "natural": false
    },
    {
      "ingredient": "Methyl Laitone",
      "category": "gourmand",
      "note_type": "modifier",
      "percentage": 2.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Creamy, coconut-like, milky smoothness that enhances the custard quality",
      "natural": false
    },
    {
      "ingredient": "Nutmeg",
      "cas_number": "8008-45-5",
      "category": "spicy",
      "note_type": "modifier",
      "percentage": 1.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Warm, slightly sweet, baking-spice character",
      "natural": true
    }
  ],
  "accords": [
    {
      "name": "Vanilla Custard",
      "description": "A rich, creamy, multi-layered vanilla built from natural absolute, vanillin, benzoin, and methyl laitone",
      "contributing_ingredients": ["Vanilla Absolute (Bourbon)", "Vanillin", "Benzoin (Siam)", "Methyl Laitone"],
      "strength": "dominant"
    },
    {
      "name": "Patisserie",
      "description": "An edible, bakery-like quality from caramel, tonka, heliotropin, and warm spices",
      "contributing_ingredients": ["Tonka Bean Absolute", "Caramel (Ethyl Maltol)", "Heliotropin", "Cinnamon (Ceylon)", "Nutmeg"],
      "strength": "supporting"
    },
    {
      "name": "Espresso",
      "description": "A roasted, slightly bitter coffee note that adds sophistication and prevents cloying sweetness",
      "contributing_ingredients": ["Coffee Absolute", "Cocoa Absolute"],
      "strength": "supporting"
    },
    {
      "name": "Cashmere Base",
      "description": "A soft, velvety, fabric-like warmth from cashmeran, musk, and sandalwood",
      "contributing_ingredients": ["Cashmeran", "Musk (Galaxolide)", "Sandalwood (Australian)"],
      "strength": "supporting"
    }
  ],
  "evolution": {
    "opening": {
      "duration_minutes": 15,
      "dominant_ingredients": ["Coffee Absolute", "Cardamom", "Bergamot", "Rum Absolute"],
      "character": "A rich, inviting opening that smells like walking into a warm cafe. Roasted coffee dominates, supported by the cool spice of cardamom. Bergamot adds a brief citrus brightness, and rum absolute contributes a boozy, caramelized sweetness.",
      "intensity": 7,
      "sillage": "strong"
    },
    "heart": {
      "duration_minutes": 150,
      "dominant_ingredients": ["Tonka Bean Absolute", "Cinnamon (Ceylon)", "Heliotropin", "Caramel (Ethyl Maltol)", "Cocoa Absolute"],
      "character": "The heart transitions into full patisserie mode. Tonka bean provides its warm, hay-sweet character. Cinnamon adds bakery warmth. Heliotropin contributes a marzipan-cherry powderiness. Ethyl maltol adds caramelized sweetness, and cocoa absolute provides a dark chocolate dimension.",
      "intensity": 7,
      "sillage": "moderate"
    },
    "drydown": {
      "duration_minutes": 360,
      "dominant_ingredients": ["Vanilla Absolute (Bourbon)", "Vanillin", "Benzoin (Siam)", "Sandalwood (Australian)", "Cashmeran"],
      "character": "The drydown is a warm, creamy vanilla embrace. The Bourbon vanilla absolute provides deep, complex sweetness with boozy and leathery facets. Benzoin reinforces the balsamic warmth. Sandalwood adds creamy woodiness, and cashmeran creates a velvety, cashmere-like softness. The scent becomes a comforting, skin-scent blanket.",
      "intensity": 5,
      "sillage": "intimate"
    },
    "total_longevity_hours": 10
  },
  "safety": {
    "ifra_compliant": true,
    "ifra_version": "51.0",
    "ifra_category": 4,
    "allergens": [
      { "name": "Coumarin", "cas_number": "91-64-5", "percentage": 3.0, "declaration_required": true },
      { "name": "Eugenol", "percentage": 0.6, "declaration_required": true },
      { "name": "Cinnamal", "percentage": 0.4, "declaration_required": true },
      { "name": "Linalool", "percentage": 0.3, "declaration_required": true }
    ],
    "concentration": "edp",
    "phototoxic": false,
    "vegan": true,
    "warnings": [
      "Contains coumarin, eugenol, cinnamal, and linalool.",
      "Ethyl maltol is used at low levels but can be cloying if formula is over-applied."
    ]
  }
}
```

### Example 5: Clean Aquatic Scent

A fresh, transparent aquatic fragrance evoking ocean spray, clean salt air, and sun-warmed driftwood.

```json
{
  "osc_version": "1.0",
  "metadata": {
    "name": "Salt & Horizon",
    "description": "A clean, transparent aquatic fragrance that captures the essence of standing on a rocky coastline. Sea spray, salt air, and marine ozone give way to a heart of white tea and sheer florals, settling into a base of sun-warmed driftwood, white musk, and ambergris.",
    "author": "promptandsmell",
    "version": "1.0.0",
    "created": "2026-01-19T11:45:00Z",
    "tags": ["aquatic", "marine", "fresh", "clean", "ocean", "salt"],
    "mood": ["clean", "free", "serene", "refreshing"],
    "season": ["spring", "summer"],
    "intensity": 4,
    "gender": "unisex",
    "occasion": ["everyday", "office", "casual", "beach"],
    "inspiration": "Standing on a sea cliff at dawn, salt spray on your face, watching waves break over smooth stones below"
  },
  "formula": [
    {
      "ingredient": "Calone",
      "cas_number": "28940-11-6",
      "category": "aquatic",
      "note_type": "top",
      "percentage": 0.5,
      "intensity": 7,
      "volatility": "high",
      "odor_description": "Intensely marine, watermelon-like, ozonic sea breeze. Extremely powerful; used at trace levels.",
      "natural": false
    },
    {
      "ingredient": "Dihydromyrcenol",
      "cas_number": "18479-58-8",
      "category": "fresh",
      "note_type": "top",
      "percentage": 8.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Clean, citrus-metallic freshness with a lime-like facet. The backbone of most fresh masculine fragrances.",
      "natural": false
    },
    {
      "ingredient": "Bergamot",
      "cas_number": "8007-75-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 6.0,
      "intensity": 6,
      "volatility": "high",
      "odor_description": "Bright, aromatic citrus with green and slightly floral facets",
      "natural": true
    },
    {
      "ingredient": "Lemon",
      "cas_number": "8008-56-8",
      "category": "citrus",
      "note_type": "top",
      "percentage": 3.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Sharp, clean, zesty citrus peel",
      "natural": true
    },
    {
      "ingredient": "Marine Salt Accord",
      "category": "aquatic",
      "note_type": "top",
      "percentage": 2.0,
      "intensity": 5,
      "volatility": "high",
      "odor_description": "Mineral, briny, sea-salt impression",
      "natural": false
    },
    {
      "ingredient": "Hedione",
      "cas_number": "24851-98-7",
      "category": "fresh",
      "note_type": "middle",
      "percentage": 15.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Transparent, airy, jasmine-like radiance that creates a sense of open space and clean air",
      "natural": false
    },
    {
      "ingredient": "White Tea Accord",
      "category": "herbal",
      "note_type": "middle",
      "percentage": 4.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Delicate, slightly sweet, green tea with a clean, calming quality",
      "natural": false
    },
    {
      "ingredient": "Lily of the Valley (Muguet)",
      "category": "floral",
      "note_type": "middle",
      "percentage": 3.0,
      "intensity": 4,
      "volatility": "medium",
      "odor_description": "Clean, dewy, green-floral with a watery transparency",
      "natural": false
    },
    {
      "ingredient": "Magnolia",
      "category": "floral",
      "note_type": "middle",
      "percentage": 2.0,
      "intensity": 3,
      "volatility": "medium",
      "odor_description": "Sheer, citrusy, clean floral with a slightly creamy quality",
      "natural": false
    },
    {
      "ingredient": "Linalool",
      "cas_number": "78-70-6",
      "category": "fresh",
      "note_type": "modifier",
      "percentage": 3.0,
      "intensity": 3,
      "volatility": "medium",
      "odor_description": "Clean, fresh, slightly woody-floral",
      "natural": false
    },
    {
      "ingredient": "Driftwood Accord (Cashmeran + Cedar)",
      "category": "woody",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Sun-bleached, dry, slightly salty wood with a smooth, worn quality",
      "natural": false
    },
    {
      "ingredient": "Ambroxan",
      "cas_number": "6790-58-5",
      "category": "amber",
      "note_type": "base",
      "percentage": 8.0,
      "intensity": 5,
      "volatility": "low",
      "odor_description": "Warm, mineral, ambergris-like with a salty, crystalline quality that reinforces the marine theme",
      "natural": false
    },
    {
      "ingredient": "White Musk (Galaxolide)",
      "cas_number": "1222-05-5",
      "category": "musk",
      "note_type": "base",
      "percentage": 12.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Clean, powdery, laundry-fresh musk",
      "natural": false
    },
    {
      "ingredient": "Cedarwood (Virginia)",
      "cas_number": "8000-27-9",
      "category": "woody",
      "note_type": "base",
      "percentage": 6.0,
      "intensity": 4,
      "volatility": "low",
      "odor_description": "Dry, pencil-shaving cedar",
      "natural": true
    },
    {
      "ingredient": "Iso E Super",
      "cas_number": "54464-57-2",
      "category": "woody",
      "note_type": "base",
      "percentage": 10.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Smooth, woody-amber halo",
      "natural": false
    },
    {
      "ingredient": "Cetalox",
      "cas_number": "3738-00-9",
      "category": "amber",
      "note_type": "base",
      "percentage": 4.0,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Clean, mineral, ambergris substitute",
      "natural": false
    },
    {
      "ingredient": "Ethylene Brassylate",
      "cas_number": "105-95-3",
      "category": "musk",
      "note_type": "base",
      "percentage": 5.5,
      "intensity": 3,
      "volatility": "low",
      "odor_description": "Soft, sweet, powdery musk with a clean, abstract quality",
      "natural": false
    }
  ],
  "accords": [
    {
      "name": "Marine Breeze",
      "description": "A fresh, ozonic, salt-air impression created by calone, dihydromyrcenol, and marine salt accord",
      "contributing_ingredients": ["Calone", "Dihydromyrcenol", "Marine Salt Accord"],
      "strength": "dominant"
    },
    {
      "name": "Clean Transparency",
      "description": "An abstract, clean, open-air freshness from hedione, linalool, and sheer florals",
      "contributing_ingredients": ["Hedione", "Linalool", "Lily of the Valley (Muguet)", "Magnolia"],
      "strength": "supporting"
    },
    {
      "name": "Ambergris Driftwood",
      "description": "Sun-bleached wood and mineral ambergris creating a coastal base",
      "contributing_ingredients": ["Driftwood Accord (Cashmeran + Cedar)", "Ambroxan", "Cetalox"],
      "strength": "supporting"
    },
    {
      "name": "White Musk Cloud",
      "description": "A soft, enveloping, clean musk foundation",
      "contributing_ingredients": ["White Musk (Galaxolide)", "Ethylene Brassylate"],
      "strength": "supporting"
    }
  ],
  "evolution": {
    "opening": {
      "duration_minutes": 15,
      "dominant_ingredients": ["Calone", "Dihydromyrcenol", "Bergamot", "Lemon", "Marine Salt Accord"],
      "character": "An immediate blast of fresh sea air. Calone provides the unmistakable marine, ozonic character. Dihydromyrcenol adds clean, metallic freshness. Bergamot and lemon contribute bright citrus sparkle. The marine salt accord enhances the briny, coastal impression. It smells like a deep breath of ocean air on a clear morning.",
      "intensity": 6,
      "sillage": "moderate"
    },
    "heart": {
      "duration_minutes": 120,
      "dominant_ingredients": ["Hedione", "White Tea Accord", "Lily of the Valley (Muguet)", "Magnolia"],
      "character": "As the initial marine blast softens, a transparent, airy heart emerges. Hedione dominates with its remarkable ability to create a sense of open space and clean air. White tea adds a calming, slightly sweet, green quality. Muguet and magnolia contribute the faintest suggestion of clean flowers without ever becoming overtly floral.",
      "intensity": 4,
      "sillage": "moderate"
    },
    "drydown": {
      "duration_minutes": 240,
      "dominant_ingredients": ["Ambroxan", "White Musk (Galaxolide)", "Driftwood Accord (Cashmeran + Cedar)", "Iso E Super"],
      "character": "The drydown is warm, mineral, and skin-like. Ambroxan provides a salty, crystalline warmth reminiscent of sun-dried sea salt. White musk creates a clean, powdery softness. The driftwood accord adds sun-bleached woody warmth. Iso E Super smooths everything into a cohesive, slightly ethereal finish. The overall impression is of clean, warm skin after a day at the beach.",
      "intensity": 3,
      "sillage": "intimate"
    },
    "total_longevity_hours": 6
  },
  "safety": {
    "ifra_compliant": true,
    "ifra_version": "51.0",
    "ifra_category": 4,
    "allergens": [
      { "name": "Linalool", "cas_number": "78-70-6", "percentage": 3.0, "declaration_required": true },
      { "name": "Limonene", "percentage": 1.5, "declaration_required": true },
      { "name": "Citral", "percentage": 0.3, "declaration_required": true }
    ],
    "concentration": "edt",
    "phototoxic": false,
    "vegan": true,
    "warnings": [
      "Contains linalool, limonene, and citral.",
      "Calone is used at very low concentration (0.5%) but has extremely high impact; adjust carefully if modifying."
    ]
  }
}
```

---

## Ingredient Taxonomy and Categories

OSC defines 20 ingredient categories that map to the extended fragrance wheel:

| Category | Description | Typical Pyramid Position | Examples |
|----------|-------------|-------------------------|----------|
| `citrus` | Bright, zesty citrus fruits and their derivatives | Top | Bergamot, lemon, grapefruit, orange, lime, yuzu |
| `floral` | Flower-derived notes | Middle | Rose, jasmine, ylang ylang, tuberose, iris, neroli |
| `woody` | Wood, bark, and root-derived notes | Base | Sandalwood, cedar, vetiver, oud, patchouli |
| `oriental` | Warm, exotic, resinous materials | Base | Amber, incense, benzoin, labdanum |
| `fresh` | Clean, airy, transparent notes | Top/Middle | Hedione, dihydromyrcenol, aldehydes |
| `aromatic` | Herbaceous, camphoraceous, lavender family | Middle | Lavender, rosemary, sage, thyme, basil |
| `musk` | Skin-like, clean, animalic musks | Base | Galaxolide, cashmeran, ethylene brassylate, muscone |
| `amber` | Warm, resinous, ambergris-like notes | Base | Ambroxan, labdanum, cetalox |
| `green` | Vegetal, leafy, grassy notes | Top | Galbanum, violet leaf, cis-3-hexenol |
| `fruity` | Non-citrus fruit notes | Middle | Peach, plum, raspberry, apple, pear, fig |
| `spicy` | Pungent, aromatic spices | Top/Middle | Black pepper, cardamom, cinnamon, saffron, ginger |
| `gourmand` | Edible, sweet, food-like notes | Middle/Base | Vanilla, chocolate, coffee, caramel, honey |
| `aquatic` | Marine, ozonic, water-like notes | Top | Calone, marine accord, sea salt |
| `leather` | Animal hide, suede, tanned leather | Base | Birch tar, isobutyl quinoline, suede accord |
| `animalic` | Animal-derived or animal-like notes | Base | Civet, castoreum, indole, ambergris |
| `balsamic` | Sweet, resinous balsams | Base | Benzoin, styrax, Peru balsam, tolu balsam |
| `powdery` | Soft, velvety, cosmetic-like notes | Base | Heliotropin, iris, coumarin, violet |
| `earthy` | Soil, moss, mushroom-like notes | Base | Oakmoss, patchouli earth facet, vetiver earth facet |
| `smoky` | Burnt, charred, incense-like notes | Base | Frankincense, birch tar, cade, guaiac |
| `herbal` | Herbal teas, infusions, dried herbs | Middle | White tea, chamomile, rooibos, mate |

### Category Selection Guidelines

When assigning a category to an ingredient, use the **primary olfactory character** of the ingredient. Many ingredients have facets that span multiple categories. For example:

- **Patchouli** is categorized as `woody` even though it has earthy and green facets
- **Frankincense** is categorized as `smoky` even though it has citrus and balsamic facets
- **Ylang ylang** is categorized as `floral` even though it has fruity and spicy facets
- **Tonka bean** is categorized as `gourmand` even though it has powdery and tobacco facets

If an ingredient is genuinely ambiguous, choose the category that best represents its function in the specific formula.

---

## Note Types Explained

### Top Notes

**Enum value**: `top`
**Also known as**: Head notes, opening notes
**Duration**: 5-30 minutes
**Volatility**: High
**Typical percentage**: 15-25% of formula weight

Top notes are the first impression of a fragrance. They are the most volatile ingredients, meaning they evaporate quickly and are perceived immediately upon application. Top notes should be bright, attention-getting, and representative of the overall scent direction.

Common top note families: citrus, light green notes, certain spices (pepper, cardamom), aldehydes, aquatic notes.

### Middle Notes (Heart Notes)

**Enum value**: `middle`
**Also known as**: Heart notes, body notes, core notes
**Duration**: 30 minutes to 4 hours
**Volatility**: Medium
**Typical percentage**: 30-40% of formula weight

Middle notes form the core identity of the fragrance. They emerge as the top notes begin to fade and define what the wearer and those around them primarily smell. Heart notes should be well-balanced, pleasant, and complex enough to sustain interest over their extended duration.

Common heart note families: florals, aromatic herbs, medium-weight spices, fruity notes, some lighter woods.

### Base Notes

**Enum value**: `base`
**Also known as**: Dry-down notes, foundation notes, bottom notes
**Duration**: 4-24+ hours
**Volatility**: Low
**Typical percentage**: 35-50% of formula weight

Base notes provide the foundation, depth, and longevity of a fragrance. They are the least volatile ingredients and become increasingly prominent as the heart notes fade. Base notes should anchor the composition, provide a satisfying conclusion, and create the lasting impression.

Common base note families: woods, musks, ambers, balsams, resins, vanilla, animalics, leather.

### Modifiers

**Enum value**: `modifier`
**Also known as**: Functional ingredients, enhancers, bridges
**Duration**: Variable
**Volatility**: Variable
**Typical percentage**: 1-10% of formula weight

Modifiers are ingredients that do not fit neatly into the top/middle/base pyramid. They serve functional roles:

- **Enhancers**: Ingredients that amplify or improve other notes (e.g., damascenone enhances rose, indole adds depth to white florals)
- **Bridges**: Ingredients that connect disparate scent families (e.g., hedione bridges citrus and floral, coumarin bridges herbal and powdery)
- **Fixatives**: Ingredients that slow evaporation and extend longevity (e.g., benzyl benzoate, benzyl salicylate)
- **Texture modifiers**: Ingredients that change the perceived texture (e.g., methyl laitone adds creaminess, ethyl maltol adds sweetness)
- **Trace enhancers**: Extremely potent ingredients used at sub-1% levels for specific effects (e.g., indole, skatole, damascenone)

---

## Evolution Model

The OSC evolution model describes how a fragrance changes over time from application to final fade. This model is critical for visualization and for helping users understand that a fragrance is not a static smell but a dynamic experience.

### The Three Phases

#### Opening (First Impression)

The opening phase begins at the moment of application and typically lasts 5-30 minutes. During this phase, top notes dominate. The opening is the fragrance's first impression and is disproportionately important in purchase decisions, even though it represents only a fraction of the fragrance's total lifespan.

The `duration_minutes` for the opening phase is typically 10-30.

#### Heart (Core Character)

The heart phase begins as top notes fade and middle notes assert themselves. It typically lasts 1-4 hours. This is the phase during which most people will experience the fragrance on the wearer. It represents the true character of the composition.

The `duration_minutes` for the heart phase is typically 60-240.

#### Drydown (Final Impression)

The drydown phase begins as heart notes fade and base notes become dominant. It can last 4-24+ hours depending on the concentration and ingredient selection. The drydown is the lasting impression, the scent that lingers on clothing and skin at the end of the day.

The `duration_minutes` for the drydown phase is typically 120-720.

### Timeline Visualization

The evolution data enables timeline visualizations that show:

1. Which ingredients are prominent at each point in time
2. How the overall character of the scent shifts
3. How intensity and sillage change over the fragrance's lifespan
4. When transitions between phases occur

### Total Longevity

The `total_longevity_hours` field provides an estimate of how long the fragrance remains perceptible. This is influenced by:

- Concentration category (EDC: 2-4 hours, EDT: 4-7 hours, EDP: 6-10 hours, Parfum: 8-24 hours)
- Ingredient volatility distribution
- Fixative presence and percentage
- Skin chemistry (varies by individual; OSC provides an average estimate)

---

## Safety and IFRA Compliance

### What is IFRA

The International Fragrance Association (IFRA) publishes safety standards that restrict the usage of certain fragrance materials in consumer products. These standards are based on toxicological and dermatological research conducted by the Research Institute for Fragrance Materials (RIFM).

IFRA standards are not legally binding in most jurisdictions but are widely adopted by the industry and increasingly referenced by regulators.

### IFRA Product Categories

IFRA defines 11 product categories with different maximum usage levels for restricted materials. The categories, from most restrictive to least:

| Category | Description | Examples |
|----------|-------------|---------|
| 1 | Products applied to the lips | Lip balm, lipstick |
| 2 | Products applied to axillae | Deodorant, antiperspirant |
| 3 | Products applied to face/body with sun exposure | Sunscreen, face cream |
| 4 | Fine fragrance | Perfume, eau de toilette |
| 5A | Body lotion not rinsed off | Body lotion, body oil |
| 5B | Face products not rinsed off | Face cream, eye cream |
| 5C | Hand products | Hand cream, hand sanitizer |
| 5D | Baby products | Baby lotion, diaper cream |
| 6 | Oral hygiene products | Mouthwash, toothpaste |
| 7A | Rinse-off hair products | Shampoo, conditioner |
| 7B | Leave-on hair products | Hair spray, styling gel |
| 8 | Intimate hygiene products | Feminine wash |
| 9 | Rinse-off body products | Shower gel, bath salts |
| 10A | Household products with skin contact | Dish soap, laundry detergent |
| 10B | Household products without skin contact | Air freshener, floor cleaner |
| 11A | Candles | Scented candles |
| 11B | Reed diffusers | Reed diffusers, potpourri |

OSC defaults to Category 4 (fine fragrance) unless otherwise specified.

### EU Allergen Declaration

The EU Cosmetics Regulation requires declaration of 26 specific allergens when present above certain thresholds:

- **Leave-on products**: Declaration required above 0.001% (10 ppm)
- **Rinse-off products**: Declaration required above 0.01% (100 ppm)

The OSC safety object tracks allergens and their concentrations, and flags whether declaration is required.

### How OSC Handles Safety

The `safety` object in an OSC document provides:

1. **IFRA compliance flag**: A boolean indicating overall compliance
2. **IFRA version**: Which version of the IFRA standard was used for validation
3. **IFRA category**: Which product category the formula is intended for
4. **Allergen list**: All allergens present with their concentrations and declaration status
5. **Restricted ingredients**: Any IFRA-restricted ingredients with their limits and actual usage levels
6. **Phototoxicity flag**: Whether the formula contains phototoxic ingredients at relevant levels
7. **Warnings**: Human-readable safety warnings

Validators should check that:
- No restricted ingredient exceeds its IFRA limit for the specified category
- All declarable allergens are listed
- The `ifra_compliant` flag accurately reflects the formula's compliance status

---

## Hardware Integration

### Overview

The OSC hardware section enables physical dispensing of fragrance formulas via compatible hardware devices. This bridges the gap between digital formula creation and physical scent production.

### Device Profiles

The `device_profile` field identifies the target hardware. Known profiles include:

| Profile | Description | Channels | Volume Range |
|---------|-------------|----------|-------------|
| `ps-dispenser-v1` | Prompt & Smell 8-channel dispenser | 8 | 0.1-50 ml |
| `custom-8ch` | Generic 8-channel micropump | 8 | 0.01-100 ml |
| `custom-16ch` | Generic 16-channel micropump | 16 | 0.01-100 ml |
| `custom-32ch` | Generic 32-channel micropump | 32 | 0.01-100 ml |

Third-party hardware manufacturers can register their own device profiles.

### Channel Mappings

Each channel mapping connects a formula ingredient to a physical pump channel:

```json
{
  "ingredient": "Bergamot",
  "channel": 1,
  "volume_ml": 2.4,
  "flow_rate": 0.5,
  "dispense_order": 1,
  "pre_stir": false
}
```

The `volume_ml` is calculated from the ingredient's percentage and the `total_volume_ml`:

```
volume_ml = (percentage / 100) * total_volume_ml
```

### Dispensing Protocol

1. The controller reads the OSC file and extracts hardware configuration
2. Channel mappings are sorted by `dispense_order` (if specified)
3. Each ingredient is dispensed in order at the specified `flow_rate`
4. After all ingredients are dispensed, the blend is mixed for `mix_duration_seconds`
5. The controller reports completion status

### Safety Considerations

Hardware controllers must implement:

- Maximum volume limits per dispense operation
- Ingredient compatibility checks (some ingredients react when combined)
- Cartridge level monitoring to prevent dry pumping
- Emergency stop capability
- Calibration verification before dispensing

---

## Versioning and Compatibility

### Current Version

The current version of the OSC specification is **1.0**.

### Version Format

The `osc_version` field uses a `major.minor` format:

- **Major version** changes indicate breaking changes (new required fields, removed fields, structural changes)
- **Minor version** changes indicate backward-compatible additions (new optional fields, new enum values)

### Backward Compatibility

Parsers should follow these rules:

1. **Ignore unknown fields**: If a parser encounters a field it does not recognize, it should ignore it rather than fail. This allows newer documents to be read by older parsers.
2. **Optional fields have defaults**: All optional fields have sensible defaults. A parser should not fail if an optional field is missing.
3. **Enum extensibility**: New enum values may be added in minor versions. Parsers should handle unknown enum values gracefully (e.g., treat unknown categories as "other" or log a warning).

### Migration Guide

When a new major version of OSC is released, a migration guide will be provided that documents:

- All breaking changes
- How to convert v(N) documents to v(N+1)
- A reference implementation of the migration tool

### Schema Validation

The canonical JSON Schema for each version of OSC is published at:

```
https://promptandsmell.com/schemas/osc/v{version}/osc-schema.json
```

For version 1.0:

```
https://promptandsmell.com/schemas/osc/v1.0/osc-schema.json
```

### Changelog

#### v1.0 (2026-02-03)

- Initial release of the OSC specification
- Core schema: metadata, formula, accords, evolution, safety, hardware
- 20 ingredient categories
- 4 note types (top, middle, base, modifier)
- IFRA safety model
- Hardware dispensing support

---

*Open Scent Code is an open specification maintained by the Prompt & Smell project.*
*Contributions, feedback, and implementations are welcome.*
