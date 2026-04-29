import { NextResponse } from "next/server";

import { getMovies } from "@/lib/data/movies";
import { recommendMovies } from "@/lib/reco/engine";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const genres = searchParams.get("genres")?.split(",").map((genre) => genre.trim()).filter(Boolean) ?? [];
  const movies = await getMovies();
  const recommended = recommendMovies(movies, genres);
  return NextResponse.json({ recommendations: recommended });
}
