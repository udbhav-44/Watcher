import { tmdbIdFromTitleId } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import {
  hasTmdb,
  toImageUrl,
  tmdbFetch,
  type TmdbEpisode,
  type TmdbTvShow
} from "@/lib/data/tmdb";

export type CalendarEntry = {
  titleId: string;
  showName: string;
  posterUrl: string | null;
  season: number;
  episode: number;
  episodeName: string;
  airDate: string;
  status: "today" | "this_week" | "upcoming";
  isWatching: boolean;
};

const sourceTitleIdsForProfile = async (
  profileKey: string
): Promise<Array<{ titleId: string; isWatching: boolean }>> => {
  const titleIds = new Map<string, boolean>();

  const watchedSeries = await prisma.watchEvent.groupBy({
    by: ["titleId"],
    where: { profileKey, mediaType: "tv" }
  });
  watchedSeries.forEach((entry) => {
    if (entry.titleId.startsWith("tmdb-tv-")) {
      titleIds.set(entry.titleId, true);
    }
  });

  const collectionItems = await prisma.collectionItem.findMany({
    where: { mediaType: "tv", collection: { profileKey } },
    select: { titleId: true }
  });
  collectionItems.forEach((item) => {
    if (item.titleId.startsWith("tmdb-tv-") && !titleIds.has(item.titleId)) {
      titleIds.set(item.titleId, false);
    }
  });

  return Array.from(titleIds.entries()).map(([titleId, isWatching]) => ({
    titleId,
    isWatching
  }));
};

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const getUpcomingEpisodesForProfile = async (
  profileKey: string,
  rangeDays = 14
): Promise<CalendarEntry[]> => {
  if (!isDbEnabled() || !hasTmdb()) return [];

  const sources = await sourceTitleIdsForProfile(profileKey);
  if (sources.length === 0) return [];

  const today = startOfDay(new Date());
  const horizon = new Date(today.getTime() + rangeDays * 24 * 60 * 60 * 1000);

  const perShow = await Promise.all(
    sources.map(async (entry): Promise<CalendarEntry[]> => {
      const tmdbId = tmdbIdFromTitleId(entry.titleId);
      if (!tmdbId) return [];

      const show = await tmdbFetch<TmdbTvShow>(`/tv/${tmdbId}`);
      if (!show) return [];

      const candidateSeasons = (show.seasons ?? [])
        .filter((season) => season.season_number >= 1)
        .filter((season) => {
          if (!season.air_date) return true;
          const air = new Date(season.air_date);
          return air >= new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        })
        .slice(-3);

      const episodes: TmdbEpisode[] = [];
      await Promise.all(
        candidateSeasons.map(async (season) => {
          const data = await tmdbFetch<{ episodes?: TmdbEpisode[] }>(
            `/tv/${tmdbId}/season/${season.season_number}`
          );
          (data?.episodes ?? []).forEach((episode) => episodes.push(episode));
        })
      );

      const upcoming = episodes
        .filter((episode) => Boolean(episode.air_date))
        .map((episode) => {
          const air = new Date(episode.air_date as string);
          return { episode, air };
        })
        .filter(({ air }) => air >= today && air <= horizon)
        .sort((a, b) => a.air.getTime() - b.air.getTime());

      return upcoming.map(({ episode, air }) => {
        const todayDay = startOfDay(today);
        const airDay = startOfDay(air);
        const isToday = airDay.getTime() === todayDay.getTime();
        const inWeek =
          airDay.getTime() <=
          todayDay.getTime() + 7 * 24 * 60 * 60 * 1000;
        return {
          titleId: entry.titleId,
          showName: show.name,
          posterUrl: toImageUrl(show.poster_path, "w300"),
          season: episode.season_number,
          episode: episode.episode_number,
          episodeName: episode.name,
          airDate: episode.air_date as string,
          status: isToday ? "today" : inWeek ? "this_week" : "upcoming",
          isWatching: entry.isWatching
        } satisfies CalendarEntry;
      });
    })
  );

  return perShow
    .flat()
    .sort((a, b) => a.airDate.localeCompare(b.airDate));
};
