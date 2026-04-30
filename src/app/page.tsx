import Image from "next/image";
import Link from "next/link";
import { Info, Play } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { ContinueWatching } from "@/components/profile/continue-watching";
import { Button } from "@/components/ui/button";
import { getFeaturedRails } from "@/lib/data/movies";

export default async function HomePage(): Promise<JSX.Element> {
  const rails = await getFeaturedRails();
  const heroMovie = rails[0]?.movies[0];
  const heroArtwork = heroMovie?.backdropUrl ?? heroMovie?.posterUrl;
  const heroMeta = heroMovie
    ? [
        heroMovie.releaseYear,
        heroMovie.maturityRating,
        heroMovie.durationMinutes ? `${heroMovie.durationMinutes} min` : null
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

  return (
    <div className="space-y-10">
      <section className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[#101010]">
        {heroArtwork && heroMovie && (
          <div className="absolute inset-0">
            <Image
              src={heroArtwork}
              alt={heroMovie.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/82 to-[#070707]/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-black/10" />
        <div className="relative flex min-h-[520px] items-end p-5 md:p-10">
          {heroMovie && (
            <div className="max-w-2xl space-y-4">
              <p className="text-xs tracking-[0.22em] text-[#f2c46d] uppercase">
                Featured
              </p>
              <h1 className="text-4xl leading-tight font-semibold md:text-6xl">
                {heroMovie.title}
              </h1>
              {heroMeta && <p className="text-sm text-white/72">{heroMeta}</p>}
              {heroMovie.synopsis && (
                <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
                  {heroMovie.synopsis}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/watch/${heroMovie.titleId}`}>
                  <Button size="lg">
                    <Play className="mr-2 h-5 w-5 fill-current" />
                    Play
                  </Button>
                </Link>
                <Link href={`/title/${heroMovie.titleId}`}>
                  <Button variant="outline" size="lg">
                    <Info className="mr-2 h-5 w-5" />
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <ContinueWatching />

      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
