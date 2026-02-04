import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Pass through all requests -- authentication is not required for this demo
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
