import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { ContinueWatching } from "@/components/profile/continue-watching";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeaturedRails } from "@/lib/data/movies";

export default async function HomePage(): Promise<JSX.Element> {
  const rails = await getFeaturedRails();
  const heroMovie = rails[0]?.movies[0];

  return (
    <div className="space-y-10">
      <Card className="relative overflow-hidden p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,227,255,0.2),transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Campus Premium Streaming</p>
          <h1 className="text-4xl font-bold md:text-5xl">Futuristic Movie Nights, Now On Campus</h1>
          <p className="text-sm text-white/75 md:text-base">
            Curated collections, cinematic transitions, and instant play links powered from IMDb title IDs.
          </p>
          {heroMovie && (
            <div className="flex items-center gap-3">
              <Link href={`/watch/${heroMovie.titleId}`}>
                <Button size="lg">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play {heroMovie.title}
                </Button>
              </Link>
              <Link href={`/title/${heroMovie.titleId}`}>
                <Button variant="outline" size="lg">
                  View Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>

      <ContinueWatching />

      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
