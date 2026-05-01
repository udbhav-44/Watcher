import { NextResponse } from "next/server";
import { z } from "zod";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { isDbEnabled } from "@/lib/db";
import {
  removeCollectionItem,
  upsertCollectionItem
} from "@/lib/personalization/collections";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

type Props = {
  params: { slug: string };
};

const itemSchema = z.object({
  titleId: titleIdSchema
});

export async function POST(
  request: Request,
  { params }: Props
): Promise<Response> {
  const body = await request.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();
  try {
    const item = await upsertCollectionItem(
      profileKey,
      params.slug,
      parsed.data.titleId
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.message === "Collection not found") {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Unable to update collection" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: Props
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  const url = new URL(request.url);
  const titleIdParam =
    url.searchParams.get("titleId") ??
    (body && typeof body === "object" && body !== null && "titleId" in body
      ? String((body as { titleId?: unknown }).titleId ?? "")
      : "");
  const parsed = titleIdSchema.safeParse(titleIdParam);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }

  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileKey = getProfileKeyFromCookie();
  try {
    const removed = await removeCollectionItem(
      profileKey,
      params.slug,
      parsed.data
    );
    return NextResponse.json({ removed });
  } catch {
    return NextResponse.json(
      { error: "Unable to update collection" },
      { status: 503 }
    );
  }
}
