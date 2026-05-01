import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Play } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { RatingWidget } from "@/components/movies/rating-widget";
import { TitleActions } from "@/components/movies/title-actions";
import { TrailerModal } from "@/components/movies/trailer-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isTvTitleId } from "@/lib/catalog/titleId";
import { getMovieByTitleId, getSimilarMovies } from "@/lib/data/movies";

type Props = {
  params: { ttid: string };
};

export default async function TitleDetailPage({
  params
}: Props): Promise<JSX.Element> {
  if (isTvTitleId(params.ttid)) {
    redirect(`/tv/${params.ttid}`);
  }

  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  const heroArtwork = movie.backdropUrl ?? movie.posterUrl;
  const similar = movie.tmdbId ? await getSimilarMovies(movie.tmdbId) : [];

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
        <div className="relative flex min-h-[420px] items-end p-6 md:min-h-[560px] md:p-10">
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
              {movie.voteAverage != null && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  ★ {movie.voteAverage.toFixed(1)}
                </span>
              )}
            </div>
            <p className="max-w-2xl text-sm text-white/80 md:text-base">
              {movie.synopsis}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/watch/${movie.titleId}`}>
                <Button size="lg">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Play
                </Button>
              </Link>
              {movie.trailerUrl && (
                <TrailerModal trailerUrl={movie.trailerUrl} title={movie.title} />
              )}
              <TitleActions
                titleId={movie.titleId}
                title={movie.title}
                mediaType="movie"
              />
            </div>
            <RatingWidget titleId={movie.titleId} mediaType="movie" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Overview
          </p>
          <p className="text-sm leading-7 text-white/78">{movie.synopsis}</p>
          {movie.director && (
            <p className="mt-3 text-sm text-white/60">
              Director:{" "}
              <span className="text-white/85">{movie.director}</span>
            </p>
          )}
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

      {movie.castDetails && movie.castDetails.length > 0 && (
        <Card>
          <p className="mb-3 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Cast
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {movie.castDetails.slice(0, 12).map((member) => (
              <div
                key={`${member.name}-${member.character ?? ""}`}
                className="space-y-1 text-center"
              >
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-white/5">
                  {member.profileUrl ? (
                    <Image
                      src={member.profileUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="line-clamp-1 text-sm font-medium">
                  {member.name}
                </p>
                {member.character && (
                  <p className="line-clamp-1 text-xs text-white/56">
                    {member.character}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {similar.length > 0 && (
        <MovieRail title="More like this" movies={similar} />
      )}
    </div>
  );
}
