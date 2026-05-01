import { NextResponse } from "next/server";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

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
    const items = await prisma.collectionItem.findMany({
      where: {
        titleId: parsed.data,
        collection: { profileKey }
      },
      include: { collection: { select: { slug: true, name: true } } }
    });

    return NextResponse.json({
      inSlugs: items.map((item) => item.collection.slug)
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch membership" },
      { status: 503 }
    );
  }
}
