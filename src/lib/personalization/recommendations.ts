import { tmdbIdFromTitleId, isTvTitleId } from "@/lib/catalog/titleId";
import { isDbEnabled, prisma } from "@/lib/db";
import { hasTmdb, toMovieCardFromTmdb, toTvCardFromTmdb, tmdbFetch } from "@/lib/data/tmdb";
import type { TmdbMovie, TmdbTvShow } from "@/lib/data/tmdb";
import type { MovieCard } from "@/lib/types";

type Basis = {
  titleId: string;
  title: string;
  score: number;
};

export type PersonalizedRecommendations = {
  basis: Basis | null;
  recommendations: MovieCard[];
};

const lookupTitleName = async (titleId: string): Promise<string | null> => {
  const tmdbId = tmdbIdFromTitleId(titleId);
  if (!tmdbId) return null;
  const tv = isTvTitleId(titleId);

  if (tv) {
    const show = await tmdbFetch<TmdbTvShow>(`/tv/${tmdbId}`);
    return show?.name ?? null;
  }
  const movie = await tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`);
  return movie?.title ?? null;
};

const fetchSimilar = async (titleId: string): Promise<MovieCard[]> => {
  const tmdbId = tmdbIdFromTitleId(titleId);
  if (!tmdbId) return [];
  const tv = isTvTitleId(titleId);

  if (tv) {
    const result = await tmdbFetch<{ results: TmdbTvShow[] }>(
      `/tv/${tmdbId}/similar`
    );
    return (result?.results ?? [])
      .slice(0, 18)
      .map((show) => toTvCardFromTmdb(show));
  }

  const result = await tmdbFetch<{ results: TmdbMovie[] }>(
    `/movie/${tmdbId}/similar`
  );
  return (result?.results ?? [])
    .slice(0, 18)
    .map((movie) => toMovieCardFromTmdb(movie));
};

export const getPersonalizedRecommendations = async (
  profileKey: string
): Promise<PersonalizedRecommendations> => {
  if (!isDbEnabled() || !hasTmdb()) {
    return { basis: null, recommendations: [] };
  }

  try {
    const topRating = await prisma.rating.findFirst({
      where: { profileKey, score: { gte: 4 } },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }]
    });

    if (!topRating) {
      return { basis: null, recommendations: [] };
    }

    const [basisTitle, similar] = await Promise.all([
      lookupTitleName(topRating.titleId),
      fetchSimilar(topRating.titleId)
    ]);

    if (similar.length === 0) {
      return {
        basis: basisTitle
          ? {
              titleId: topRating.titleId,
              title: basisTitle,
              score: topRating.score
            }
          : null,
        recommendations: []
      };
    }

    return {
      basis: {
        titleId: topRating.titleId,
        title: basisTitle ?? topRating.titleId,
        score: topRating.score
      },
      recommendations: similar
    };
  } catch {
    return { basis: null, recommendations: [] };
  }
};
