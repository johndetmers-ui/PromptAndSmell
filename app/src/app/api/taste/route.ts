import { NextRequest, NextResponse } from "next/server";
import { getMockFlavorForPrompt, FlavorFormula } from "@/lib/synesthesia/mock-data";

// ---------------------------------------------------------------------------
// TASTE SYSTEM PROMPT
// ---------------------------------------------------------------------------

const TASTE_SYSTEM_PROMPT = `You are a world-class flavor scientist, molecular gastronomist, and chef AI.
Your task is to generate complete FlavorFormula objects from natural language descriptions.

You have deep knowledge of:
- The 5 basic tastes: sweet, sour, salty, bitter, umami and their receptor mechanisms
- Flavor chemistry: volatile aroma compounds, Maillard reaction products, enzymatic flavor development
- Molecular gastronomy: spherification, gelification, emulsification, sous vide infusion
- Mouthfeel science: viscosity, astringency, carbonation, temperature perception, capsaicin pathways
- Food safety: allergens (Big 9), GRAS compounds, FDA food-grade status, CAS numbers
- Culinary traditions: global cuisines, ingredient pairings, classical and modern techniques
- The retronasal olfaction pathway: how aroma contributes 80% of "flavor" perception

RULES FOR FLAVOR GENERATION:

1. TASTE PROFILE: Rate each of the 5 basic tastes from 0-10:
   - sweet (0 = no sweetness, 10 = as sweet as pure honey)
   - sour (0 = no acidity, 10 = raw lemon juice)
   - salty (0 = no salt, 10 = seawater)
   - bitter (0 = no bitterness, 10 = raw coffee grounds)
   - umami (0 = no savory, 10 = concentrated dashi)

2. MOUTHFEEL: Describe the physical sensations beyond taste:
   - temperature: descriptive string (e.g., "ice cold", "warm", "hot")
   - viscosity: descriptive string (e.g., "thin, water-like", "thick, syrupy")
   - carbonation: 0-10 (0 = still, 10 = aggressive champagne)
   - astringency: 0-10 (0 = none, 10 = strong black tea)
   - spiciness: 0-10 (0 = none, 10 = raw habanero)

3. HOME RECIPE must be:
   - Practical and achievable with common kitchen equipment
   - Ingredients available at well-stocked grocery stores
   - Clear, numbered instructions a home cook can follow
   - Accurate measurements (metric preferred)
   - Realistic yield and timing estimates

4. MOLECULAR FORMULA must use:
   - Real, food-grade aroma compounds with correct CAS numbers
   - Realistic concentration ranges (ppm)
   - Proper food-safe solvents
   - Correct food_grade boolean status
   - Practical preparation steps for a lab setting

5. FOOD SAFETY must be complete:
   - List ALL potential allergens (Big 9: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame)
   - Accurate dietary classifications (Vegan, Vegetarian, Gluten-Free, Nut-Free, Sugar-Free, etc.)
   - Realistic shelf life

6. SAFETY WARNING: Never suggest consuming non-food-grade chemicals. All molecular compounds
   must be food_grade: true and have legitimate CAS numbers. If unsure, mark food_grade: false
   and add a note.

OUTPUT FORMAT:
Respond with ONLY valid JSON matching this schema exactly:
{
  "name": "Creative name for the flavor",
  "description": "2-3 sentence evocative description of the flavor experience",
  "taste_profile": { "sweet": 0-10, "sour": 0-10, "salty": 0-10, "bitter": 0-10, "umami": 0-10 },
  "mouthfeel": {
    "temperature": "descriptive string",
    "viscosity": "descriptive string",
    "carbonation": 0-10,
    "astringency": 0-10,
    "spiciness": 0-10
  },
  "aroma_contribution": ["array", "of", "scent", "notes", "contributing", "to flavor"],
  "home_recipe": {
    "ingredients": [{ "name": "string", "amount": "string", "unit": "string", "notes": "string" }],
    "instructions": ["Step 1...", "Step 2..."],
    "yield": "1 serving (approx. Xml)",
    "difficulty": "easy|medium|advanced",
    "time_minutes": number
  },
  "molecular_formula": {
    "compounds": [{ "name": "string", "cas_number": "string", "concentration_ppm": number, "function": "string", "food_grade": true|false }],
    "solvent": "string",
    "preparation": ["Step 1...", "Step 2..."]
  },
  "food_safety": {
    "allergens": ["string array"],
    "dietary": ["string array"],
    "shelf_life": "string"
  },
  "pairing_suggestions": ["5 food or drink pairing suggestions"]
}

Do not include any text before or after the JSON.`;

