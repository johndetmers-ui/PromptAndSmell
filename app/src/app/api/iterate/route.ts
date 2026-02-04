import { NextRequest, NextResponse } from "next/server";
import { communityScents } from "@/lib/mock-data";
import { generateScentId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY not configured", demo: true },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { modification, current_formula } = body;

    if (!modification || typeof modification !== "string" || modification.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty modification string is required." },
        { status: 400 }
      );
    }

    if (!current_formula || !current_formula.ingredients) {
      return NextResponse.json(
        { error: "A valid current_formula with ingredients is required." },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 500));

    // Randomly modify the formula for the demo
    const base =
      communityScents[Math.floor(Math.random() * communityScents.length)];

    const mixedIngredients = [
      ...current_formula.ingredients.slice(0, 5),
      ...base.ingredients.slice(0, 5),
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8 + Math.floor(Math.random() * 4));

    // Deduplicate by name
    const seen = new Set<string>();
    const uniqueIngredients = mixedIngredients.filter((i) => {
      if (seen.has(i.name)) return false;
      seen.add(i.name);
      return true;
    });

    // Normalize percentages to sum to exactly 100
    const rawTotal = uniqueIngredients.reduce((s: number, i: { percentage: number }) => s + i.percentage, 0);
    const normalizedIngredients = uniqueIngredients.map((ing: any, idx: number) => {
      if (idx === uniqueIngredients.length - 1) {
        const usedSoFar = uniqueIngredients
          .slice(0, -1)
          .reduce(
            (s: number, i: { percentage: number }) =>
              s + Math.round((i.percentage / rawTotal) * 1000) / 10,
            0
          );
        return {
          ...ing,
          percentage: Math.round((100 - usedSoFar) * 10) / 10,
        };
      }
      return {
        ...ing,
        percentage: Math.round((ing.percentage / rawTotal) * 1000) / 10,
      };
    });

    const oldNames = new Set(current_formula.ingredients.map((i: any) => i.name));
    const newNames = new Set(normalizedIngredients.map((i: any) => i.name));

    const added = normalizedIngredients
      .filter((i: any) => !oldNames.has(i.name))
      .map((i: any) => i.name);
    const removed = current_formula.ingredients
      .filter((i: any) => !newNames.has(i.name))
      .map((i: any) => i.name);

    const id = generateScentId();

    const formula = {
      ...current_formula,
      id,
      created_at: new Date().toISOString(),
      ingredients: normalizedIngredients,
      evolution: {
        opening: normalizedIngredients
          .filter((i: any) => i.note_type === "top")
          .slice(0, 3)
          .map((i: any) => i.name),
        heart: normalizedIngredients
          .filter((i: any) => i.note_type === "middle")
          .slice(0, 3)
          .map((i: any) => i.name),
        drydown: normalizedIngredients
          .filter((i: any) => i.note_type === "base")
          .slice(0, 4)
          .map((i: any) => i.name),
      },
    };

    return NextResponse.json({
      formula,
      changes: {
        added,
        removed,
        adjusted: [],
      },
      suggestions: [
        "The modification has been applied",
        "Consider further adjusting the base notes for balance",
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to iterate on scent formula." },
      { status: 500 }
    );
  }
}
