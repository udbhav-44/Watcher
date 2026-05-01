import { NextResponse } from "next/server";

import {
  hasTmdb,
  toMovieCardFromTmdb,
  toTvCardFromTmdb,
  tmdbFetch,
  type TmdbMovie,
  type TmdbTvShow
} from "@/lib/data/tmdb";
import { isDbEnabled, prisma } from "@/lib/db";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export async function GET(request: Request): Promise<Response> {
  if (!hasTmdb()) {
    return NextResponse.json({ error: "TMDB unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") === "tv" ? "tv" : "movie";

  const profileKey = getProfileKeyFromCookie();
  let watchedTitleIds = new Set<string>();
  if (isDbEnabled()) {
    try {
      const events = await prisma.watchEvent.findMany({
        where: { profileKey },
        select: { titleId: true }
      });
      watchedTitleIds = new Set(events.map((entry) => entry.titleId));
      const collectionItems = await prisma.collectionItem.findMany({
        where: { collection: { profileKey } },
        select: { titleId: true }
      });
      collectionItems.forEach((item) => watchedTitleIds.add(item.titleId));
    } catch {
      // ignore
    }
  }

  const fetchPage = async (page: number) => {
    if (scope === "tv") {
      return tmdbFetch<{ results: TmdbTvShow[] }>("/tv/top_rated", {
        page: String(page)
      });
    }
    return tmdbFetch<{ results: TmdbMovie[] }>("/movie/top_rated", {
      page: String(page)
    });
  };

  const candidates: Array<TmdbMovie | TmdbTvShow> = [];
  for (let page = 1; page <= 4 && candidates.length < 80; page += 1) {
    const data = await fetchPage(page);
    const results = data?.results ?? [];
    candidates.push(...(results as Array<TmdbMovie | TmdbTvShow>));
  }

  if (candidates.length === 0) {
    return NextResponse.json({ pick: null });
  }

  const filtered = candidates.filter((entry) => {
    const tmdbId = entry.id;
    const titleId =
      scope === "tv" ? `tmdb-tv-${tmdbId}` : `tmdb-${tmdbId}`;
    return !watchedTitleIds.has(titleId);
  });

  const pool = filtered.length > 0 ? filtered : candidates;
  const pickedRaw = pool[Math.floor(Math.random() * pool.length)];
  const pick =
    scope === "tv"
      ? toTvCardFromTmdb(pickedRaw as TmdbTvShow)
      : toMovieCardFromTmdb(pickedRaw as TmdbMovie);

  return NextResponse.json({ pick });
}
