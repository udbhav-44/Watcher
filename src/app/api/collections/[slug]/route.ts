import { NextResponse } from "next/server";

import { isDbEnabled, prisma } from "@/lib/db";
import { DEFAULT_COLLECTION_SLUG } from "@/lib/personalization/collections";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

type Props = {
  params: { slug: string };
};

export async function GET(_: Request, { params }: Props): Promise<Response> {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();

  try {
    const collection = await prisma.collection.findUnique({
      where: { profileKey_slug: { profileKey, slug: params.slug } },
      include: {
        items: { orderBy: { addedAt: "desc" } }
      }
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        isDefault: collection.isDefault,
        items: collection.items.map((item) => ({
          id: item.id,
          titleId: item.titleId,
          mediaType: item.mediaType,
          addedAt: item.addedAt.toISOString()
        }))
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load collection" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: Props
): Promise<Response> {
  if (params.slug === DEFAULT_COLLECTION_SLUG) {
    return NextResponse.json(
      { error: "Default Watchlist cannot be deleted" },
      { status: 400 }
    );
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const profileKey = getProfileKeyFromCookie();

  try {
    await prisma.collection.deleteMany({
      where: { profileKey, slug: params.slug, isDefault: false }
    });
    return NextResponse.json({ removed: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete collection" },
      { status: 503 }
    );
  }
}
