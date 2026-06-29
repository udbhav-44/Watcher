import { isAnimeTitleId, isTvTitleId } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { getMovieByTitleId } from "@/lib/data/movies";
import { getTvDetailByTitleId } from "@/lib/data/tv";
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
};

const isInProgress = (event: WatchEventRow): boolean => {
  if (event.completed) return false;
  if (event.progressPercent <= 5 || event.progressPercent >= 90) return false;
  return true;
};

/**
 * Pick at most one resume point per title. TV is excluded — the Up next rail
 * handles series with episode stills and next-episode logic.
 */
export const pickContinueWatchingEvents = (
  events: WatchEventRow[]
): WatchEventRow[] => {
  const seen = new Set<string>();

  return events
    .filter((event) => {
      if (event.mediaType === "tv") return false;
      if (!isInProgress(event)) return false;
      if (seen.has(event.titleId)) return false;
      seen.add(event.titleId);
      return true;
    })
    .slice(0, 8);
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

export const getContinueWatchingItems = async (
  profileKey: string
): Promise<ContinueWatchingItem[]> => {
  if (!isDbEnabled()) return [];

  try {
    const events = await prisma.watchEvent.findMany({
      where: { profileKey },
      orderBy: { watchedAt: "desc" },
      take: 120
    });

    const filtered = pickContinueWatchingEvents(
      events.map((event) => ({
        id: event.id,
        titleId: event.titleId,
        progressPercent: event.progressPercent,
        completed: event.completed,
        mediaType: event.mediaType as WatchEventRow["mediaType"],
        season: event.season,
        episode: event.episode,
        watchedAt: event.watchedAt
      }))
    );

    const enriched = await Promise.all(
      filtered.map(async (event): Promise<ContinueWatchingItem> => {
        const movie = await resolveTitleCard(event.titleId);
        return {
          id: event.id,
          titleId: event.titleId,
          progressPercent: event.progressPercent,
          completed: event.completed,
          mediaType: event.mediaType,
          season: event.season,
          episode: event.episode,
          movie: movie ?? undefined
        };
      })
    );

    return enriched.filter((item) => item.movie != null);
  } catch {
    return [];
  }
};
