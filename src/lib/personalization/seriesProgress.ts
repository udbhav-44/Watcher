import { isDbEnabled, prisma } from "@/lib/db";
import { tmdbIdFromTitleId } from "@/lib/catalog/titleId";
import {
  hasTmdb,
  toTvCardFromTmdb,
  tmdbFetch,
  type TmdbEpisode,
  type TmdbTvShow
} from "@/lib/data/tmdb";
import type { MovieCard } from "@/lib/types";

export type UpNextEntry = {
  show: MovieCard;
  season: number;
  episode: number;
  episodeName: string;
  episodeStillUrl: string | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  completionPercent: number;
  progressPercent: number;
  reason: "in_progress" | "next_episode" | "in_watchlist";
};

const fetchEpisodesByShow = async (
  tmdbId: number,
  totalSeasons: number
): Promise<Array<{ season: number; episode: number; name: string; stillPath: string | null }>> => {
  if (!hasTmdb()) return [];
  const seasons = await Promise.all(
    Array.from({ length: totalSeasons }, (_, index) => index + 1).map(
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
  episodes: Array<{ season: number; episode: number; name: string; stillPath: string | null }>;
} | null> => {
  if (!hasTmdb()) return null;
  const show = await tmdbFetch<TmdbTvShow>(`/tv/${tmdbId}`, {
    append_to_response: "external_ids"
  });
  if (!show) return null;
  const totalSeasons = show.number_of_seasons ?? 1;
  const episodes = await fetchEpisodesByShow(
    tmdbId,
    Math.max(1, Math.min(totalSeasons, 8))
  );
  return { show, episodes };
};

export const computeSeriesCompletion = async (
  profileKey: string,
  titleId: string
): Promise<{ percent: number; watched: number; total: number } | null> => {
  if (!isDbEnabled()) return null;
  const tmdbId = tmdbIdFromTitleId(titleId);
  if (!tmdbId) return null;

  const [events, index] = await Promise.all([
    prisma.watchEvent.findMany({
      where: {
        profileKey,
        titleId,
        mediaType: "tv",
        completed: true
      },
      select: { season: true, episode: true }
    }),
    fetchSeriesIndex(tmdbId)
  ]);

  if (!index) return null;
  const total = index.show.number_of_episodes ?? index.episodes.length;
  const watchedSet = new Set<string>();
  events.forEach((entry) => {
    if (entry.season != null && entry.episode != null) {
      watchedSet.add(`${entry.season}:${entry.episode}`);
    }
  });
  const watched = watchedSet.size;
  const percent = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
  return { percent, watched, total };
};

export const computeUpNext = async (
  profileKey: string
): Promise<UpNextEntry[]> => {
  if (!isDbEnabled() || !hasTmdb()) return [];

  // Series with watch events.
  const eventGroups = await prisma.watchEvent.groupBy({
    by: ["titleId"],
    where: {
      profileKey,
      mediaType: "tv"
    },
    _max: { watchedAt: true }
  });

  const orderedTitleIds = eventGroups
    .filter((entry) => entry.titleId.startsWith("tmdb-tv-"))
    .sort((a, b) => {
      const aTime = a._max.watchedAt?.getTime() ?? 0;
      const bTime = b._max.watchedAt?.getTime() ?? 0;
      return bTime - aTime;
    })
    .map((entry) => entry.titleId)
    .slice(0, 8);

  // Fall back to TV titles in any of the user's collections.
  if (orderedTitleIds.length === 0) {
    const items = await prisma.collectionItem.findMany({
      where: {
        mediaType: "tv",
        collection: { profileKey }
      },
      orderBy: { addedAt: "desc" },
      take: 6
    });
    items.forEach((item) => {
      if (
        item.titleId.startsWith("tmdb-tv-") &&
        !orderedTitleIds.includes(item.titleId)
      ) {
        orderedTitleIds.push(item.titleId);
      }
    });
  }

  if (orderedTitleIds.length === 0) return [];

  const entries = await Promise.all(
    orderedTitleIds.map(async (titleId): Promise<UpNextEntry | null> => {
      const tmdbId = tmdbIdFromTitleId(titleId);
      if (!tmdbId) return null;

      const [series, watchEvents] = await Promise.all([
        fetchSeriesIndex(tmdbId),
        prisma.watchEvent.findMany({
          where: {
            profileKey,
            titleId
          },
          orderBy: { watchedAt: "desc" }
        })
      ]);

      if (!series) return null;

      const watchedKeys = new Set<string>();
      let lastWatched: { season: number; episode: number; progressPercent: number } | null = null;

      for (const event of watchEvents) {
        if (event.season != null && event.episode != null) {
          if (!lastWatched && (event.completed || event.progressPercent > 5)) {
            lastWatched = {
              season: event.season,
              episode: event.episode,
              progressPercent: event.progressPercent
            };
          }
          if (event.completed || event.progressPercent > 90) {
            watchedKeys.add(`${event.season}:${event.episode}`);
          }
        }
      }

      const orderedEpisodes = series.episodes
        .slice()
        .sort((a, b) =>
          a.season !== b.season
            ? a.season - b.season
            : a.episode - b.episode
        );

      let nextEpisode = orderedEpisodes[0];
      let reason: UpNextEntry["reason"] = "in_watchlist";
      let progressPercent = 0;

      if (lastWatched) {
        if (lastWatched.progressPercent < 90) {
          const exact = orderedEpisodes.find(
            (entry) =>
              entry.season === lastWatched!.season &&
              entry.episode === lastWatched!.episode
          );
          if (exact) {
            nextEpisode = exact;
            reason = "in_progress";
            progressPercent = lastWatched.progressPercent;
          }
        } else {
          const lastIndex = orderedEpisodes.findIndex(
            (entry) =>
              entry.season === lastWatched!.season &&
              entry.episode === lastWatched!.episode
          );
          if (lastIndex >= 0 && orderedEpisodes[lastIndex + 1]) {
            nextEpisode = orderedEpisodes[lastIndex + 1];
            reason = "next_episode";
          } else if (lastIndex >= 0) {
            nextEpisode = orderedEpisodes[lastIndex];
            reason = "in_progress";
          }
        }
      }

      const total =
        series.show.number_of_episodes ?? orderedEpisodes.length;
      const completionPercent =
        total > 0
          ? Math.min(100, Math.round((watchedKeys.size / total) * 100))
          : 0;
      const card = toTvCardFromTmdb(
        series.show,
        series.show.external_ids?.imdb_id ?? null
      );
      const stillUrl = nextEpisode.stillPath
        ? `https://image.tmdb.org/t/p/w500${nextEpisode.stillPath}`
        : null;

      return {
        show: card,
        season: nextEpisode.season,
        episode: nextEpisode.episode,
        episodeName: nextEpisode.name,
        episodeStillUrl: stillUrl,
        totalEpisodes: total,
        watchedEpisodes: watchedKeys.size,
        completionPercent,
        progressPercent,
        reason
      };
    })
  );

  return entries.filter((entry): entry is UpNextEntry => Boolean(entry));
};
