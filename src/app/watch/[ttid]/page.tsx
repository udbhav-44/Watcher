import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";

import { MovieRail } from "@/components/movies/movie-rail";
import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { ServerTogglePlayer } from "@/components/player/server-toggle-player";
import { isTvTitleId } from "@/lib/catalog/titleId";
import {
  getFeaturedRails,
  getMovieByTitleId,
  getSimilarMovies
} from "@/lib/data/movies";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveVidkingUrlFromIdentifier } from "@/lib/vidking/resolveVidkingUrl";

type Props = {
  params: { ttid: string };
};

export default async function WatchPage({
  params
}: Props): Promise<JSX.Element> {
  if (isTvTitleId(params.ttid)) {
    redirect(`/tv/${params.ttid}/watch`);
  }

  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  const [rails, similar] = await Promise.all([
    getFeaturedRails(),
    movie.tmdbId ? getSimilarMovies(movie.tmdbId) : Promise.resolve([])
  ]);
  const upNext = rails
    .flatMap((rail) => rail.movies)
    .find((candidate) => candidate.titleId !== movie.titleId);
  const playImdbUrl = movie.imdbTitleId
    ? toPlayableUrl(movie.imdbTitleId, undefined, "playimdb")
    : toPlayableUrl(movie.titleId, undefined, "playimdb");
  const vidkingUrl = await resolveVidkingUrlFromIdentifier(movie.titleId).catch(
    () => null
  );

  const heroMeta = [
    movie.releaseYear,
    movie.maturityRating,
    movie.durationMinutes ? `${movie.durationMinutes} min` : null
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="space-y-8">
      <ActivePlayerBinder
        titleId={movie.titleId}
        title={movie.title}
        src={vidkingUrl ?? playImdbUrl}
        poster={movie.backdropUrl ?? null}
        mediaType="movie"
      />

      <Link
        href={`/title/${movie.titleId}`}
        className="inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to details
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <ServerTogglePlayer
            titleId={movie.titleId}
            poster={movie.backdropUrl}
            playImdbUrl={playImdbUrl}
            vidkingUrl={vidkingUrl}
            mediaType="movie"
          />
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-semibold text-fg md:text-4xl">
              {movie.title}
            </h1>
            {heroMeta && (
              <p className="text-sm text-fg-muted tabular-nums">{heroMeta}</p>
            )}
            {movie.synopsis && (
              <p className="max-w-prose text-pretty text-sm leading-7 text-fg-muted">
                {movie.synopsis}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {upNext ? (
            <div className="rounded-lg border border-border bg-surface-2 p-4 shadow-card">
              <p className="text-xs tracking-[0.18em] text-accent uppercase">
                Up next
              </p>
              <Link
                href={`/watch/${upNext.titleId}`}
                className="mt-2 block text-sm font-medium text-fg hover:underline"
              >
                {upNext.title}
              </Link>
              {upNext.genres.length > 0 && (
                <p className="mt-1 text-xs text-fg-faint">
                  {upNext.genres.slice(0, 2).join("  ·  ")}
                </p>
              )}
              <Link
                href={`/watch/${upNext.titleId}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-fg-on-accent transition hover:bg-accent-hover"
              >
                <Play className="h-3 w-3 fill-current" />
                Play now
              </Link>
            </div>
          ) : null}
          <div className="rounded-lg border border-border bg-surface-2/70 p-4 text-xs text-fg-muted">
            Playback opens inside the page when the provider allows it. Switch
            to the alternate server or open the player in a new tab if a stream
            doesn&apos;t start.
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <MovieRail title="More like this" movies={similar} />
      )}
    </div>
  );
}