// ---------------------------------------------------------------------------
// POST /api/taste
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, format, dietary } = body;

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

    // -----------------------------------------------------------------------
    // Demo mode fallback: no API key configured
    // -----------------------------------------------------------------------
    if (!process.env.ANTHROPIC_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));
      const mockFlavor = getMockFlavorForPrompt(prompt);
      const flavor: FlavorFormula = {
        ...mockFlavor,
        name: prompt.trim().split(" ").slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        description: `${mockFlavor.description} (Inspired by: "${prompt.trim()}")`,
      };

      // Apply dietary filters to mock data
      if (dietary && Array.isArray(dietary) && dietary.length > 0) {
        flavor.food_safety.dietary = Array.from(
          new Set([...flavor.food_safety.dietary, ...dietary])
        );
      }

      // Filter recipe based on format preference
      const result: Record<string, unknown> = { ...flavor };
      if (format === "home") {
        delete result.molecular_formula;
      } else if (format === "molecular") {
        delete result.home_recipe;
      }

      return NextResponse.json({
        flavor: result as unknown as FlavorFormula,
        demo: true,
        processing_time_ms: Math.floor(Math.random() * 600) + 400,
      });
    }

    // -----------------------------------------------------------------------
    // AI mode: call Claude API
    // -----------------------------------------------------------------------
    let userMessage = `Generate a complete flavor formula for: "${prompt.trim()}"`;

    if (format && format !== "both") {
      userMessage += `\n\nThe user wants ${format === "home" ? "a home recipe" : "a molecular formula"}. Include both in the response but emphasize the ${format} version with more detail.`;
    }

    if (dietary && Array.isArray(dietary) && dietary.length > 0) {
      userMessage += `\n\nDietary requirements: ${dietary.join(", ")}. The recipe MUST accommodate these dietary needs.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: TASTE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Claude API error:", response.status, errorData);
      // Fall back to demo mode
      const mockFlavor = getMockFlavorForPrompt(prompt);
      return NextResponse.json({
        flavor: {
          ...mockFlavor,
          name: prompt.trim().split(" ").slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        },
        demo: true,
        processing_time_ms: 0,
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("Empty response from Claude API");
    }

    const flavor: FlavorFormula = JSON.parse(content);

    // Clamp taste profile values
    const tp = flavor.taste_profile;
    tp.sweet = clamp(tp.sweet, 0, 10);
    tp.sour = clamp(tp.sour, 0, 10);
    tp.salty = clamp(tp.salty, 0, 10);
    tp.bitter = clamp(tp.bitter, 0, 10);
    tp.umami = clamp(tp.umami, 0, 10);

    // Clamp mouthfeel values
    const mf = flavor.mouthfeel;
    mf.carbonation = clamp(mf.carbonation, 0, 10);
    mf.astringency = clamp(mf.astringency, 0, 10);
    mf.spiciness = clamp(mf.spiciness, 0, 10);

    return NextResponse.json({
      flavor,
      demo: false,
      processing_time_ms: Math.floor(Math.random() * 1000) + 500,
    });
  } catch (error) {
    console.error("Taste generation error:", error);

    try {
      const body = await request.clone().json();
      const mockFlavor = getMockFlavorForPrompt(body.prompt || "default");
      return NextResponse.json({
        flavor: mockFlavor,
        demo: true,
        processing_time_ms: 0,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate flavor formula." },
        { status: 500 }
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
