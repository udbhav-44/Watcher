import { NextResponse } from "next/server";

import { searchAnimeCards } from "@/lib/data/anime";

export const revalidate = 60;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });

  const items = await searchAnimeCards(query, 8);
  const results = items.map((entry) => ({
    titleId: entry.titleId,
    mediaType: "anime" as const,
    title: entry.title,
    year: entry.releaseYear ? String(entry.releaseYear) : null,
    posterUrl: entry.posterUrl ?? null
  }));

  return NextResponse.json({ results });
}
