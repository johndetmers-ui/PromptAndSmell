// ---------------------------------------------------------------------------
// POST /api/scents/[id]/like
// ---------------------------------------------------------------------------
// Toggles a like on the specified scent (returns 401 in demo -- auth required).
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    {
      error: "Authentication required",
      message: "Sign in to like scents.",
    },
    { status: 401 }
  );
}
