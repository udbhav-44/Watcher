import {
  isAnimeTitleId,
  isTvTitleId,
  tmdbIdFromTitleId
} from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { getMovieByTitleId } from "@/lib/data/movies";
import {
  hasTmdb,
  toTvCardFromTmdb,
  tmdbFetch,
  type TmdbEpisode,
  type TmdbTvShow
} from "@/lib/data/tmdb";
import { getTvDetailByTitleId } from "@/lib/data/tv";
import {
  resolveUpNextEpisode,
  type UpNextEntry
} from "@/lib/personalization/seriesProgress";
import { getWatchedTitleIds } from "@/lib/personalization/watched";
import type { MovieCard } from "@/lib/types";

type WatchEventRow = {
  id: string;
  titleId: string;
  progressPercent: number;
  completed?: boolean;
  mediaType?: "movie" | "tv" | "anime";
  season?: number | null;
  episode?: number | null;
  watchedAt?: Date;
};

export type ContinueWatchingItem = WatchEventRow & {
  movie?: MovieCard;
  episodeName?: string | null;
  episodeStillUrl?: string | null;
  reason?: UpNextEntry["reason"];
};

const isMovieInProgress = (event: WatchEventRow): boolean => {
  if (event.completed) return false;
  if (event.progressPercent <= 5 || event.progressPercent >= 90) return false;
  return true;
};

