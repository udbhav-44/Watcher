import { NextResponse } from "next/server";

import { getMovieByTitleId } from "@/lib/data/movies";

type Props = {
  params: { titleId: string };
};

export async function GET(_: Request, { params }: Props): Promise<Response> {
  const movie = await getMovieByTitleId(params.titleId);
  if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  return NextResponse.json({ movie });
}
