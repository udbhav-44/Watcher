import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

const moderationSchema = z.object({
  titleId: z.string().startsWith("tt"),
  isActive: z.boolean(),
  reason: z.string().min(3)
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const movie = await prisma.movie.update({
      where: { titleId: parsed.data.titleId },
      data: { isActive: parsed.data.isActive }
    });

    await prisma.adminAudit.create({
      data: {
        action: "MODERATION_TOGGLE",
        targetType: "Movie",
        targetId: movie.id,
        metadata: { reason: parsed.data.reason, isActive: parsed.data.isActive }
      }
    });

    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
