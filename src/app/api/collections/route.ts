import { NextResponse } from "next/server";
import { z } from "zod";

import { isDbEnabled, prisma } from "@/lib/db";
import {
  ensureDefaultCollection,
  slugifyCollectionName
} from "@/lib/personalization/collections";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const createSchema = z.object({
  name: z.string().min(1).max(48)
});

export async function GET(): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();

  try {
    await ensureDefaultCollection(profileKey);
    const collections = await prisma.collection.findMany({
      where: { profileKey },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { items: true } } }
    });

    return NextResponse.json({
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        isDefault: collection.isDefault,
        itemCount: collection._count.items,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load collections" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();
  const baseSlug = slugifyCollectionName(parsed.data.name);

  try {
    let slug = baseSlug;
    let suffix = 1;
    while (
      await prisma.collection.findUnique({
        where: { profileKey_slug: { profileKey, slug } }
      })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const collection = await prisma.collection.create({
      data: {
        profileKey,
        name: parsed.data.name,
        slug,
        isDefault: false
      }
    });

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        isDefault: collection.isDefault,
        itemCount: 0,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString()
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to create collection" },
      { status: 503 }
    );
  }
}
