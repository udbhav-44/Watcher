import { NextResponse } from "next/server";
import { z } from "zod";

import {
  mediaTypeFromTitleId,
  titleIdSchema
} from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const payloadSchema = z.object({
  titleId: titleIdSchema,
  score: z.number().int().min(1).max(5),
  mediaType: z.enum(["movie", "tv"]).optional()
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const titleIdRaw = searchParams.get("titleId");
  if (!titleIdRaw) {
    return NextResponse.json({ error: "Missing titleId" }, { status: 400 });
  }
  const parsed = titleIdSchema.safeParse(titleIdRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();

  try {
    const rating = await prisma.rating.findUnique({
      where: {
        titleId_profileKey: { titleId: parsed.data, profileKey }
      }
    });
    return NextResponse.json({ rating });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch rating" },
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

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();
  const mediaType =
    parsed.data.mediaType ?? mediaTypeFromTitleId(parsed.data.titleId);

  try {
    const rating = await prisma.rating.upsert({
      where: {
        titleId_profileKey: {
          titleId: parsed.data.titleId,
          profileKey
        }
      },
      update: { score: parsed.data.score, mediaType },
      create: {
        titleId: parsed.data.titleId,
        profileKey,
        score: parsed.data.score,
        mediaType
      }
    });
    return NextResponse.json({ rating });
  } catch {
    return NextResponse.json(
      { error: "Unable to save rating" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const titleIdRaw = searchParams.get("titleId");
  if (!titleIdRaw) {
    return NextResponse.json({ error: "Missing titleId" }, { status: 400 });
  }
  const parsed = titleIdSchema.safeParse(titleIdRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();

  try {
    await prisma.rating.deleteMany({
      where: { titleId: parsed.data, profileKey }
    });
    return NextResponse.json({ removed: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove rating" },
      { status: 503 }
    );
  }
}
