import { Prisma } from "@prisma/client";

import { env } from "@/lib/config/env";
import { isDbEnabled, prisma } from "@/lib/db";
import { mockMovies } from "@/lib/data/mockMovies";
import { recommendMovies } from "@/lib/reco/engine";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import type { FeaturedRailView, MovieCard } from "@/lib/types";

const movieInclude = {
  genres: { include: { genre: true } }
} satisfies Prisma.MovieInclude;

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const hasTmdb = (): boolean => Boolean(env.TMDB_API_KEY);

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  runtime?: number;
  adult?: boolean;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  original_language?: string;
  vote_average?: number;
  videos?: {
    results?: Array<{ key: string; site: string; type: string }>;
  };
  credits?: {
    cast?: Array<{ name: string }>;
  };
};

export type DiscoveryFilters = {
  query?: string;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: string;
  sort?: "popularity" | "release_date" | "rating";
};

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

const tmdbSlug = (tmdbId: number): string => `tmdb-${tmdbId}`;

const parseTmdbSlug = (titleId: string): number | null => {
  if (!titleId.startsWith("tmdb-")) return null;
  const value = Number(titleId.replace("tmdb-", ""));
  return Number.isFinite(value) ? value : null;
};

const tmdbFetch = async <T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T | null> => {
  if (!env.TMDB_API_KEY) return null;
  try {
    const url = new URL(`${TMDB_API_BASE}${path}`);
    url.searchParams.set("api_key", env.TMDB_API_KEY);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    const response = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const toImageUrl = (
  path: string | null,
  size: "w500" | "w780" = "w500"
): string | null => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);

const releaseYear = (releaseDate?: string): number | null => {
  if (!releaseDate) return null;
  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) ? year : null;
};

const genresFromTmdb = (movie: TmdbMovie): string[] => {
  if (movie.genres?.length) return movie.genres.map((entry) => entry.name);
  if (!movie.genre_ids?.length) return ["Movie"];
  return movie.genre_ids.map((id) => genreMap[id] ?? "Movie");
};

const trailerUrlFromTmdb = (movie: TmdbMovie): string | null => {
  const trailer = (movie.videos?.results ?? []).find(
    (video) => video.site === "YouTube" && video.type === "Trailer"
  );
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

const castFromTmdb = (movie: TmdbMovie): string[] => {
  return (movie.credits?.cast ?? []).slice(0, 6).map((entry) => entry.name);
};

const dedupeByTitleId = (movies: MovieCard[]): MovieCard[] => {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    if (seen.has(movie.titleId)) return false;
    seen.add(movie.titleId);
    return true;
  });
};

const toMovieCardFromTmdb = (
  movie: TmdbMovie,
  imdbTitleId?: string | null
): MovieCard => ({
  id: `tmdb-${movie.id}`,
  titleId: imdbTitleId ?? tmdbSlug(movie.id),
  tmdbId: movie.id,
  imdbTitleId: imdbTitleId ?? null,
  title: movie.title,
  synopsis: movie.overview,
  posterUrl: toImageUrl(movie.poster_path, "w500"),
  backdropUrl: toImageUrl(movie.backdrop_path, "w780"),
  releaseYear: releaseYear(movie.release_date),
  durationMinutes: movie.runtime ?? null,
  voteAverage: movie.vote_average ?? null,
  maturityRating: movie.adult ? "A" : "U/A 13+",
  trailerUrl: trailerUrlFromTmdb(movie),
  cast: castFromTmdb(movie),
  playableUrl: imdbTitleId
    ? toPlayableUrl(imdbTitleId, undefined, "playimdb")
    : `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${movie.id}`,
  sourceProvider: imdbTitleId ? "playimdb" : "vidking",
  genres: genresFromTmdb(movie)
});

const applyDiscoveryFilters = (
  movies: MovieCard[],
  filters: DiscoveryFilters
): MovieCard[] => {
  const query = (filters.query ?? "").trim().toLowerCase();
  return movies
    .filter((movie) => {
      if (query) {
        const haystack = `${movie.title} ${movie.synopsis ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (
        filters.genre &&
        filters.genre !== "all" &&
        !movie.genres.includes(filters.genre)
      )
        return false;
      if (filters.language && filters.language !== "all") {
        // TMDB locale is not retained in current MovieCard, filter skipped for DB/mock paths.
      }
      if (filters.yearFrom && (movie.releaseYear ?? 0) < filters.yearFrom)
        return false;
      if (filters.yearTo && (movie.releaseYear ?? 9999) > filters.yearTo)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "release_date")
        return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
      if (filters.sort === "rating")
        return (b.voteAverage ?? 0) - (a.voteAverage ?? 0);
      return a.title.localeCompare(b.title);
    });
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

    const tmdbGenreId = Object.entries(genreMap).find(
      ([, name]) => name === filters.genre
    )?.[0];
    const result = await tmdbFetch<{ results: TmdbMovie[] }>(
      "/discover/movie",
      {
        sort_by: sortBy,
        with_genres: tmdbGenreId ?? "",
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
        query: filters.query ?? ""
      }
    );

    const mapped = (result?.results ?? []).map((movie) =>
      toMovieCardFromTmdb(movie)
    );
    return applyDiscoveryFilters(mapped, filters).slice(0, 60);
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
  return dedupeByTitleId(merged).slice(0, 60);
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

  const tmdbId = parseTmdbSlug(titleId);
  if (tmdbId) {
    const movie = await fetchTmdbMovieById(tmdbId);
    if (movie) return movie;
  }

  if (titleId.startsWith("tt")) {
    const movie = await fetchTmdbMovieByImdbId(titleId);
    if (movie) return movie;
  }

  return null;
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
        label: "Trending Now",
        movies: (trending?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      },
      {
        slug: "popular-picks",
        label: "Popular Picks",
        movies: (popular?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      },
      {
        slug: "top-rated",
        label: "Top Rated",
        movies: (topRated?.results ?? [])
          .slice(0, 18)
          .map((movie) => toMovieCardFromTmdb(movie))
      }
    ];

    const hasAnyMovie = tmdbRails.some((rail) => rail.movies.length > 0);
    if (hasAnyMovie) {
      return tmdbRails;
    }
  }

  const movies = await getMovies();
  const watchedGenres = ["Sci-Fi", "Thriller"];
  const recommendations = recommendMovies(movies, watchedGenres);

  return [
    {
      slug: "trending-now",
      label: "Trending Now",
      movies: movies.slice(0, 12)
    },
    { slug: "for-you", label: "For You", movies: recommendations.slice(0, 12) },
    {
      slug: "new-arrivals",
      label: "New Arrivals",
      movies: [...movies]
        .sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0))
        .slice(0, 12)
    }
  ];
};
