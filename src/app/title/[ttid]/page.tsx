import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, PlayCircle } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { TitleActions } from "@/components/movies/title-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getFeaturedRails, getMovieByTitleId } from "@/lib/data/movies";

type Props = {
  params: { ttid: string };
};

export default async function TitleDetailPage({
  params
}: Props): Promise<JSX.Element> {
  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  const rails = await getFeaturedRails();
  const heroArtwork = movie.backdropUrl ?? movie.posterUrl;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-white/10">
        {heroArtwork ? (
          <Image
            src={heroArtwork}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#121212]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/88 to-[#070707]/36" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent" />
        <div className="relative flex min-h-[380px] items-end p-6 md:min-h-[520px] md:p-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm tracking-[0.22em] text-[#f2c46d] uppercase">
              {movie.genres.join(" • ")}
            </p>
            <h1 className="text-4xl leading-tight font-semibold md:text-6xl">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                {movie.releaseYear ?? "TBA"}
              </span>
              {movie.maturityRating && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  {movie.maturityRating}
                </span>
              )}
              {movie.durationMinutes && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  {movie.durationMinutes} min
                </span>
              )}
            </div>
            <p className="max-w-2xl text-sm text-white/80 md:text-base">
              {movie.synopsis}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/watch/${movie.titleId}`}>
                <Button size="lg">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Play
                </Button>
              </Link>
              {movie.trailerUrl && (
                <a href={movie.trailerUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="lg">
                    Trailer <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              <TitleActions titleId={movie.titleId} />
            </div>
          </div>
        </div>
      </section>

      <Card className="sticky top-20 z-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-[#f2c46d] uppercase">
              Selected title
            </p>
            <p className="text-lg font-semibold">{movie.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/watch/${movie.titleId}`}>
              <Button size="sm">Resume</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost" size="sm">
                More like this
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Overview
          </p>
          <p className="text-sm leading-7 text-white/78">{movie.synopsis}</p>
        </Card>
        <Card>
          <p className="mb-2 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Details
          </p>
          <div className="space-y-2 text-sm text-white/75">
            <p>Genres: {movie.genres.join(", ")}</p>
            <p>Release: {movie.releaseYear ?? "TBA"}</p>
            <p>
              Runtime:{" "}
              {movie.durationMinutes
                ? `${movie.durationMinutes} min`
                : "Unknown"}
            </p>
            <p>Rating: {movie.maturityRating ?? "Not listed"}</p>
            <p>Catalog ID: {movie.titleId}</p>
          </div>
        </Card>
      </div>

      {movie.cast?.length ? (
        <Card>
          <p className="mb-3 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Cast
          </p>
          <div className="flex flex-wrap gap-2">
            {movie.cast.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-sm text-white/80"
              >
                {name}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white/72">
            Find similar titles in the library.
          </p>
          <Link
            href="/browse"
            className="text-sm text-[#f2c46d] hover:underline"
          >
            Browse
          </Link>
        </div>
      </Card>
      <MovieRail
        title={rails[1]?.label ?? "More like this"}
        movies={rails[1]?.movies ?? []}
      />
    </div>
  );
}
