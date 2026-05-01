import { Prisma } from "@prisma/client";

import { isDbEnabled, prisma } from "@/lib/db";
import { mockMovies } from "@/lib/data/mockMovies";
import {
  applyDiscoveryFilters,
  dedupeByTitleId,
  hasTmdb,
  movieGenreMap,
  toMovieCardFromTmdb,
  tmdbFetch,
  type DiscoveryFilters,
  type TmdbMovie
} from "@/lib/data/tmdb";
import { recommendMovies } from "@/lib/reco/engine";
import type { FeaturedRailView, MovieCard } from "@/lib/types";

const movieInclude = {
  genres: { include: { genre: true } }
} satisfies Prisma.MovieInclude;

let tmdbCatalogCache: MovieCard[] = [];
let tmdbRailsCache: FeaturedRailView[] = [];
let tmdbNowPlayingCache: MovieCard[] = [];

export type { DiscoveryFilters } from "@/lib/data/tmdb";

const tmdbGenreIdFromName = (name: string | undefined): string | undefined => {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return Object.entries(movieGenreMap).find(
    ([, value]) => value.toLowerCase() === lower
  )?.[0];
};

export const discoverMovies = async (
  filters: DiscoveryFilters
): Promise<MovieCard[]> => {
  if (hasTmdb()) {
    const sortBy =
      filters.sort === "release_date"
        ? "primary_release_date.desc"
        : filters.sort === "rating"
          ? "vote_average.desc"
          : "popularity.desc";

    const result = await tmdbFetch<{ results: TmdbMovie[] }>(
      "/discover/movie",
      {
        sort_by: sortBy,
        with_genres: tmdbGenreIdFromName(filters.genre) ?? "",
        "primary_release_date.gte": filters.yearFrom
          ? `${filters.yearFrom}-01-01`
          : "",
        "primary_release_date.lte": filters.yearTo
          ? `${filters.yearTo}-12-31`
          : "",
        with_original_language:
          filters.language && filters.language !== "all"
            ? filters.language
            : "",
        "vote_count.gte": filters.sort === "rating" ? "200" : ""
      }
    );

    const mapped = (result?.results ?? []).map((movie) =>
      toMovieCardFromTmdb(movie)
    );
    if (mapped.length) {
      return applyDiscoveryFilters(mapped, filters).slice(0, 60);
    }
  }

  const fallback = await getMovies();
  return applyDiscoveryFilters(fallback, filters).slice(0, 60);
};

