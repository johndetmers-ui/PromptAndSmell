import { NextRequest, NextResponse } from "next/server";
import { communityScents } from "@/lib/mock-data";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const scent = communityScents.find((s) => s.id === id);

  if (!scent) {
    return NextResponse.json(
      { error: "Not found", message: "Scent not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ scent });
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Not implemented in demo mode." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Not implemented in demo mode." },
    { status: 501 }
  );
}
