import { NextResponse } from "next/server";
import { z } from "zod";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const reactionSchema = z.object({
  titleId: titleIdSchema,
  type: z.enum(["LIKE", "FIRE", "WOW"])
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
    const reaction = await prisma.reaction.findUnique({
      where: {
        titleId_profileKey: { titleId: parsed.data, profileKey }
      }
    });
    return NextResponse.json({ reaction });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch reaction" },
      { status: 503 }
    );
  }
}

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
