import { NextResponse } from "next/server";
import { z } from "zod";

import {
  GATE_COOKIE,
  GATE_COOKIE_MAX_AGE,
  expectedGateToken,
  gateEnabled,
  verifyGatePassword
} from "@/lib/security/gate";

const schema = z.object({ password: z.string().min(1).max(256) });

export async function POST(request: Request): Promise<Response> {
  if (!gateEnabled()) {
    return NextResponse.json({ ok: true, gateDisabled: true });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyGatePassword(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, expectedGateToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE
  });
  return response;
}
