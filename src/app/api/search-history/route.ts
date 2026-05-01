import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const querySchema = z.object({
  query: z.string().min(1).max(100)
});

const MAX_HISTORY = 25;

export async function GET(): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();

  try {
    const entries = await prisma.searchHistoryEntry.findMany({
      where: { profileKey },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY
    });
    return NextResponse.json({
      searches: entries.map((entry) => ({
        id: entry.id,
        query: entry.query,
        createdAt: entry.createdAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch search history" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();
  const query = parsed.data.query.trim();

  try {
    await prisma.$transaction([
      prisma.searchHistoryEntry.deleteMany({
        where: { profileKey, query }
      }),
      prisma.searchHistoryEntry.create({
        data: { profileKey, query }
      })
    ]);

    const total = await prisma.searchHistoryEntry.count({
      where: { profileKey }
    });
    if (total > MAX_HISTORY) {
      const excess = await prisma.searchHistoryEntry.findMany({
        where: { profileKey },
        orderBy: { createdAt: "asc" },
        take: total - MAX_HISTORY
      });
      if (excess.length > 0) {
        await prisma.searchHistoryEntry.deleteMany({
          where: { id: { in: excess.map((entry) => entry.id) } }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to record search" },
      { status: 503 }
    );
  }
}

export async function DELETE(): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();
  try {
    await prisma.searchHistoryEntry.deleteMany({ where: { profileKey } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to clear search history" },
      { status: 503 }
    );
  }
}
