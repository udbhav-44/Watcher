import { NextResponse } from "next/server";
import { z } from "zod";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled } from "@/lib/db";
import {
  getWatchedEntries,
  markTitleWatched,
  unmarkTitleWatched
} from "@/lib/personalization/watched";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const payloadSchema = z.object({
  titleId: titleIdSchema,
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional()
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey =
    searchParams.get("profileKey") ?? getProfileKeyFromCookie();
  const titleIdRaw = searchParams.get("titleId");

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (titleIdRaw) {
    const parsed = titleIdSchema.safeParse(titleIdRaw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
    }
    const entries = await getWatchedEntries(profileKey);
    const match = entries.find((entry) => entry.titleId === parsed.data);
    return NextResponse.json({ watched: match ?? null });
  }

  try {
    const watched = await getWatchedEntries(profileKey);
    return NextResponse.json({
      watched: watched.map((entry) => ({
        ...entry,
        watchedAt: entry.watchedAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch watched titles" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const entry = await markTitleWatched(
      profileKey,
      parsed.data.titleId,
      "manual",
      parsed.data.season,
      parsed.data.episode
    );
    if (!entry) {
      return NextResponse.json(
        { error: "Unable to mark watched" },
        { status: 503 }
      );
    }
    return NextResponse.json({
      item: { ...entry, watchedAt: entry.watchedAt.toISOString() }
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to mark watched" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const titleIdRaw = searchParams.get("titleId") ?? "";
  const parsedTitleId = titleIdSchema.safeParse(titleIdRaw);
  if (!parsedTitleId.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    await unmarkTitleWatched(profileKey, parsedTitleId.data);
    return NextResponse.json({ removed: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to unmark watched" },
      { status: 503 }
    );
  }
}
