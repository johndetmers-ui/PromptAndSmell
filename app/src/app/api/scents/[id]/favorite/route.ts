// ---------------------------------------------------------------------------
// POST /api/scents/[id]/favorite
// ---------------------------------------------------------------------------
// Toggles a favorite on the specified scent (returns 401 in demo -- auth required).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    {
      error: "Authentication required",
      message: "Sign in to favorite scents.",
    },
    { status: 401 }
  );
}
