import { NextResponse } from "next/server";

import {
  hasTmdb,
  toImageUrl,
  tmdbFetch
} from "@/lib/data/tmdb";

type TmdbMultiResult = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  profile_path?: string | null;
};

export const revalidate = 60;

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ results: [] });
  if (!hasTmdb()) return NextResponse.json({ results: [] });

  const data = await tmdbFetch<{ results?: TmdbMultiResult[] }>(
    "/search/multi",
    { query }
  );
  if (!data?.results) return NextResponse.json({ results: [] });

  const mapped = data.results
    .filter((entry) => entry.media_type === "movie" || entry.media_type === "tv")
    .slice(0, 8)
    .map((entry) => {
      const isTv = entry.media_type === "tv";
      const titleId = isTv ? `tmdb-tv-${entry.id}` : `tmdb-${entry.id}`;
      const title = entry.title ?? entry.name ?? "";
      const dateRaw = isTv ? entry.first_air_date : entry.release_date;
      const year = dateRaw && dateRaw.length >= 4 ? dateRaw.slice(0, 4) : null;
      return {
        titleId,
        mediaType: entry.media_type,
        title,
        year,
        posterUrl: toImageUrl(entry.poster_path ?? null, "w185")
      };
    })
    .filter((entry) => entry.title);

  return NextResponse.json({ results: mapped });
}
