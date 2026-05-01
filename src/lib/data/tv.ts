import {
  applyDiscoveryFilters,
  hasTmdb,
  toImageUrl,
  toTvCardFromTmdb,
  toTvSeasonsSummary,
  tmdbFetch,
  tvGenreMap,
  type DiscoveryFilters,
  type TmdbEpisode,
  type TmdbTvShow
} from "@/lib/data/tmdb";
import type {
  FeaturedRailView,
  MovieCard,
  TvDetail,
  TvEpisodeSummary
} from "@/lib/types";

let tvCatalogCache: MovieCard[] = [];
let tvRailsCache: FeaturedRailView[] = [];
let tvOnTheAirCache: MovieCard[] = [];

const tmdbTvGenreIdFromName = (
  name: string | undefined
): string | undefined => {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return Object.entries(tvGenreMap).find(
    ([, value]) => value.toLowerCase() === lower
  )?.[0];
};

export const getTrendingTv = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return tvCatalogCache;
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>(
    "/trending/tv/week"
  );
  const mapped = (result?.results ?? [])
    .slice(0, 18)
    .map((show) => toTvCardFromTmdb(show));
  if (mapped.length) tvCatalogCache = mapped;
  return mapped.length ? mapped : tvCatalogCache;
};

export const getPopularTv = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return [];
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>("/tv/popular");
  return (result?.results ?? [])
    .slice(0, 18)
    .map((show) => toTvCardFromTmdb(show));
};

export const getTopRatedTv = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return [];
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>("/tv/top_rated");
  return (result?.results ?? [])
    .slice(0, 18)
    .map((show) => toTvCardFromTmdb(show));
};

export const getOnTheAirTv = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return tvOnTheAirCache;
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>("/tv/on_the_air");
  const mapped = (result?.results ?? [])
    .slice(0, 18)
    .map((show) => toTvCardFromTmdb(show));
  if (mapped.length) tvOnTheAirCache = mapped;
  return mapped.length ? mapped : tvOnTheAirCache;
};

export const getTvFeaturedRails = async (): Promise<FeaturedRailView[]> => {
  if (!hasTmdb()) return tvRailsCache;

  const [trending, popular, topRated] = await Promise.all([
    getTrendingTv(),
    getPopularTv(),
    getTopRatedTv()
  ]);

  const rails: FeaturedRailView[] = [
    { slug: "tv-trending", label: "Trending TV", movies: trending },
    { slug: "tv-popular", label: "Popular series", movies: popular },
    { slug: "tv-top-rated", label: "Top rated TV", movies: topRated }
  ];

  if (rails.some((rail) => rail.movies.length > 0)) {
    tvRailsCache = rails;
    return rails;
  }

  return tvRailsCache;
};

export const searchTv = async (
  query: string,
  filters: Omit<DiscoveryFilters, "query"> = {}
): Promise<MovieCard[]> => {
  const q = query.trim();
  if (!q) return [];
  if (!hasTmdb()) return [];
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>("/search/tv", {
    query: q
  });
  const movies = applyDiscoveryFilters(
    result?.results?.map((show) => toTvCardFromTmdb(show)) ?? [],
    {
      query: q,
      ...filters
    }
  ).slice(0, 40);
  return movies;
};

export const discoverTv = async (
  filters: DiscoveryFilters
): Promise<MovieCard[]> => {
  if (!hasTmdb()) return [];
  const sortBy =
    filters.sort === "release_date"
      ? "first_air_date.desc"
      : filters.sort === "rating"
        ? "vote_average.desc"
        : "popularity.desc";

  const result = await tmdbFetch<{ results: TmdbTvShow[] }>("/discover/tv", {
    sort_by: sortBy,
    with_genres: tmdbTvGenreIdFromName(filters.genre) ?? "",
    "first_air_date.gte": filters.yearFrom ? `${filters.yearFrom}-01-01` : "",
    "first_air_date.lte": filters.yearTo ? `${filters.yearTo}-12-31` : "",
    with_original_language:
      filters.language && filters.language !== "all" ? filters.language : "",
    "vote_count.gte": filters.sort === "rating" ? "100" : ""
  });
  const mapped = (result?.results ?? []).map((show) => toTvCardFromTmdb(show));
  return applyDiscoveryFilters(mapped, filters).slice(0, 60);
};

export const getTvDetailByTitleId = async (
  titleId: string
): Promise<TvDetail | null> => {
  if (!titleId.toLowerCase().startsWith("tmdb-tv-")) return null;
  const tmdbId = Number(titleId.replace("tmdb-tv-", ""));
  if (!Number.isFinite(tmdbId)) return null;
  if (!hasTmdb()) return null;

  const show = await tmdbFetch<TmdbTvShow>(`/tv/${tmdbId}`, {
    append_to_response: "videos,credits,external_ids"
  });
  if (!show) return null;

  const card = toTvCardFromTmdb(show, show.external_ids?.imdb_id ?? null);
  return {
    ...card,
    mediaType: "tv",
    seasons: toTvSeasonsSummary(show.seasons)
  };
};

export const getSeasonEpisodes = async (
  tmdbId: number,
  seasonNumber: number
): Promise<TvEpisodeSummary[]> => {
  if (!hasTmdb()) return [];
  const season = await tmdbFetch<{ episodes?: TmdbEpisode[] }>(
    `/tv/${tmdbId}/season/${seasonNumber}`
  );
  return (season?.episodes ?? []).map((episode) => ({
    seasonNumber: episode.season_number,
    episodeNumber: episode.episode_number,
    name: episode.name,
    overview: episode.overview ?? null,
    airDate: episode.air_date ?? null,
    runtime: episode.runtime ?? null,
    stillUrl: toImageUrl(episode.still_path, "w300"),
    voteAverage: episode.vote_average ?? null
  }));
};

export const getSimilarTv = async (tmdbId: number): Promise<MovieCard[]> => {
  if (!hasTmdb()) return [];
  const result = await tmdbFetch<{ results: TmdbTvShow[] }>(
    `/tv/${tmdbId}/similar`
  );
  return (result?.results ?? [])
    .slice(0, 18)
    .map((show) => toTvCardFromTmdb(show));
};
