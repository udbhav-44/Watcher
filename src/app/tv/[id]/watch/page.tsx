import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { ServerTogglePlayer } from "@/components/player/server-toggle-player";
import { TvWatchSession } from "@/components/player/tv-watch-session";
import { SkipIntroControls } from "@/components/player/skip-intro-controls";
import { isTvTitleId, tmdbIdFromTitleId } from "@/lib/catalog/titleId";
import { getSeasonEpisodes, getTvDetailByTitleId } from "@/lib/data/tv";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveProviderUrlsFromIdentifier } from "@/lib/streaming/resolveProviders";

type Props = {
  params: { id: string };
  searchParams: { s?: string; e?: string };
};

const safeNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function TvWatchPage({
  params,
  searchParams
}: Props): Promise<JSX.Element> {
  if (!isTvTitleId(params.id)) return notFound();

  const show = await getTvDetailByTitleId(params.id);
  if (!show) return notFound();

  const tmdbId = tmdbIdFromTitleId(show.titleId);
  const requestedSeason = safeNumber(searchParams.s, 1);
  const requestedEpisode = safeNumber(searchParams.e, 1);

  const seasonAvailable = show.seasons.find(
    (season) => season.seasonNumber === requestedSeason
  );
  const season = seasonAvailable
    ? requestedSeason
    : show.seasons[0]?.seasonNumber ?? 1;
  const episodes =
    tmdbId && season ? await getSeasonEpisodes(tmdbId, season) : [];
  const episodeAvailable = episodes.some(
    (entry) => entry.episodeNumber === requestedEpisode
  );
  const episode = episodeAvailable
    ? requestedEpisode
    : episodes[0]?.episodeNumber ?? 1;

  const playImdbUrl = show.imdbTitleId
    ? toPlayableUrl(show.imdbTitleId, undefined, "playimdb")
    : toPlayableUrl(show.titleId, undefined, "playimdb");
  const providers = await resolveProviderUrlsFromIdentifier(show.titleId, {
    season,
    episode
  }).catch(() => []);
  const primaryEmbed = providers[0]?.url ?? playImdbUrl;

  const currentEpisodeIndex = episodes.findIndex(
    (entry) => entry.episodeNumber === episode
  );
  const currentEpisode =
    currentEpisodeIndex >= 0 ? episodes[currentEpisodeIndex] : null;

  let nextSeason: number | null = null;
  let nextEpisode: number | null = null;
  let nextEpisodeName: string | null = null;
  let nextEpisodeStillUrl: string | null = null;

  if (currentEpisodeIndex >= 0 && episodes[currentEpisodeIndex + 1]) {
    const next = episodes[currentEpisodeIndex + 1];
    nextSeason = next.seasonNumber;
    nextEpisode = next.episodeNumber;
    nextEpisodeName = next.name;
    nextEpisodeStillUrl = next.stillUrl ?? null;
  } else if (tmdbId) {
    const nextSeasonEntry = show.seasons.find(
      (entry) => entry.seasonNumber === season + 1
    );
    if (nextSeasonEntry) {
      const nextSeasonEpisodes = await getSeasonEpisodes(
        tmdbId,
        nextSeasonEntry.seasonNumber
      );
      const first = nextSeasonEpisodes[0];
      if (first) {
        nextSeason = first.seasonNumber;
        nextEpisode = first.episodeNumber;
        nextEpisodeName = first.name;
        nextEpisodeStillUrl = first.stillUrl ?? null;
      }
    }
  }

  const episodeLabel = `S${season}  ·  E${episode}${
    currentEpisode ? `  ·  ${currentEpisode.name}` : ""
  }`;

  return (
    <div className="space-y-5">
      <ActivePlayerBinder
        titleId={show.titleId}
        title={show.title}
        src={primaryEmbed}
        poster={show.backdropUrl ?? null}
        mediaType="tv"
        season={season}
        episode={episode}
        episodeName={currentEpisode?.name ?? null}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <ServerTogglePlayer
            titleId={show.titleId}
            poster={show.backdropUrl}
            providers={providers}
            externalUrl={playImdbUrl}
            externalLabel="Open on PlayIMDb"
            mediaType="tv"
            episodeLabel={episodeLabel}
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                {show.title}
              </h1>
              <p className="text-sm text-fg-muted tabular-nums">{episodeLabel}</p>
            </div>
            <Link
              href={`/tv/${show.titleId}`}
              className="shrink-0 text-xs text-fg-faint transition hover:text-fg"
            >
              Series
            </Link>
          </div>
          {currentEpisode?.overview && (
            <p className="max-w-prose text-pretty text-sm leading-7 text-fg-muted">
              {currentEpisode.overview}
            </p>
          )}
          <TvWatchSession
            titleId={show.titleId}
            season={season}
            episode={episode}
            nextSeason={nextSeason}
            nextEpisode={nextEpisode}
            nextEpisodeName={nextEpisodeName}
            nextEpisodeStillUrl={nextEpisodeStillUrl}
          />
          <SkipIntroControls
            titleId={show.titleId}
            season={season}
            episode={episode}
            kind="intro"
          />
        </div>

        <aside className="space-y-4">
          {show.seasons.length > 0 && (
            <div className="rounded-lg border border-border bg-surface-2/95 p-4 shadow-card">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  Seasons
                </p>
                <p className="text-xs text-fg-faint tabular-nums">
                  {show.numberOfSeasons ?? show.seasons.length} total
                </p>
              </div>
              <div className="-mx-1 flex flex-wrap gap-1.5">
                {show.seasons.map((seasonEntry) => {
                  const active = seasonEntry.seasonNumber === season;
                  return (
                    <Link
                      key={seasonEntry.seasonNumber}
                      href={`/tv/${show.titleId}/watch?s=${seasonEntry.seasonNumber}&e=1`}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "rounded-full border border-accent/50 bg-accent-soft px-3 py-1 text-sm font-medium text-accent transition"
                          : "rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-sm text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
                      }
                    >
                      {seasonEntry.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {episodes.length > 0 && (
            <div className="rounded-lg border border-border bg-surface-2/95 shadow-card">
              <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  Episodes
                </p>
                <p className="text-xs text-fg-faint tabular-nums">
                  {episodes.length}
                </p>
              </div>
              <ol className="max-h-[640px] space-y-1 overflow-y-auto p-2">
                {episodes.map((entry) => {
                  const active = entry.episodeNumber === episode;
                  return (
                    <li key={`${entry.seasonNumber}-${entry.episodeNumber}`}>
                      <Link
                        href={`/tv/${show.titleId}/watch?s=${entry.seasonNumber}&e=${entry.episodeNumber}`}
                        aria-current={active ? "page" : undefined}
                        className={
                          active
                            ? "grid grid-cols-[96px_1fr] gap-3 rounded-md border border-accent/50 bg-accent-soft p-2"
                            : "grid grid-cols-[96px_1fr] gap-3 rounded-md p-2 transition hover:bg-fg/[0.04]"
                        }
                      >
                        <div className="relative h-[60px] w-[96px] overflow-hidden rounded-sm bg-surface-3">
                          {entry.stillUrl ? (
                            <Image
                              src={entry.stillUrl}
                              alt={entry.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-surface-3" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p
                            className={
                              active
                                ? "line-clamp-1 text-sm font-medium text-fg"
                                : "line-clamp-1 text-sm font-medium text-fg"
                            }
                          >
                            <span className="text-fg-faint tabular-nums">
                              {entry.episodeNumber}.
                            </span>{" "}
                            {entry.name}
                          </p>
                          {entry.overview && (
                            <p className="line-clamp-2 text-xs text-fg-muted">
                              {entry.overview}
                            </p>
                          )}
                          {entry.runtime && (
                            <p className="text-xs text-fg-faint tabular-nums">
                              {entry.runtime} min
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