const fetchTmdbMovieById = async (
  tmdbId: number
): Promise<MovieCard | null> => {
  const movie = await tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`, {
    append_to_response: "videos,credits"
  });
  if (!movie) return null;
  const external = await tmdbFetch<{ imdb_id?: string | null }>(
    `/movie/${tmdbId}/external_ids`
  );
  return toMovieCardFromTmdb(movie, external?.imdb_id ?? null);
};

const fetchTmdbMovieByImdbId = async (
  imdbTitleId: string
): Promise<MovieCard | null> => {
  const found = await tmdbFetch<{ movie_results?: TmdbMovie[] }>(
    `/find/${imdbTitleId}`,
    {
      external_source: "imdb_id"
    }
  );
  const tmdbMovie = found?.movie_results?.[0];
  if (!tmdbMovie) return null;
  const detail = await tmdbFetch<TmdbMovie>(`/movie/${tmdbMovie.id}`, {
    append_to_response: "videos,credits"
  });
  return detail
    ? toMovieCardFromTmdb(detail, imdbTitleId)
    : toMovieCardFromTmdb(tmdbMovie, imdbTitleId);
};

const toMovieCard = (
  movie: Prisma.MovieGetPayload<{ include: typeof movieInclude }>
): MovieCard => ({
  id: movie.id,
  titleId: movie.titleId,
  mediaType: "movie",
  imdbTitleId: movie.titleId.startsWith("tt") ? movie.titleId : null,
  title: movie.title,
  synopsis: movie.synopsis,
  posterUrl: movie.posterUrl,
  backdropUrl: movie.backdropUrl,
  releaseYear: movie.releaseYear,
  durationMinutes: movie.durationMinutes,
  voteAverage: null,
  maturityRating: movie.maturityRating,
  trailerUrl: movie.trailerUrl,
  cast: [],
  playableUrl: movie.playableUrl,
  sourceProvider: "playimdb",
  genres: movie.genres.map((item) => item.genre.name)
});

const fetchTmdbCatalogMovies = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return [];
  const [trending, popular] = await Promise.all([
    tmdbFetch<{ results: TmdbMovie[] }>("/trending/movie/week"),
    tmdbFetch<{ results: TmdbMovie[] }>("/movie/popular")
  ]);
  const merged = [
    ...(trending?.results ?? []),
    ...(popular?.results ?? [])
  ].map((movie) => toMovieCardFromTmdb(movie));
  const catalog = dedupeByTitleId(merged).slice(0, 60);
  if (catalog.length) {
    tmdbCatalogCache = catalog;
    return catalog;
  }
  return tmdbCatalogCache;
};

export const getMovies = async (): Promise<MovieCard[]> => {
  const tmdbMovies = await fetchTmdbCatalogMovies();

  if (!isDbEnabled()) {
    return tmdbMovies.length ? tmdbMovies : mockMovies;
  }

  try {
    const dbMovies = await prisma.movie.findMany({
      where: { isActive: true },
      include: movieInclude,
      orderBy: { updatedAt: "desc" },
      take: 150
    });

    const mappedDb = dbMovies.map(toMovieCard);
    if (tmdbMovies.length) return dedupeByTitleId([...mappedDb, ...tmdbMovies]);
    if (mappedDb.length) return mappedDb;
    return mockMovies;
  } catch {
    return tmdbMovies.length ? tmdbMovies : mockMovies;
  }
};

export const searchMovies = async (
  query: string,
  filters: Omit<DiscoveryFilters, "query"> = {}
): Promise<MovieCard[]> => {
  const q = query.trim();
  if (!q) return getMovies();

  if (hasTmdb()) {
    const result = await tmdbFetch<{ results: TmdbMovie[] }>("/search/movie", {
      query: q
    });
    const movies = applyDiscoveryFilters(
      result?.results?.map((movie) => toMovieCardFromTmdb(movie)) ?? [],
      {
        query: q,
        ...filters
      }
    ).slice(0, 40);
    if (movies.length) return movies;
    const fallbackCatalog = await getMovies();
    return applyDiscoveryFilters(fallbackCatalog, {
      query: q,
      ...filters
    }).slice(0, 40);
  }

  try {
    const dbMovies = await prisma.movie.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { synopsis: { contains: q, mode: "insensitive" } }
        ]
      },
      include: movieInclude,
      take: 30
    });

    if (!dbMovies.length)
      return applyDiscoveryFilters(mockMovies, { query: q, ...filters }).slice(
        0,
        40
      );
    return applyDiscoveryFilters(dbMovies.map(toMovieCard), {
      query: q,
      ...filters
    });
  } catch {
    return applyDiscoveryFilters(mockMovies, { query: q, ...filters }).slice(
      0,
      40
    );
  }
};

export const getMovieByTitleId = async (
  titleId: string
): Promise<MovieCard | null> => {
  if (isDbEnabled()) {
    try {
      const movie = await prisma.movie.findUnique({
        where: { titleId },
        include: movieInclude
      });
      if (movie) return toMovieCard(movie);
    } catch {
      // Fall through to non-DB resolvers below.
    }
  }

  const localMovie = mockMovies.find((entry) => entry.titleId === titleId);
  if (localMovie) return localMovie;

  if (titleId.startsWith("tmdb-tv-")) {
    return null;
  }

  if (titleId.startsWith("tmdb-")) {
    const tmdbId = Number(titleId.replace("tmdb-", ""));
    if (Number.isFinite(tmdbId)) {
      const movie = await fetchTmdbMovieById(tmdbId);
      if (movie) return movie;
    }
  }

  if (titleId.startsWith("tt")) {
    const movie = await fetchTmdbMovieByImdbId(titleId);
    if (movie) return movie;
  }

  return null;
};

export const getSimilarMovies = async (
  tmdbId: number
): Promise<MovieCard[]> => {
  const result = await tmdbFetch<{ results: TmdbMovie[] }>(
    `/movie/${tmdbId}/similar`
  );
  return (result?.results ?? [])
    .slice(0, 18)
    .map((movie) => toMovieCardFromTmdb(movie));
};

export const getNowPlayingMovies = async (): Promise<MovieCard[]> => {
  if (!hasTmdb()) return tmdbNowPlayingCache;
  const result = await tmdbFetch<{ results: TmdbMovie[] }>(
    "/movie/now_playing"
  );
  const mapped = (result?.results ?? [])
    .slice(0, 24)
    .map((movie) => toMovieCardFromTmdb(movie));
  if (mapped.length) {
    tmdbNowPlayingCache = mapped;
    return mapped;
  }
  return tmdbNowPlayingCache;
};

export const getFeaturedRails = async (): Promise<FeaturedRailView[]> => {
  if (hasTmdb()) {
    const [trending, popular, topRated] = await Promise.all([
      tmdbFetch<{ results: TmdbMovie[] }>("/trending/movie/week"),
      tmdbFetch<{ results: TmdbMovie[] }>("/movie/popular"),
      tmdbFetch<{ results: TmdbMovie[] }>("/movie/top_rated")
    ]);

    const tmdbRails: FeaturedRailView[] = [
      {
        slug: "trending-now",
        label: "Trending now",
        movies: (trending?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      },
      {
        slug: "popular-picks",
        label: "Popular picks",
        movies: (popular?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      },
      {
        slug: "top-rated",
        label: "Top rated",
        movies: (topRated?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      }
    ];

    const hasAnyMovie = tmdbRails.some((rail) => rail.movies.length > 0);
    if (hasAnyMovie) {
      tmdbRailsCache = tmdbRails;
      return tmdbRails;
    }
    if (tmdbRailsCache.length) return tmdbRailsCache;
  }

  const movies = await getMovies();
  const watchedGenres = ["Sci-Fi", "Thriller"];
  const recommendations = recommendMovies(movies, watchedGenres);

  return [
    {
      slug: "trending-now",
      label: "Trending now",
      movies: movies.slice(0, 12)
    },
    { slug: "for-you", label: "For you", movies: recommendations.slice(0, 12) },
    {
      slug: "new-arrivals",
      label: "New arrivals",
      movies: [...movies]
        .sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
        .slice(0, 12)
    }
  ];
};
