import { NextResponse } from "next/server";
import { z } from "zod";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import {
  DEFAULT_COLLECTION_SLUG,
  ensureDefaultCollection,
  removeCollectionItem,
  upsertCollectionItem
} from "@/lib/personalization/collections";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

const payloadSchema = z.object({
  titleId: titleIdSchema
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const profileKey =
    searchParams.get("profileKey") ?? getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const collection = await prisma.collection.findUnique({
      where: { profileKey_slug: { profileKey, slug: DEFAULT_COLLECTION_SLUG } },
      include: {
        items: { orderBy: { addedAt: "desc" } }
      }
    });

    const watchlist = (collection?.items ?? []).map((item) => ({
      id: item.id,
      titleId: item.titleId,
      mediaType: item.mediaType,
      profileKey,
      createdAt: item.addedAt.toISOString()
    }));

    return NextResponse.json({ watchlist });
  } catch {
    return NextResponse.json(
      { error: "Unable to fetch watchlist" },
      { status: 503 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    await ensureDefaultCollection(profileKey);
    const item = await upsertCollectionItem(
      profileKey,
      DEFAULT_COLLECTION_SLUG,
      parsed.data.titleId
    );

    return NextResponse.json({
      item: {
        id: item.collectionId,
        titleId: item.titleId,
        mediaType: item.mediaType,
        profileKey,
        createdAt: item.addedAt
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update watchlist" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const titleIdRaw = searchParams.get("titleId") ?? "";
  const parsedTitleId = titleIdSchema.safeParse(titleIdRaw);
  if (!parsedTitleId.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const removed = await removeCollectionItem(
      profileKey,
      DEFAULT_COLLECTION_SLUG,
      parsedTitleId.data
    );
    return NextResponse.json({ removed });
  } catch {
    return NextResponse.json(
      { error: "Unable to update watchlist" },
      { status: 503 }
    );
  }
}
