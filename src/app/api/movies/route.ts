import { NextResponse } from "next/server";

import { getMovies, searchMovies } from "@/lib/data/movies";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const movies = query ? await searchMovies(query) : await getMovies();
  return NextResponse.json({ movies });
}
