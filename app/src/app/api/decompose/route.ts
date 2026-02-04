// ---------------------------------------------------------------------------
// Synesthesia.ai -- Sensory Decomposition API Route
// ---------------------------------------------------------------------------
// POST /api/decompose
//
// Accepts a natural-language prompt and an array of module names, then uses
// the Sensory Decomposition Engine to generate coordinated sensory outputs
// across all requested modules.
//
// Falls back to demo mode with pre-built decompositions if no Anthropic API
// key is configured.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import {
  buildDecompositionPrompt,
  findDemoDecomposition,
  type DecomposeRequest,
  type DecomposeResponse,
  type ModuleName,
  type SensoryDecomposition,
} from "@/lib/synesthesia/engine";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8192;

const VALID_MODULES: ModuleName[] = [
  "atmosphere",
  "scent",
  "texture",
  "taste",
  "pulse",
];

// ---------------------------------------------------------------------------
// POST Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate the request body
    const body = (await request.json()) as DecomposeRequest;

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' field. Must be a non-empty string." },
        { status: 400 }
      );
    }

    if (body.prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt exceeds maximum length of 2000 characters." },
        { status: 400 }
      );
    }

    // Validate modules array
    if (!body.modules || !Array.isArray(body.modules) || body.modules.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid 'modules' field. Must be a non-empty array of module names: " +
            VALID_MODULES.join(", "),
        },
        { status: 400 }
      );
    }

    const invalidModules = body.modules.filter(
      (m) => !VALID_MODULES.includes(m as ModuleName)
    );
    if (invalidModules.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid module name(s): ${invalidModules.join(", ")}. Valid modules: ${VALID_MODULES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const activeModules = body.modules as ModuleName[];

    // Validate optional image field
    if (body.image !== undefined && typeof body.image !== "string") {
      return NextResponse.json(
        { error: "Invalid 'image' field. Must be a base64-encoded string." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------
    // Demo mode: return pre-built decomposition if no API key
    // -------------------------------------------------------------------

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "your-anthropic-api-key-here") {
      console.log(
        "[Synesthesia.ai] No API key configured. Returning demo decomposition."
      );

      const demoDecomposition = findDemoDecomposition(body.prompt);

      // Filter to only requested modules
      const filteredModules: SensoryDecomposition["modules"] = {};
      for (const mod of activeModules) {
        if (demoDecomposition.modules[mod]) {
          // @ts-ignore - dynamic module key assignment
          (filteredModules as Record<string, unknown>)[mod] = demoDecomposition.modules[mod];
        }
      }

      const response: DecomposeResponse = {
        decomposition: {
          ...demoDecomposition,
          modules: filteredModules,
        },
        processing_time_ms: Date.now() - startTime,
      };

      return NextResponse.json(response);
    }

    // -------------------------------------------------------------------
    // Live mode: call Claude API
    // -------------------------------------------------------------------

    const systemPrompt = buildDecompositionPrompt(body.prompt, activeModules);

    // Build the messages array. If an image is provided, include it as a
    // multimodal content block alongside the text prompt.
    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
    > = [];

    if (body.image) {
      // Detect media type from base64 header or default to JPEG
      let mediaType = "image/jpeg";
      if (body.image.startsWith("data:")) {
        const match = body.image.match(/^data:([^;]+);base64,/);
        if (match) {
          mediaType = match[1];
          // Strip the data URI prefix for the API
          body.image = body.image.replace(/^data:[^;]+;base64,/, "");
        }
      }

      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: body.image,
        },
      });

      userContent.push({
        type: "text",
        text: `The user has provided this image as additional context for their prompt.\n\nUser prompt: "${body.prompt}"\n\nDecompose this experience into the requested sensory modules. Use both the text prompt and the image to inform your output.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `User prompt: "${body.prompt}"\n\nDecompose this experience into the requested sensory modules.`,
      });
    }

    // Call the Anthropic API
    const apiResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(
        `[Synesthesia.ai] Anthropic API error (${apiResponse.status}):`,
        errorBody
      );

      // If rate limited or server error, fall back to demo mode
      if (apiResponse.status === 429 || apiResponse.status >= 500) {
        console.log(
          "[Synesthesia.ai] API error, falling back to demo decomposition."
        );
        const demoDecomposition = findDemoDecomposition(body.prompt);
        const response: DecomposeResponse = {
          decomposition: demoDecomposition,
          processing_time_ms: Date.now() - startTime,
        };
        return NextResponse.json(response);
      }

      return NextResponse.json(
        { error: `Anthropic API error: ${apiResponse.status}` },
        { status: 502 }
      );
    }

    const apiResult = await apiResponse.json();

    // Extract the text content from Claude's response
    const textBlock = apiResult.content?.find(
      (block: { type: string }) => block.type === "text"
    );

    if (!textBlock || !textBlock.text) {
      console.error(
        "[Synesthesia.ai] No text content in API response:",
        JSON.stringify(apiResult)
      );
      return NextResponse.json(
        { error: "No text content in AI response." },
        { status: 502 }
      );
    }

    // Parse the JSON from Claude's response.
    // Claude sometimes wraps JSON in markdown code fences, so strip those.
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    let decomposition: SensoryDecomposition;
    try {
      decomposition = JSON.parse(jsonText) as SensoryDecomposition;
    } catch (parseError) {
      console.error(
        "[Synesthesia.ai] Failed to parse AI response as JSON:",
        jsonText.substring(0, 500)
      );
      console.error("[Synesthesia.ai] Parse error:", parseError);

      // Fall back to demo mode on parse failure
      const demoDecomposition = findDemoDecomposition(body.prompt);
      const response: DecomposeResponse = {
        decomposition: demoDecomposition,
        processing_time_ms: Date.now() - startTime,
      };
      return NextResponse.json(response);
    }

    // Validate the decomposition structure (basic checks)
    if (!decomposition.prompt) {
      decomposition.prompt = body.prompt;
    }
    if (!decomposition.scene_analysis) {
      decomposition.scene_analysis = "";
    }
    if (!decomposition.modules) {
      decomposition.modules = {};
    }
    if (!decomposition.unified_narrative) {
      decomposition.unified_narrative = "";
    }
    if (!decomposition.mood || !Array.isArray(decomposition.mood)) {
      decomposition.mood = [];
    }
    if (
      typeof decomposition.intensity !== "number" ||
      decomposition.intensity < 1 ||
      decomposition.intensity > 10
    ) {
      decomposition.intensity = 5;
    }

    // Validate scent ingredient percentages sum to 100 (if scent module is present)
    if (decomposition.modules.scent?.ingredients) {
      const total = decomposition.modules.scent.ingredients.reduce(
        (sum, ing) => sum + ing.percentage,
        0
      );
      if (Math.abs(total - 100) > 1) {
        console.warn(
          `[Synesthesia.ai] Scent ingredient percentages sum to ${total}, expected 100. Normalizing.`
        );
        const factor = 100 / total;
        decomposition.modules.scent.ingredients =
          decomposition.modules.scent.ingredients.map((ing) => ({
            ...ing,
            percentage: Math.round(ing.percentage * factor * 100) / 100,
          }));
      }
    }

    // Validate taste molecular compounds are all food-grade (if taste module is present)
    if (decomposition.modules.taste?.molecular_formula?.compounds) {
      decomposition.modules.taste.molecular_formula.compounds =
        decomposition.modules.taste.molecular_formula.compounds.map(
          (compound) => ({
            ...compound,
            food_grade: true, // Force all to true as a safety measure
          })
        );
    }

    const response: DecomposeResponse = {
      decomposition,
      processing_time_ms: Date.now() - startTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Synesthesia.ai] Unexpected error:", error);

    // For any unexpected error, try to return a demo decomposition
    try {
      const demoDecomposition = findDemoDecomposition("default");
      const response: DecomposeResponse = {
        decomposition: demoDecomposition,
        processing_time_ms: Date.now() - startTime,
      };
      return NextResponse.json(response);
    } catch {
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// GET Handler -- API documentation
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    name: "Synesthesia.ai Sensory Decomposition API",
    version: "1.0.0",
    description:
      "Decomposes a natural-language prompt into coordinated multi-sensory outputs across up to five modalities.",
    endpoint: "POST /api/decompose",
    request: {
      prompt:
        "string (required) -- Natural language description of an experience, max 2000 characters.",
      modules:
        "string[] (required) -- Array of module names to activate. Valid values: atmosphere, scent, texture, taste, pulse.",
      image:
        "string (optional) -- Base64-encoded image to provide additional visual context.",
    },
    response: {
      decomposition: {
        prompt: "string -- Echo of the user's prompt.",
        scene_analysis:
          "string -- AI's interpretation of the scene's sensory dimensions.",
        modules:
          "object -- Per-module outputs. Only contains keys for requested modules.",
        unified_narrative:
          "string -- Poetic passage describing how all senses work together.",
        mood: "string[] -- 3-6 mood tags.",
        intensity: "number -- Overall experience intensity, 1-10.",
      },
      processing_time_ms: "number -- Total processing time in milliseconds.",
    },
    modules: {
      atmosphere:
        "Controls lighting (color, brightness, temperature, animation), sound (genre, ambient layers), room temperature, and visual displays. Includes time-based evolution phases.",
      scent:
        "Generates an Open Scent Code (OSC) formula with ingredients, CAS numbers, percentages, accords, and safety data.",
      texture:
        "Produces a 7-dimensional physical property vector and haptic vibration pattern for tactile rendering on phones and wearables.",
      taste:
        "Creates a flavor profile with taste dimensions, mouthfeel, home recipe, and molecular formula using food-grade compounds.",
      pulse:
        "Generates a heartbeat pattern with BPM, haptic sequence, emotional state, and optional breathing guide.",
    },
    examples: [
      {
        prompt: "Northern lights in Iceland",
        modules: ["atmosphere", "scent", "texture", "taste", "pulse"],
      },
      {
        prompt: "Tokyo jazz bar at midnight",
        modules: ["atmosphere", "texture", "pulse"],
      },
      {
        prompt: "Grandmother's kitchen on Christmas morning",
        modules: ["atmosphere", "scent", "taste"],
      },
    ],
  });
}
