import {
  isAnimeTitleId,
  isTvTitleId,
  mediaTypeFromTitleId,
  tmdbIdFromTitleId,
  type MediaType
} from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { resolveUpNextEpisode } from "@/lib/personalization/seriesProgress";
import { hasTmdb, tmdbFetch, type TmdbEpisode } from "@/lib/data/tmdb";

export type WatchedSource = "auto" | "manual";

export type WatchedEntry = {
  id: string;
  titleId: string;
  mediaType: MediaType;
  source: WatchedSource;
  season: number | null;
  episode: number | null;
  watchedAt: Date;
};

const fetchTmdbEpisodes = async (
  tmdbId: number,
  totalSeasons: number
): Promise<
  Array<{ season: number; episode: number; name: string; stillPath: string | null }>
> => {
  if (!hasTmdb()) return [];
  const seasons = await Promise.all(
    Array.from({ length: Math.min(totalSeasons, 15) }, (_, index) => index + 1).map(
      async (seasonNumber) => {
        const data = await tmdbFetch<{ episodes?: TmdbEpisode[] }>(
          `/tv/${tmdbId}/season/${seasonNumber}`
        );
        return (data?.episodes ?? []).map((episode) => ({
          season: episode.season_number,
          episode: episode.episode_number,
          name: episode.name,
          stillPath: episode.still_path
        }));
      }
    )
  );
  return seasons.flat();
};

export const isTvSeriesFullyWatched = async (
  profileKey: string,
  titleId: string
): Promise<boolean> => {
  if (!isDbEnabled() || !isTvTitleId(titleId)) return false;
  const tmdbId = tmdbIdFromTitleId(titleId);
  if (!tmdbId || !hasTmdb()) return false;

  const show = await tmdbFetch<{ number_of_seasons?: number }>(`/tv/${tmdbId}`);
  if (!show) return false;

  const episodes = await fetchTmdbEpisodes(
    tmdbId,
    Math.max(1, show.number_of_seasons ?? 1)
  );
  if (episodes.length === 0) return false;

  const events = await prisma.watchEvent.findMany({
    where: { profileKey, titleId },
    orderBy: { watchedAt: "desc" }
  });

  const { watchedKeys } = resolveUpNextEpisode(events, episodes);
  return watchedKeys.size >= episodes.length;
};

export const getWatchedTitleIds = async (
  profileKey: string
): Promise<Set<string>> => {
  if (!isDbEnabled()) return new Set();
  try {
    const rows = await prisma.watchedTitle.findMany({
      where: { profileKey },
      select: { titleId: true }
    });
    return new Set(rows.map((row) => row.titleId));
  } catch {
    return new Set();
  }
};

export const getWatchedEntries = async (
  profileKey: string
): Promise<WatchedEntry[]> => {
  if (!isDbEnabled()) return [];
  try {
    const rows = await prisma.watchedTitle.findMany({
      where: { profileKey },
      orderBy: { watchedAt: "desc" },
      take: 200
    });
    return rows.map((row) => ({
      id: row.id,
      titleId: row.titleId,
      mediaType: row.mediaType as MediaType,
      source: row.source as WatchedSource,
      season: row.season,
      episode: row.episode,
      watchedAt: row.watchedAt
    }));
  } catch {
    return [];
  }
};

export const isTitleWatched = async (
  profileKey: string,
  titleId: string
): Promise<boolean> => {
  if (!isDbEnabled()) return false;
  try {
    const row = await prisma.watchedTitle.findUnique({
      where: { profileKey_titleId: { profileKey, titleId } }
    });
    return row != null;
  } catch {
    return false;
  }
};

export const markTitleWatched = async (
  profileKey: string,
  titleId: string,
  source: WatchedSource = "manual",
  season?: number | null,
  episode?: number | null
): Promise<WatchedEntry | null> => {
  if (!isDbEnabled()) return null;
  const mediaType = mediaTypeFromTitleId(titleId);
  try {
    const row = await prisma.watchedTitle.upsert({
      where: { profileKey_titleId: { profileKey, titleId } },
      create: {
        profileKey,
        titleId,
        mediaType,
        source,
        season: season ?? null,
        episode: episode ?? null
      },
      update: {
        source,
        season: season ?? null,
        episode: episode ?? null,
        watchedAt: new Date()
      }
    });
    return {
      id: row.id,
      titleId: row.titleId,
      mediaType: row.mediaType as MediaType,
      source: row.source as WatchedSource,
      season: row.season,
      episode: row.episode,
      watchedAt: row.watchedAt
    };
  } catch {
    return null;
  }
};

export const unmarkTitleWatched = async (
  profileKey: string,
  titleId: string
): Promise<boolean> => {
  if (!isDbEnabled()) return false;
  try {
    await prisma.watchedTitle.deleteMany({
      where: { profileKey, titleId }
    });
    return true;
  } catch {
    return false;
  }
};

/** Auto-mark watched after playback milestones. */
export const maybeAutoMarkWatched = async (
  profileKey: string,
  titleId: string,
  mediaType: MediaType,
  progressPercent: number,
  completed: boolean,
  season?: number | null,
  episode?: number | null
): Promise<void> => {
  if (!isDbEnabled()) return;
  if (!(completed || progressPercent >= 90)) return;

  const already = await isTitleWatched(profileKey, titleId);
  if (already) return;

  if (mediaType === "movie") {
    await markTitleWatched(profileKey, titleId, "auto");
    return;
  }

  if (mediaType === "tv" && isTvTitleId(titleId)) {
    const fullyWatched = await isTvSeriesFullyWatched(profileKey, titleId);
    if (fullyWatched) {
      await markTitleWatched(profileKey, titleId, "auto", season, episode);
    }
    return;
  }

  if (mediaType === "anime" && isAnimeTitleId(titleId)) {
    if (!completed) return;
    const { getAnimeDetailByTitleId } = await import("@/lib/data/anime");
    const detail = await getAnimeDetailByTitleId(titleId);
    const totalEpisodes =
      detail?.numberOfEpisodes ?? detail?.episodes?.length ?? null;
    if (totalEpisodes != null && episode != null && episode >= totalEpisodes) {
      await markTitleWatched(profileKey, titleId, "auto", season ?? 1, episode);
    }
  }
};