const fetchEpisodesByShow = async (
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

const fetchSeriesIndex = async (
  tmdbId: number
): Promise<{
  show: TmdbTvShow;
  episodes: Array<{
    season: number;
    episode: number;
    name: string;
    stillPath: string | null;
  }>;
} | null> => {
  if (!hasTmdb()) return null;
  const show = await tmdbFetch<TmdbTvShow>(`/tv/${tmdbId}`, {
    append_to_response: "external_ids"
  });
  if (!show) return null;
  const totalSeasons = show.number_of_seasons ?? 1;
  const episodes = await fetchEpisodesByShow(
    tmdbId,
    Math.max(1, Math.min(totalSeasons, 15))
  );
  return { show, episodes };
};

const resolveTitleCard = async (titleId: string): Promise<MovieCard | null> => {
  if (isAnimeTitleId(titleId)) {
    return getAnimeDetailByTitleId(titleId);
  }
  if (isTvTitleId(titleId)) {
    return getTvDetailByTitleId(titleId);
  }
  return getMovieByTitleId(titleId);
};

const resolveAnimeContinue = (
  titleId: string,
  events: WatchEventRow[]
): ContinueWatchingItem | null => {
  const animeEvents = events.filter((event) => event.mediaType === "anime");
  if (animeEvents.length === 0) return null;

  for (const event of animeEvents) {
    if (event.completed || event.progressPercent >= 90) continue;
    if (event.progressPercent <= 5) continue;
    if (event.episode == null) continue;
    return {
      id: event.id,
      titleId,
      progressPercent: event.progressPercent,
      completed: event.completed,
      mediaType: "anime",
      season: 1,
      episode: event.episode,
      watchedAt: event.watchedAt,
      reason: "in_progress"
    };
  }

  const latestFinished = animeEvents.find(
    (event) =>
      event.episode != null &&
      (event.completed || event.progressPercent >= 90)
  );
  if (!latestFinished?.episode) return null;

  const nextEpisode = latestFinished.episode + 1;
  return {
    id: latestFinished.id,
    titleId,
    progressPercent: 0,
    completed: false,
    mediaType: "anime",
    season: 1,
    episode: nextEpisode,
    watchedAt: latestFinished.watchedAt,
    reason: "next_episode"
  };
};

const resolveTvContinue = async (
  titleId: string,
  events: WatchEventRow[]
): Promise<ContinueWatchingItem | null> => {
  const tmdbId = tmdbIdFromTitleId(titleId);
  if (!tmdbId) return null;

  const series = await fetchSeriesIndex(tmdbId);
  if (!series || series.episodes.length === 0) return null;

  const orderedEpisodes = series.episodes
    .slice()
    .sort((a, b) =>
      a.season !== b.season ? a.season - b.season : a.episode - b.episode
    );

  const { nextEpisode, reason, progressPercent, watchedKeys } =
    resolveUpNextEpisode(
      events.map((event) => ({
        season: event.season ?? null,
        episode: event.episode ?? null,
        progressPercent: event.progressPercent,
        completed: event.completed ?? false
      })),
      orderedEpisodes
    );

  if (watchedKeys.size >= orderedEpisodes.length) return null;
  if (reason === "in_watchlist" && progressPercent === 0) return null;

  const stillUrl = nextEpisode.stillPath
    ? `https://image.tmdb.org/t/p/w500${nextEpisode.stillPath}`
    : null;

  const latestEvent = events[0];

  return {
    id: latestEvent?.id ?? `${titleId}-${nextEpisode.season}-${nextEpisode.episode}`,
    titleId,
    progressPercent,
    completed: false,
    mediaType: "tv",
    season: nextEpisode.season,
    episode: nextEpisode.episode,
    episodeName: nextEpisode.name,
    episodeStillUrl: stillUrl,
    watchedAt: latestEvent?.watchedAt,
    reason
  };
};

const resolveMovieContinue = (
  titleId: string,
  events: WatchEventRow[]
): ContinueWatchingItem | null => {
  const movieEvent = events.find(
    (event) =>
      (event.mediaType === "movie" || event.mediaType == null) &&
      isMovieInProgress(event)
  );
  if (!movieEvent) return null;
  return {
    ...movieEvent,
    mediaType: "movie",
    reason: "in_progress"
  };
};

export const getContinueWatchingItems = async (
  profileKey: string
): Promise<ContinueWatchingItem[]> => {
  if (!isDbEnabled()) return [];

  try {
    const [events, watchedIds] = await Promise.all([
      prisma.watchEvent.findMany({
        where: { profileKey },
        orderBy: { watchedAt: "desc" },
        take: 200
      }),
      getWatchedTitleIds(profileKey)
    ]);

    const grouped = new Map<string, WatchEventRow[]>();
    const recency = new Map<string, number>();

    for (const event of events) {
      if (watchedIds.has(event.titleId)) continue;
      const row: WatchEventRow = {
        id: event.id,
        titleId: event.titleId,
        progressPercent: event.progressPercent,
        completed: event.completed,
        mediaType: event.mediaType as WatchEventRow["mediaType"],
        season: event.season,
        episode: event.episode,
        watchedAt: event.watchedAt
      };
      const list = grouped.get(event.titleId) ?? [];
      list.push(row);
      grouped.set(event.titleId, list);
      const time = event.watchedAt.getTime();
      if (!recency.has(event.titleId) || (recency.get(event.titleId) ?? 0) < time) {
        recency.set(event.titleId, time);
      }
    }

    const titleIds = [...grouped.keys()].sort(
      (a, b) => (recency.get(b) ?? 0) - (recency.get(a) ?? 0)
    );

    const resolved = await Promise.all(
      titleIds.slice(0, 16).map(async (titleId): Promise<ContinueWatchingItem | null> => {
        const titleEvents = grouped.get(titleId) ?? [];
        let item: ContinueWatchingItem | null = null;

        if (isTvTitleId(titleId)) {
          item = await resolveTvContinue(titleId, titleEvents);
        } else if (isAnimeTitleId(titleId)) {
          item = resolveAnimeContinue(titleId, titleEvents);
        } else {
          item = resolveMovieContinue(titleId, titleEvents);
        }

        if (!item) return null;

        const movie = await resolveTitleCard(titleId);
        if (!movie) return null;

        return { ...item, movie };
      })
    );

    return resolved.filter((item): item is ContinueWatchingItem => item != null).slice(0, 8);
  } catch {
    return [];
  }
};

/** @deprecated Use getContinueWatchingItems — kept for tests importing pickContinueWatchingEvents */
export const pickContinueWatchingEvents = (
  events: WatchEventRow[]
): WatchEventRow[] => {
  const seen = new Set<string>();
  return events
    .filter((event) => {
      if (event.mediaType === "tv") return false;
      if (!isMovieInProgress(event)) return false;
      if (seen.has(event.titleId)) return false;
      seen.add(event.titleId);
      return true;
    })
    .slice(0, 8);
};
