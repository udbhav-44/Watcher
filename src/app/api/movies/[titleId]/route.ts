import { NextResponse } from "next/server";

import { isTvTitleId } from "@/lib/catalog/titleId";
import { getMovieByTitleId } from "@/lib/data/movies";
import { getTvDetailByTitleId } from "@/lib/data/tv";

type Props = {
  params: { titleId: string };
};

export async function GET(_: Request, { params }: Props): Promise<Response> {
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
