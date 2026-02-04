import { NextRequest, NextResponse } from "next/server";
import { communityScents, scentCards } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const search = params.get("search") || "";
    const mood = params.get("mood") || "";
    const season = params.get("season") || "";

    let results = [...scentCards];

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (mood) {
      results = results.filter((s) => s.mood.includes(mood));
    }

    if (season) {
      results = results.filter((s) => s.season.includes(season));
    }

    return NextResponse.json({
      scents: results,
      count: results.length,
      page: 1,
      page_size: results.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch scents." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Authentication required", message: "Sign in to create scents." },
    { status: 401 }
  );
}
