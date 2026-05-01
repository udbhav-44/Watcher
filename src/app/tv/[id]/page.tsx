import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { TitleActions } from "@/components/movies/title-actions";
import { TrailerModal } from "@/components/movies/trailer-modal";
import { RatingWidget } from "@/components/movies/rating-widget";
import { SeriesCompletionBadge } from "@/components/profile/series-completion-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isTvTitleId } from "@/lib/catalog/titleId";
import { getSimilarTv, getTvDetailByTitleId } from "@/lib/data/tv";

type Props = {
  params: { id: string };
};

export default async function TvDetailPage({
  params
}: Props): Promise<JSX.Element> {
  if (!isTvTitleId(params.id)) return notFound();

  const show = await getTvDetailByTitleId(params.id);
  if (!show) return notFound();

  const heroArtwork = show.backdropUrl ?? show.posterUrl;
  const similar = show.tmdbId ? await getSimilarTv(show.tmdbId) : [];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-lg border border-white/10">
        {heroArtwork ? (
          <Image
            src={heroArtwork}
            alt={show.title}
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
              {show.genres.join(" • ")}
            </p>
            <h1 className="text-4xl leading-tight font-semibold md:text-6xl">
              {show.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                {show.releaseYear ?? "TBA"}
              </span>
              {show.numberOfSeasons && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  {show.numberOfSeasons} season
                  {show.numberOfSeasons === 1 ? "" : "s"}
                </span>
              )}
              {show.numberOfEpisodes && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  {show.numberOfEpisodes} episodes
                </span>
              )}
              {show.maturityRating && (
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
                  {show.maturityRating}
                </span>
              )}
            </div>
            <p className="max-w-2xl text-sm text-white/80 md:text-base">
              {show.synopsis}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/tv/${show.titleId}/watch?s=1&e=1`}>
                <Button size="lg">
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Watch episode 1
                </Button>
              </Link>
              {show.trailerUrl && (
                <TrailerModal
                  trailerUrl={show.trailerUrl}
                  title={show.title}
                />
              )}
              <TitleActions
                titleId={show.titleId}
                title={show.title}
                mediaType="tv"
              />
            </div>
            <RatingWidget titleId={show.titleId} mediaType="tv" />
            <SeriesCompletionBadge titleId={show.titleId} />
          </div>
        </div>
      </section>

      {show.seasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Seasons</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {show.seasons.map((season) => (
              <Link
                key={season.seasonNumber}
                href={`/tv/${show.titleId}/watch?s=${season.seasonNumber}&e=1`}
                className="surface-panel group flex gap-3 rounded-lg p-3 transition hover:bg-white/[0.06]"
              >
                <div className="relative h-[108px] w-[72px] overflow-hidden rounded-md bg-white/5">
                  {season.posterUrl ? (
                    <Image
                      src={season.posterUrl}
                      alt={season.name}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#1a1a1a]" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{season.name}</p>
                  <p className="text-xs text-white/56">
                    {season.episodeCount} episodes
                  </p>
                  {season.airDate && (
                    <p className="text-xs text-white/45">
                      Aired {season.airDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <p className="mb-2 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Synopsis
          </p>
          <p className="text-sm leading-7 text-white/78">{show.synopsis}</p>
        </Card>
        <Card>
          <p className="mb-2 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Details
          </p>
          <div className="space-y-2 text-sm text-white/75">
            <p>Genres: {show.genres.join(", ")}</p>
            <p>First aired: {show.releaseYear ?? "TBA"}</p>
            <p>
              Episode runtime:{" "}
              {show.durationMinutes
                ? `${show.durationMinutes} min`
                : "Varies"}
            </p>
            <p>Catalog ID: {show.titleId}</p>
          </div>
        </Card>
      </div>

      {show.castDetails && show.castDetails.length > 0 && (
        <Card>
          <p className="mb-3 text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
            Cast
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {show.castDetails.slice(0, 12).map((member) => (
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

      <MovieRail title="More like this" movies={similar} />
    </div>
  );
}
