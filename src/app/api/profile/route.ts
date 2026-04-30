import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { profileCookieKey } from "@/lib/profile/sessionProfile";

const profileSchema = z.object({
  profileKey: z.string().min(2).max(24)
});

export async function GET(request: Request): Promise<Response> {
  void request;
  return NextResponse.json({ profileKey: cookies().get(profileCookieKey)?.value ?? "guest" });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile key" }, { status: 400 });
  }

  const response = NextResponse.json({ profileKey: parsed.data.profileKey });
  response.cookies.set(profileCookieKey, parsed.data.profileKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
