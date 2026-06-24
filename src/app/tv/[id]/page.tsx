import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Film, Play, Shield, Tv2 } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { RatingWidget } from "@/components/movies/rating-widget";
import { TitleActions } from "@/components/movies/title-actions";
import { TitleTabs } from "@/components/movies/title-tabs";
import { TrailerModal } from "@/components/movies/trailer-modal";
import { SeriesCompletionBadge } from "@/components/profile/series-completion-badge";
import { Button } from "@/components/ui/button";
import { isTvTitleId } from "@/lib/catalog/titleId";
import { getSimilarTv, getTvDetailByTitleId } from "@/lib/data/tv";

export const dynamic = "force-dynamic";

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

  const tabs = [
    { id: "overview", label: "Overview" },
    show.seasons.length > 0 ? { id: "seasons", label: "Seasons" } : null,
    show.castDetails && show.castDetails.length > 0
      ? { id: "cast", label: "Cast" }
      : null,
    similar.length > 0 ? { id: "similar", label: "More like this" } : null
  ].filter((entry): entry is { id: string; label: string } => entry !== null);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-xl border border-border">
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
          <div className="absolute inset-0 bg-surface-2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/88 to-base/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent" />
        <div className="relative flex min-h-[420px] items-end p-6 md:min-h-[560px] md:p-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm tracking-[0.22em] text-accent uppercase">
              {show.genres.slice(0, 3).join(" · ")}
            </p>
            <h1 className="text-balance text-4xl leading-tight font-semibold text-fg md:text-6xl">
              {show.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              {show.releaseYear && (
                <MetaPill icon={<Calendar className="h-3 w-3" />} label={`${show.releaseYear}`} />
              )}
              {show.numberOfSeasons && (
                <MetaPill
                  icon={<Tv2 className="h-3 w-3" />}
                  label={`${show.numberOfSeasons} season${show.numberOfSeasons === 1 ? "" : "s"}`}
                />
              )}
              {show.numberOfEpisodes && (
                <MetaPill
                  icon={<Film className="h-3 w-3" />}
                  label={`${show.numberOfEpisodes} episodes`}
                />
              )}
              {show.maturityRating && (
                <MetaPill icon={<Shield className="h-3 w-3" />} label={show.maturityRating} />
              )}
              {show.durationMinutes && (
                <MetaPill
                  icon={<Clock className="h-3 w-3" />}
                  label={`${show.durationMinutes} min`}
                />
              )}
            </div>
            {show.synopsis && (
              <p className="max-w-2xl text-pretty text-sm text-fg-muted md:text-base">
                {show.synopsis}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href={`/tv/${show.titleId}/watch?s=1&e=1`}>
                <Button size="lg">
                  <Play className="h-5 w-5 fill-current" />
                  Watch episode 1
                </Button>
              </Link>
              {show.trailerUrl && (
                <TrailerModal trailerUrl={show.trailerUrl} title={show.title} />
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

      {tabs.length > 1 && <TitleTabs tabs={tabs} />}

      <section
        id="overview"
        aria-labelledby="overview-heading"
        className="grid scroll-mt-32 gap-4 md:grid-cols-3"
      >
        <div className="rounded-lg border border-border bg-surface-2/95 p-5 shadow-card md:col-span-2">
          <h2
            id="overview-heading"
            className="mb-2 text-xs tracking-[0.18em] text-accent uppercase"
          >
            Synopsis
          </h2>
          <p className="text-pretty text-sm leading-7 text-fg-muted">
            {show.synopsis ?? "No synopsis available for this series yet."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2/95 p-5 shadow-card">
          <h2 className="mb-3 text-xs tracking-[0.18em] text-accent uppercase">
            Details
          </h2>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Genres" value={show.genres.join(", ") || "—"} />
            <DetailRow
              label="First aired"
              value={show.releaseYear?.toString() ?? "TBA"}
            />
            <DetailRow
              label="Runtime"
              value={
                show.durationMinutes ? `${show.durationMinutes} min` : "Varies"
              }
            />
            <DetailRow label="Catalog ID" value={show.titleId} mono />
          </dl>
        </div>
      </section>

      {show.seasons.length > 0 && (
        <section
          id="seasons"
          aria-labelledby="seasons-heading"
          className="scroll-mt-32 space-y-3"
        >
          <div className="flex items-end justify-between gap-3">
            <h2 id="seasons-heading" className="text-xl font-medium text-fg">
              Seasons
            </h2>
            <span className="text-xs text-fg-faint tabular-nums">
              {show.seasons.length}{" "}
              {show.seasons.length === 1 ? "season" : "seasons"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {show.seasons.map((season) => (
              <Link
                key={season.seasonNumber}
                href={`/tv/${show.titleId}/watch?s=${season.seasonNumber}&e=1`}
                className="group flex gap-3 rounded-lg border border-border bg-surface-2 p-3 transition hover:border-border-strong hover:bg-fg/[0.04]"
              >
                <div className="relative h-[108px] w-[72px] shrink-0 overflow-hidden rounded-md bg-surface-3">
                  {season.posterUrl ? (
                    <Image
                      src={season.posterUrl}
                      alt={season.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                      sizes="72px"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface-3" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="line-clamp-1 text-sm font-medium text-fg">
                    {season.name}
                  </p>
                  <p className="text-xs text-fg-faint tabular-nums">
                    {season.episodeCount} episodes
                  </p>
                  {season.airDate && (
                    <p className="text-xs text-fg-faint tabular-nums">
                      Aired {season.airDate.slice(0, 4)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {show.castDetails && show.castDetails.length > 0 && (
        <section
          id="cast"
          aria-labelledby="cast-heading"
          className="scroll-mt-32 space-y-3"
        >
          <div className="flex items-end justify-between gap-3">
            <h2 id="cast-heading" className="text-xl font-medium text-fg">
              Cast
            </h2>
            <span className="text-xs text-fg-faint tabular-nums">
              {show.castDetails.length} credited
            </span>
          </div>
          <div className="rail-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {show.castDetails.slice(0, 24).map((member) => (
              <div
                key={`${member.name}-${member.character ?? ""}`}
                className="w-[128px] shrink-0 space-y-2 text-center"
              >
                <div className="relative mx-auto h-[128px] w-[128px] overflow-hidden rounded-full border border-border bg-surface-3">
                  {member.profileUrl ? (
                    <Image
                      src={member.profileUrl}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl text-fg-faint">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="line-clamp-1 text-sm font-medium text-fg">
                    {member.name}
                  </p>
                  {member.character && (
                    <p className="line-clamp-1 text-xs text-fg-faint">
                      {member.character}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section id="similar" className="scroll-mt-32">
          <MovieRail title="More like this" movies={similar} />
        </section>
      )}
    </div>
  );
}

const MetaPill = ({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}): JSX.Element => (
  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-fg-muted tabular-nums">
    {icon}
    {label}
  </span>
);

const DetailRow = ({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}): JSX.Element => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-xs tracking-wide text-fg-faint uppercase">{label}</dt>
    <dd
      className={
        mono
          ? "max-w-[60%] truncate text-right font-mono text-xs text-fg"
          : "max-w-[60%] truncate text-right text-fg"
      }
    >
      {value}
    </dd>
  </div>
);
