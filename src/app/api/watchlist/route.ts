import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { memoryStore } from "@/lib/data/memoryStore";

const watchlistSchema = z.object({
  profileKey: z.string().min(2),
  movieId: z.string().min(2)
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey = searchParams.get("profileKey") ?? "default";

  try {
    const watchlist = await prisma.watchlistItem.findMany({
      where: { profileKey },
      include: { movie: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ watchlist });
  } catch {
    const watchlist = memoryStore.watchlist.filter((item) => item.profileKey === profileKey);
    return NextResponse.json({ watchlist });
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = watchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const item = await prisma.watchlistItem.upsert({
      where: {
        movieId_profileKey: {
          movieId: parsed.data.movieId,
          profileKey: parsed.data.profileKey
        }
      },
      update: {},
      create: parsed.data
    });
    return NextResponse.json({ item });
  } catch {
    const existing = memoryStore.watchlist.find(
      (entry) => entry.movieId === parsed.data.movieId && entry.profileKey === parsed.data.profileKey
    );
    if (existing) return NextResponse.json({ item: existing });
    const item = { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };
    memoryStore.watchlist.push(item);
    return NextResponse.json({ item });
  }
}
