import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar, Clock, Play, Shield, Star } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { RatingWidget } from "@/components/movies/rating-widget";
import { TitleActions } from "@/components/movies/title-actions";
import { TitleTabs } from "@/components/movies/title-tabs";
import { TrailerModal } from "@/components/movies/trailer-modal";
import { Button } from "@/components/ui/button";
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

  const tabs = [
    { id: "overview", label: "Overview" },
    movie.castDetails && movie.castDetails.length > 0
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
            alt={movie.title}
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
              {movie.genres.slice(0, 3).join(" · ")}
            </p>
            <h1 className="text-balance text-4xl leading-tight font-semibold text-fg md:text-6xl">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              {movie.releaseYear && (
                <MetaPill icon={<Calendar className="h-3 w-3" />} label={`${movie.releaseYear}`} />
              )}
              {movie.maturityRating && (
                <MetaPill icon={<Shield className="h-3 w-3" />} label={movie.maturityRating} />
              )}
              {movie.durationMinutes && (
                <MetaPill
                  icon={<Clock className="h-3 w-3" />}
                  label={`${movie.durationMinutes} min`}
                />
              )}
              {movie.voteAverage != null && movie.voteAverage > 0 && (
                <MetaPill
                  icon={<Star className="h-3 w-3 fill-accent text-accent" />}
                  label={`${movie.voteAverage.toFixed(1)} TMDb`}
                  tone="accent"
                />
              )}
            </div>
            {movie.synopsis && (
              <p className="max-w-2xl text-pretty text-sm text-fg-muted md:text-base">
                {movie.synopsis}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href={`/watch/${movie.titleId}`}>
                <Button size="lg">
                  <Play className="h-5 w-5 fill-current" />
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
            Overview
          </h2>
          <p className="text-pretty text-sm leading-7 text-fg-muted">
            {movie.synopsis ?? "No overview available for this title yet."}
          </p>
          {movie.director && (
            <p className="mt-4 text-sm text-fg-faint">
              Director:{" "}
              <span className="text-fg">{movie.director}</span>
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-surface-2/95 p-5 shadow-card">
          <h2 className="mb-3 text-xs tracking-[0.18em] text-accent uppercase">
            Details
          </h2>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Genres" value={movie.genres.join(", ") || "—"} />
            <DetailRow label="Release" value={movie.releaseYear?.toString() ?? "TBA"} />
            <DetailRow
              label="Runtime"
              value={
                movie.durationMinutes ? `${movie.durationMinutes} min` : "Unknown"
              }
            />
            <DetailRow label="Rating" value={movie.maturityRating ?? "Not listed"} />
            <DetailRow label="Catalog ID" value={movie.titleId} mono />
          </dl>
        </div>
      </section>

      {movie.castDetails && movie.castDetails.length > 0 && (
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
              {movie.castDetails.length} credited
            </span>
          </div>
          <div className="rail-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {movie.castDetails.slice(0, 24).map((member) => (
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

type MetaPillProps = {
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "accent";
};

const MetaPill = ({ icon, label, tone = "default" }: MetaPillProps): JSX.Element => (
  <span
    className={
      tone === "accent"
        ? "inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-accent tabular-nums"
        : "inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-fg-muted tabular-nums"
    }
  >
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
