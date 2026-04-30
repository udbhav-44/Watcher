import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const titleIdSchema = z.string().regex(/^(tt\d+|tmdb-\d+)$/i, "Invalid title id");

const reactionSchema = z.object({
  titleId: titleIdSchema,
  type: z.enum(["LIKE", "FIRE", "WOW"])
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  try {
    const reaction = await prisma.reaction.upsert({
      where: {
        titleId_profileKey: {
          titleId: parsed.data.titleId,
          profileKey
        }
      },
      update: { type: parsed.data.type },
      create: { titleId: parsed.data.titleId, profileKey, type: parsed.data.type }
    });
    return NextResponse.json({ reaction });
  } catch {
    return NextResponse.json({ error: "Unable to save reaction" }, { status: 503 });
  }
}
