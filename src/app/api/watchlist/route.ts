import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const titleIdSchema = z.string().regex(/^(tt\d+|tmdb-\d+)$/i, "Invalid title id");

const watchlistSchema = z.object({
  titleId: titleIdSchema
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey = searchParams.get("profileKey") ?? getProfileKeyFromCookie();
  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { profileKey },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ watchlist });
  } catch {
    return NextResponse.json({ error: "Unable to fetch watchlist" }, { status: 503 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = watchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const item = await prisma.watchlistItem.upsert({
      where: {
        titleId_profileKey: {
          titleId: parsed.data.titleId,
          profileKey
        }
      },
      update: {},
      create: { titleId: parsed.data.titleId, profileKey }
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Unable to update watchlist" }, { status: 503 });
  }
}
