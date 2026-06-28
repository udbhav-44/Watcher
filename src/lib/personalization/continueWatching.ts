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
};

export type ContinueWatchingItem = WatchEventRow & {
  movie?: MovieCard;
};

const resumeKey = (event: WatchEventRow): string => {
  if (event.mediaType === "tv" && event.season && event.episode) {
    return `${event.titleId}:${event.season}:${event.episode}`;
  }
  if (event.mediaType === "anime" && event.episode) {
    return `${event.titleId}:e${event.episode}`;
  }
  return event.titleId;
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
      take: 80
    });

    const seen = new Set<string>();
    const filtered = events
      .filter((event) => {
        if (event.completed) return false;
        if (event.progressPercent <= 5 || event.progressPercent >= 90) {
          return false;
        }
        const key = resumeKey({
          ...event,
          mediaType: event.mediaType as WatchEventRow["mediaType"]
        });
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    const enriched = await Promise.all(
      filtered.map(async (event): Promise<ContinueWatchingItem> => {
        const movie = await resolveTitleCard(event.titleId);
        return {
          id: event.id,
          titleId: event.titleId,
          progressPercent: event.progressPercent,
          completed: event.completed,
          mediaType: event.mediaType as ContinueWatchingItem["mediaType"],
          season: event.season,
          episode: event.episode,
          movie: movie ?? undefined
        };
      })
    );

    return enriched;
  } catch {
    return [];
  }
};
