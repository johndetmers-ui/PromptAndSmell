import { NextRequest, NextResponse } from "next/server";
import { communityScents } from "@/lib/mock-data";
import { generateScentId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, preferences } = body;

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

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

    // Pick a random base formula and modify it for the demo
    const base =
      communityScents[Math.floor(Math.random() * communityScents.length)];

    const shuffledIngredients = [...base.ingredients]
      .sort(() => Math.random() - 0.5)
      .slice(0, 8 + Math.floor(Math.random() * 4));

    // Normalize percentages to sum to exactly 100
    const rawTotal = shuffledIngredients.reduce((s, i) => s + i.percentage, 0);
    const normalizedIngredients = shuffledIngredients.map((ing, idx) => {
      if (idx === shuffledIngredients.length - 1) {
        const usedSoFar = shuffledIngredients
          .slice(0, -1)
          .reduce(
            (s, i) => s + Math.round((i.percentage / rawTotal) * 1000) / 10,
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

    const id = generateScentId();
    const scentName = prompt
      .trim()
      .split(" ")
      .slice(0, 3)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const formula = {
      id,
      version: "1.0.0",
      name: scentName,
      description: `A scent inspired by: "${prompt.trim()}"`,
      prompt: prompt.trim(),
      creator: "You",
      created_at: new Date().toISOString(),
      ingredients: normalizedIngredients,
      intensity: preferences?.intensity || base.intensity,
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

    return NextResponse.json({
      formula,
      suggestions: [
        "Try adding a smoky note for more depth",
        "Consider increasing the floral component",
        "This would pair well with a vanilla base",
      ],
      processing_time_ms: Math.floor(Math.random() * 800) + 400,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate scent formula." },
      { status: 500 }
    );
  }
}
