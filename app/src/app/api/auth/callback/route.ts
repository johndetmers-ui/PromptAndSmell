import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  // In the demo version, simply redirect to the home page
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
