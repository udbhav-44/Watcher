import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";

const profileSchema = z.object({
  key: z.string().min(2).max(24),
  displayName: z.string().min(1).max(36),
  avatarColor: z.string().optional()
});

export async function GET(): Promise<Response> {
  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const profiles = await prisma.userProfile.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ profiles });
  } catch {
    return NextResponse.json({ error: "Unable to load profiles" }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const profile = await prisma.userProfile.upsert({
      where: { key: parsed.data.key },
      update: { displayName: parsed.data.displayName, avatarColor: parsed.data.avatarColor },
      create: parsed.data
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Unable to save profile" }, { status: 503 });
  }
}
