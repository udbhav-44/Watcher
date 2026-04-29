import Link from "next/link";
import { notFound } from "next/navigation";

import { MovieRail } from "@/components/movies/movie-rail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeaturedRails, getMovieByTitleId } from "@/lib/data/movies";

type Props = {
  params: { ttid: string };
};

export default async function TitleDetailPage({ params }: Props): Promise<JSX.Element> {
  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  const rails = await getFeaturedRails();

  return (
    <div className="space-y-8">
      <Card className="space-y-4 p-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">{movie.genres.join(" • ")}</p>
          <h1 className="text-4xl font-bold">{movie.title}</h1>
          <p className="text-white/70">{movie.synopsis}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/watch/${movie.titleId}`}>
            <Button size="lg">Play Now</Button>
          </Link>
          <Button variant="outline" size="lg">
            Add to Watchlist
          </Button>
          <Button variant="ghost" size="lg">
            Rate
          </Button>
        </div>
      </Card>
      <MovieRail title="Because You Watched Sci-Fi" movies={rails[1]?.movies ?? []} />
    </div>
  );
}
