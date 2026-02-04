import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { communityScents } from "@/lib/mock-data";
import { generateScentId } from "@/lib/utils";
import {
  INGREDIENT_DATABASE,
  SAFETY_CONSTRAINTS,
} from "@/lib/system-prompts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function buildMockResponse() {
  const base =
    communityScents[Math.floor(Math.random() * communityScents.length)];

  const shuffledIngredients = [...base.ingredients]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8 + Math.floor(Math.random() * 4));

  const rawTotal = shuffledIngredients.reduce((s, i) => s + i.percentage, 0);
  const normalizedIngredients = shuffledIngredients.map((ing, idx) => {
    if (idx === shuffledIngredients.length - 1) {
      const usedSoFar = shuffledIngredients
        .slice(0, -1)
        .reduce(
          (s, i) => s + Math.round((i.percentage / rawTotal) * 1000) / 10,
          0
        );
      return { ...ing, percentage: Math.round((100 - usedSoFar) * 10) / 10 };
    }
    return {
      ...ing,
      percentage: Math.round((ing.percentage / rawTotal) * 1000) / 10,
    };
  });

  const id = generateScentId();

  const formula = {
    id,
    version: "1.0.0",
    name: base.name,
    description: base.description,
    prompt: "(generated from image)",
    creator: "You",
    created_at: new Date().toISOString(),
    ingredients: normalizedIngredients,
    intensity: base.intensity,
    longevity_hours: base.longevity_hours,
    sillage: base.sillage,
    mood: base.mood,
    season: base.season,
    tags: base.tags,
    evolution: {
      opening: normalizedIngredients
        .filter((i) => i.note_type === "top")
        .slice(0, 3)
        .map((i) => i.name),
      heart: normalizedIngredients
        .filter((i) => i.note_type === "middle")
        .slice(0, 3)
        .map((i) => i.name),
      drydown: normalizedIngredients
        .filter((i) => i.note_type === "base")
        .slice(0, 4)
        .map((i) => i.name),
    },
    accords: base.accords,
    safety: base.safety,
  };

  return {
    scene_description: base.description,
    scent_narrative: `The air would carry notes of ${normalizedIngredients
      .slice(0, 4)
      .map((i) => i.name.toLowerCase())
      .join(", ")}, blending into a ${base.mood
      .map((m) => m.toLowerCase())
      .join(", ")} atmosphere.`,
    formula,
  };
}

// ---------------------------------------------------------------------------
// System prompt for image-to-scent
// ---------------------------------------------------------------------------

