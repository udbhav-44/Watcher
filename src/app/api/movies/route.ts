import { NextResponse } from "next/server";

import { discoverMovies, getMovies, searchMovies } from "@/lib/data/movies";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const filters = {
    genre: searchParams.get("genre") ?? undefined,
    yearFrom: Number(searchParams.get("yearFrom") ?? "") || undefined,
    yearTo: Number(searchParams.get("yearTo") ?? "") || undefined,
    language: searchParams.get("language") ?? undefined,
    sort: (searchParams.get("sort") as "popularity" | "release_date" | "rating" | null) ?? undefined
  };
  const movies = query
    ? await searchMovies(query, filters)
    : filters.genre || filters.yearFrom || filters.yearTo || filters.language || filters.sort
      ? await discoverMovies(filters)
      : await getMovies();
  return NextResponse.json({ movies });
}
