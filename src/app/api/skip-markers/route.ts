import { NextResponse } from "next/server";
import { z } from "zod";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const payloadSchema = z.object({
  titleId: titleIdSchema,
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
  kind: z.enum(["intro", "recap", "credits"]).default("intro"),
  endSeconds: z.number().int().nonnegative().max(60 * 60 * 4)
});

const querySchema = z.object({
  titleId: titleIdSchema,
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
  kind: z.enum(["intro", "recap", "credits"]).optional()
});

export async function GET(request: Request): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    titleId: searchParams.get("titleId") ?? "",
    season: searchParams.get("season") ? Number(searchParams.get("season")) : undefined,
    episode: searchParams.get("episode") ? Number(searchParams.get("episode")) : undefined,
    kind: searchParams.get("kind") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();
  const markers = await prisma.skipMarker.findMany({
    where: {
      profileKey,
      titleId: parsed.data.titleId,
      season: parsed.data.season ?? null,
      episode: parsed.data.episode ?? null,
      ...(parsed.data.kind ? { kind: parsed.data.kind } : {})
    }
  });
  return NextResponse.json({ markers });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();
  const season = parsed.data.season ?? null;
  const episode = parsed.data.episode ?? null;

  try {
    const existing = await prisma.skipMarker.findFirst({
      where: {
        profileKey,
        titleId: parsed.data.titleId,
        season,
        episode,
        kind: parsed.data.kind
      }
    });

    const marker = existing
      ? await prisma.skipMarker.update({
          where: { id: existing.id },
          data: { endSeconds: parsed.data.endSeconds }
        })
      : await prisma.skipMarker.create({
          data: {
            profileKey,
            titleId: parsed.data.titleId,
            season,
            episode,
            kind: parsed.data.kind,
            endSeconds: parsed.data.endSeconds
          }
        });

    return NextResponse.json({ marker });
  } catch {
    return NextResponse.json(
      { error: "Unable to save skip marker" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    titleId: searchParams.get("titleId") ?? "",
    season: searchParams.get("season") ? Number(searchParams.get("season")) : undefined,
    episode: searchParams.get("episode") ? Number(searchParams.get("episode")) : undefined,
    kind: searchParams.get("kind") ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const profileKey = getProfileKeyFromCookie();
  await prisma.skipMarker.deleteMany({
    where: {
      profileKey,
      titleId: parsed.data.titleId,
      season: parsed.data.season ?? null,
      episode: parsed.data.episode ?? null,
      ...(parsed.data.kind ? { kind: parsed.data.kind } : {})
    }
  });
  return NextResponse.json({ removed: true });
}
