import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/rateLimit";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const identifier = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(identifier);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
