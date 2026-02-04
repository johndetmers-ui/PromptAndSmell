import { NextRequest, NextResponse } from "next/server";
import { communityScents } from "@/lib/mock-data";
import { generateScentId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perfumeName } = body;

    if (!perfumeName || typeof perfumeName !== "string" || perfumeName.trim().length === 0) {
      return NextResponse.json(
        { error: "A non-empty perfumeName string is required." },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

    // Pick a random formula as mock clone result
    const base =
      communityScents[Math.floor(Math.random() * communityScents.length)];

    const id = generateScentId();

    const formula = {
      ...base,
      id,
      name: `${perfumeName.trim()} (Approximation)`,
      description: `An educational approximation inspired by "${perfumeName.trim()}"`,
      prompt: perfumeName.trim(),
      creator: "You",
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      formula,
      originalPerfume: perfumeName.trim(),
      disclaimer: `This formula is an approximation of "${perfumeName.trim()}" based on publicly available information. It is not a reverse-engineered copy of the original proprietary formula.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to clone perfume." },
      { status: 500 }
    );
  }
}
