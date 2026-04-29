import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { memoryStore } from "@/lib/data/memoryStore";

const eventSchema = z.object({
  profileKey: z.string().min(2),
  movieId: z.string().min(2),
  secondsWatched: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  completed: z.boolean().default(false)
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey = searchParams.get("profileKey") ?? "default";
  try {
    const events = await prisma.watchEvent.findMany({
      where: { profileKey },
      orderBy: { watchedAt: "desc" },
      take: 40
    });
    return NextResponse.json({ events });
  } catch {
    const events = memoryStore.watchEvents
      .filter((item) => item.profileKey === profileKey)
      .sort((a, b) => +new Date(b.watchedAt) - +new Date(a.watchedAt))
      .slice(0, 40);
    return NextResponse.json({ events });
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const event = await prisma.watchEvent.create({ data: parsed.data });
    return NextResponse.json({ event });
  } catch {
    const event = { id: crypto.randomUUID(), ...parsed.data, watchedAt: new Date().toISOString() };
    memoryStore.watchEvents.push(event);
    return NextResponse.json({ event });
  }
}
