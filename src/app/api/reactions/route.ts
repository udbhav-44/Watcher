import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { memoryStore } from "@/lib/data/memoryStore";

const reactionSchema = z.object({
  profileKey: z.string().min(2),
  movieId: z.string().min(2),
  type: z.enum(["LIKE", "FIRE", "WOW"])
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const reaction = await prisma.reaction.upsert({
      where: {
        movieId_profileKey: {
          movieId: parsed.data.movieId,
          profileKey: parsed.data.profileKey
        }
      },
      update: { type: parsed.data.type },
      create: parsed.data
    });
    return NextResponse.json({ reaction });
  } catch {
    const existing = memoryStore.reactions.find(
      (entry) => entry.movieId === parsed.data.movieId && entry.profileKey === parsed.data.profileKey
    );
    if (existing) {
      existing.type = parsed.data.type;
      return NextResponse.json({ reaction: existing });
    }
    const reaction = { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };
    memoryStore.reactions.push(reaction);
    return NextResponse.json({ reaction });
  }
}
