import { NextResponse } from "next/server";
import { z } from "zod";

import {
  mediaTypeFromTitleId,
  titleIdSchema
} from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const eventSchema = z.object({
  titleId: titleIdSchema,
  secondsWatched: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  completed: z.boolean().default(false),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
  mediaType: z.enum(["movie", "tv"]).optional()
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey =
    searchParams.get("profileKey") ?? getProfileKeyFromCookie();
  const titleIdRaw = searchParams.get("titleId");

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    if (titleIdRaw) {
      const parsed = titleIdSchema.safeParse(titleIdRaw);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
      }
      const events = await prisma.watchEvent.findMany({
        where: { profileKey, titleId: parsed.data },
        orderBy: { watchedAt: "desc" },
        take: 200
      });
      return NextResponse.json({ events });
    }

    const events = await prisma.watchEvent.findMany({
      where: { profileKey },
      orderBy: { watchedAt: "desc" },
      take: 80
    });
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch watch events" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const mediaType =
    parsed.data.mediaType ?? mediaTypeFromTitleId(parsed.data.titleId);

  try {
    const event = await prisma.watchEvent.create({
      data: {
        ...parsed.data,
        profileKey,
        mediaType,
        season: parsed.data.season ?? null,
        episode: parsed.data.episode ?? null
      }
    });
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json(
      { error: "Unable to record watch event" },
      { status: 503 }
    );
  }
}
