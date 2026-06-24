import { NextResponse } from "next/server";

import { isAnimeTitleId, isTvTitleId } from "@/lib/catalog/titleId";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { getMovieByTitleId } from "@/lib/data/movies";
import { getTvDetailByTitleId } from "@/lib/data/tv";

type Props = {
  params: { titleId: string };
};

export async function GET(_: Request, { params }: Props): Promise<Response> {
  if (isAnimeTitleId(params.titleId)) {
    const anime = await getAnimeDetailByTitleId(params.titleId);
    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }
    return NextResponse.json({ movie: anime });
  }

  if (isTvTitleId(params.titleId)) {
    const show = await getTvDetailByTitleId(params.titleId);
    if (!show) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }
    return NextResponse.json({ movie: show });
  }

  const movie = await getMovieByTitleId(params.titleId);
  if (!movie) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
  return NextResponse.json({ movie });
}
