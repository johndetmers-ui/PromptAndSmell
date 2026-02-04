// ---------------------------------------------------------------------------
// /api/scents/[id]/comments
// ---------------------------------------------------------------------------
// GET  - List all comments for a scent (returns empty array in demo).
// POST - Add a comment (returns 401 in demo -- auth required).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return NextResponse.json({ comments: [] });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    {
      error: "Authentication required",
      message: "Sign in to comment on scents.",
    },
    { status: 401 }
  );
}
