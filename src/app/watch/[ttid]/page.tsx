import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Play } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { ServerTogglePlayer } from "@/components/player/server-toggle-player";
import { isAnimeTitleId, isTvTitleId } from "@/lib/catalog/titleId";
import {
  getFeaturedRails,
  getMovieByTitleId,
  getSimilarMovies
} from "@/lib/data/movies";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveProviderUrlsFromIdentifier } from "@/lib/streaming/resolveProviders";

type Props = {
  params: { ttid: string };
};

export default async function WatchPage({
  params
}: Props): Promise<JSX.Element> {
  if (isAnimeTitleId(params.ttid)) {
    redirect(`/anime/${params.ttid}/watch`);
  }

  if (isTvTitleId(params.ttid)) {
    redirect(`/tv/${params.ttid}/watch`);
  }

  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  const [rails, similar, providers] = await Promise.all([
    getFeaturedRails(),
    movie.tmdbId ? getSimilarMovies(movie.tmdbId) : Promise.resolve([]),
    resolveProviderUrlsFromIdentifier(movie.titleId).catch(() => [])
  ]);
  const upNext = rails
    .flatMap((rail) => rail.movies)
    .find((candidate) => candidate.titleId !== movie.titleId);
  const playImdbUrl = movie.imdbTitleId
    ? toPlayableUrl(movie.imdbTitleId, undefined, "playimdb")
    : toPlayableUrl(movie.titleId, undefined, "playimdb");
  const primaryEmbed = providers[0]?.url ?? playImdbUrl;

  const heroMeta = [
    movie.releaseYear,
    movie.maturityRating,
    movie.durationMinutes ? `${movie.durationMinutes} min` : null
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="space-y-6">
      <ActivePlayerBinder
        titleId={movie.titleId}
        title={movie.title}
        src={primaryEmbed}
        poster={movie.backdropUrl ?? null}
        mediaType="movie"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <ServerTogglePlayer
            titleId={movie.titleId}
            poster={movie.backdropUrl}
            providers={providers}
            externalUrl={playImdbUrl}
            externalLabel="Open on PlayIMDb"
            mediaType="movie"
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                {movie.title}
              </h1>
              {heroMeta && (
                <p className="text-sm text-fg-muted tabular-nums">{heroMeta}</p>
              )}
            </div>
            <Link
              href={`/title/${movie.titleId}`}
              className="shrink-0 text-xs text-fg-faint transition hover:text-fg"
            >
              Details
            </Link>
          </div>
          {movie.synopsis && (
            <p className="max-w-prose text-pretty text-sm leading-7 text-fg-muted">
              {movie.synopsis}
            </p>
          )}
        </div>

        {upNext ? (
          <aside>
            <div className="rounded-xl border border-border bg-surface-2/80 p-4 shadow-card">
              <p className="text-[10px] tracking-[0.18em] text-fg-faint uppercase">
                Up next
              </p>
              <Link
                href={`/watch/${upNext.titleId}`}
                className="mt-2 block text-sm font-medium text-fg hover:underline"
              >
                {upNext.title}
              </Link>
              <Link
                href={`/watch/${upNext.titleId}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-fg-on-accent transition hover:bg-accent-hover"
              >
                <Play className="h-3 w-3 fill-current" />
                Play now
              </Link>
            </div>
          </aside>
        ) : null}
      </div>

      {similar.length > 0 && (
        <MovieRail title="More like this" movies={similar} />
      )}
    </div>
  );
}
