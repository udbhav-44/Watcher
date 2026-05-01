import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { EpisodeWatchRecorder } from "@/components/player/episode-watch-recorder";
import { NextEpisodeOverlay } from "@/components/player/next-episode-overlay";
import { ServerTogglePlayer } from "@/components/player/server-toggle-player";
import { SkipIntroControls } from "@/components/player/skip-intro-controls";
import { Card } from "@/components/ui/card";
import { isTvTitleId, tmdbIdFromTitleId } from "@/lib/catalog/titleId";
import { getSeasonEpisodes, getTvDetailByTitleId } from "@/lib/data/tv";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveVidkingUrlFromIdentifier } from "@/lib/vidking/resolveVidkingUrl";

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
  const vidkingUrl = await resolveVidkingUrlFromIdentifier(show.titleId, {
    season,
    episode
  }).catch(() => null);

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

  const episodeLabel = `S${season} • E${episode}${
    currentEpisode ? ` · ${currentEpisode.name}` : ""
  }`;

  return (
    <div className="space-y-6">
      <EpisodeWatchRecorder
        titleId={show.titleId}
        mediaType="tv"
        season={season}
        episode={episode}
      />
      <ActivePlayerBinder
        titleId={show.titleId}
        title={show.title}
        src={vidkingUrl ?? playImdbUrl}
        poster={show.backdropUrl ?? null}
        mediaType="tv"
        season={season}
        episode={episode}
        episodeName={currentEpisode?.name ?? null}
      />
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold">{show.title}</h1>
        <Link
          href={`/tv/${show.titleId}`}
          className="text-sm text-[#f2c46d] hover:underline"
        >
          Back to series
        </Link>
      </div>

      <ServerTogglePlayer
        titleId={show.titleId}
        poster={show.backdropUrl}
        playImdbUrl={playImdbUrl}
        vidkingUrl={vidkingUrl}
        mediaType="tv"
        episodeLabel={episodeLabel}
      />

      <NextEpisodeOverlay
        titleId={show.titleId}
        currentSeason={season}
        currentEpisode={episode}
        nextSeason={nextSeason}
        nextEpisode={nextEpisode}
        nextEpisodeName={nextEpisodeName}
        nextEpisodeStillUrl={nextEpisodeStillUrl}
        durationMinutes={
          show.durationMinutes ?? currentEpisode?.runtime ?? null
        }
      />

      <SkipIntroControls
        titleId={show.titleId}
        season={season}
        episode={episode}
        kind="intro"
      />

      {show.seasons.length > 0 && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs tracking-[0.16em] text-white/56 uppercase">
              Seasons
            </p>
            <p className="text-xs text-white/45">
              {show.numberOfSeasons ?? show.seasons.length} total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {show.seasons.map((seasonEntry) => (
              <Link
                key={seasonEntry.seasonNumber}
                href={`/tv/${show.titleId}/watch?s=${seasonEntry.seasonNumber}&e=1`}
                className={
                  seasonEntry.seasonNumber === season
                    ? "rounded-full border border-[#f2c46d]/60 bg-[#f2c46d]/10 px-3 py-1 text-sm text-white"
                    : "rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-sm text-white/70 hover:bg-white/[0.08]"
                }
              >
                {seasonEntry.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {episodes.length > 0 && (
        <Card className="space-y-3">
          <p className="text-xs tracking-[0.16em] text-white/56 uppercase">
            Episodes
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {episodes.map((entry) => {
              const active = entry.episodeNumber === episode;
              return (
                <Link
                  key={`${entry.seasonNumber}-${entry.episodeNumber}`}
                  href={`/tv/${show.titleId}/watch?s=${entry.seasonNumber}&e=${entry.episodeNumber}`}
                  className={
                    active
                      ? "surface-panel grid grid-cols-[96px_1fr] gap-3 rounded-lg border border-[#f2c46d]/60 p-3"
                      : "surface-panel grid grid-cols-[96px_1fr] gap-3 rounded-lg p-3 transition hover:bg-white/[0.06]"
                  }
                >
                  <div className="relative h-[60px] w-[96px] overflow-hidden rounded-md bg-white/5">
                    {entry.stillUrl ? (
                      <Image
                        src={entry.stillUrl}
                        alt={entry.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-[#1a1a1a]" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {entry.episodeNumber}. {entry.name}
                    </p>
                    <p className="line-clamp-2 text-xs text-white/56">
                      {entry.overview ??
                        "No synopsis available for this episode yet."}
                    </p>
                    {entry.runtime && (
                      <p className="text-xs text-white/45">
                        {entry.runtime} min
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
