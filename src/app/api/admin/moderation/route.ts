import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import { assertAdminAccess } from "@/lib/security/adminAuth";

const moderationSchema = z.object({
  titleId: z.string().startsWith("tt"),
  isActive: z.boolean(),
  reason: z.string().min(3)
});

export async function POST(request: Request): Promise<Response> {
  if (!assertAdminAccess(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
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
    return NextResponse.json({ error: "Moderation failed" }, { status: 503 });
  }
}