function buildImageSystemPrompt(optionalTextPrompt?: string): string {
  let prompt = `You are a master perfumer AI with decades of experience in fragrance creation.
You have been given a photograph. Your task is to:

1. DESCRIBE what you see in the image in 2-3 vivid sentences (the scene_description).
2. ANALYZE what the scene would smell like. Consider the environment, objects, atmosphere, season, time of day, and any olfactory cues you can infer. Write a 2-3 sentence olfactory interpretation (the scent_narrative).
3. GENERATE a complete fragrance formula in OSC format that captures those scents.

${optionalTextPrompt ? `ADDITIONAL USER GUIDANCE: "${optionalTextPrompt}"\nUse this to focus your analysis on specific aspects of the image.\n` : ""}
INGREDIENT DATABASE:
${INGREDIENT_DATABASE}

SAFETY CONSTRAINTS:
${SAFETY_CONSTRAINTS}

RULES FOR FORMULA GENERATION:

1. STRUCTURE: Every formula must follow the note pyramid:
   - Top notes (15-25% of concentrate): first impression, lasts 15-30 minutes
   - Heart/Middle notes (30-40% of concentrate): the core character, lasts 2-4 hours
   - Base notes (35-50% of concentrate): foundation, lasts 4-24 hours

2. BALANCE: All ingredient percentages must sum to exactly 100%.

3. SAFETY: Never exceed IFRA limits for any restricted material.

4. QUALITY: Aim for 8-15 ingredients, harmony, and uniqueness.

OUTPUT FORMAT:
Respond with ONLY valid JSON. No text before or after. Use this exact structure:

{
  "scene_description": "A vivid 2-3 sentence description of what you see in the image",
  "scent_narrative": "A 2-3 sentence olfactory interpretation of what the scene would smell like",
  "formula": {
    "name": "Creative name for the fragrance inspired by the image",
    "description": "A poetic 2-3 sentence description of the scent experience",
    "prompt": "image-to-scent",
    "ingredients": [
      {
        "name": "Ingredient Name",
        "cas_number": "CAS number or N/A-code",
        "category": "category",
        "note_type": "top|middle|base",
        "percentage": 10.0,
        "intensity": 7
      }
    ],
    "evolution": {
      "opening": ["top note names"],
      "heart": ["middle note names"],
      "drydown": ["base note names"]
    },
    "mood": ["Mood1", "Mood2", "Mood3"],
    "season": ["Season1", "Season2"],
    "intensity": 6,
    "longevity_hours": 8,
    "sillage": "moderate",
    "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
    "accords": [
      { "name": "Accord Name", "strength": 75, "ingredients": ["Ingredient1", "Ingredient2"] }
    ],
    "safety": {
      "ifra_compliance": true,
      "allergens": ["Allergen1"],
      "max_skin_concentration": 15,
      "notes": "Safety notes"
    }
  }
}

CRITICAL: ingredient percentages must sum to exactly 100.0. The category field must be one of: citrus, floral, woody, fresh, oriental, musk, green, fruity, spicy, aquatic, gourmand, leather, aromatic, amber, powdery, earthy, smoky, herbal, animalic, balsamic. The note_type must be one of: top, middle, base. The sillage must be one of: intimate, moderate, strong, enormous. Double-check your math.`;

  return prompt;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo mode: return mock data
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const mock = buildMockResponse();
      return NextResponse.json({
        success: false,
        error: "ANTHROPIC_API_KEY not configured",
        demo: true,
        scene_description: mock.scene_description,
        scent_narrative: mock.scent_narrative,
        formula: mock.formula,
      });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const textPrompt = formData.get("prompt") as string | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${imageFile.type}. Accepted types: JPEG, PNG, WebP.`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (${(imageFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 10 MB.`,
        },
        { status: 400 }
      );
    }

    // Convert to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Map MIME type to the format Claude expects
    const mediaType = imageFile.type as
      | "image/jpeg"
      | "image/png"
      | "image/webp";

    // Build system prompt
    const systemPrompt = buildImageSystemPrompt(
      textPrompt && textPrompt.trim().length > 0 ? textPrompt.trim() : undefined
    );

    // Call Claude API with vision
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: textPrompt && textPrompt.trim().length > 0
                ? `Analyze this image and generate a scent formula. ${textPrompt.trim()}`
                : "Analyze this image and generate a scent formula that captures what this scene would smell like.",
            },
          ],
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude.");
    }

    // Parse JSON from response -- handle potential markdown code fences
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Build the full formula object with required fields
    const id = generateScentId();
    const formula = {
      id,
      version: "1.0.0",
      name: parsed.formula.name || "Image Scent",
      description: parsed.formula.description || parsed.scene_description,
      prompt: textPrompt?.trim() || "(generated from image)",
      creator: "You",
      created_at: new Date().toISOString(),
      ingredients: parsed.formula.ingredients || [],
      evolution: parsed.formula.evolution || { opening: [], heart: [], drydown: [] },
      accords: parsed.formula.accords || [],
      mood: parsed.formula.mood || [],
      season: parsed.formula.season || [],
      intensity: parsed.formula.intensity || 5,
      longevity_hours: parsed.formula.longevity_hours || 8,
      sillage: parsed.formula.sillage || "moderate",
      safety: parsed.formula.safety || {
        ifra_compliance: true,
        allergens: [],
        max_skin_concentration: 15,
        notes: "AI-generated formula",
      },
      tags: parsed.formula.tags || [],
    };

    return NextResponse.json({
      success: true,
      scene_description: parsed.scene_description,
      scent_narrative: parsed.scent_narrative,
      formula,
    });
  } catch (error) {
    console.error("Image-to-scent error:", error);

    // If JSON parsing failed, return a clear error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse AI response. Please try again with a different image.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze image and generate scent formula.",
      },
      { status: 500 }
    );
  }
}
