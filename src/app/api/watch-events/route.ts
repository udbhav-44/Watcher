import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const titleIdSchema = z.string().regex(/^(tt\d+|tmdb-\d+)$/i, "Invalid title id");

const eventSchema = z.object({
  titleId: titleIdSchema,
  secondsWatched: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  completed: z.boolean().default(false)
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey = searchParams.get("profileKey") ?? getProfileKeyFromCookie();
  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const events = await prisma.watchEvent.findMany({
      where: { profileKey },
      orderBy: { watchedAt: "desc" },
      take: 40
    });
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Unable to fetch watch events" }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const event = await prisma.watchEvent.create({ data: { ...parsed.data, profileKey } });
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Unable to record watch event" }, { status: 503 });
  }
}
