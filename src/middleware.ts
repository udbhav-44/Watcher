import { NextResponse, type NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/rateLimit";

const GATE_COOKIE = "gate-token";

// Paths bypass the gate (healthcheck, the gate itself, static assets, manifest/icons).
// `_next/static`, `_next/image`, and `favicon.ico` are already excluded via the matcher.
const PUBLIC_PATTERNS: RegExp[] = [
  /^\/gate$/,
  /^\/api\/gate(\/|$)/,
  /^\/api\/system\/readiness$/,
  /^\/manifest\.webmanifest$/,
  /^\/icon(-|\.)/,
  /^\/apple-icon/,
  /^\/sw\.js$/,
  /^\/posters\//
];

const sha256Hex = async (input: string): Promise<string> => {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const sitePassword = process.env.SITE_PASSWORD;
  const isPublic = PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname));

  if (sitePassword && !isPublic) {
    const cookie = request.cookies.get(GATE_COOKIE)?.value;
    const expected = await sha256Hex(sitePassword);
    if (cookie !== expected) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Locked" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/gate";
      url.search = "";
      const target = pathname + (request.nextUrl.search || "");
      if (target && target !== "/") url.searchParams.set("next", target);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/")) {
    const identifier =
      request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = await checkRateLimit(identifier);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
