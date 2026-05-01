import { env } from "@/lib/config/env";
import { tvTitleIdFromTmdb, movieTitleIdFromTmdb } from "@/lib/catalog/titleId";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import type { CastMember, MovieCard, TvSeasonSummary } from "@/lib/types";

export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const hasTmdb = (): boolean => Boolean(env.TMDB_API_KEY);

export type TmdbMovie = {
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
    cast?: Array<{
      name: string;
      character?: string;
      profile_path?: string | null;
    }>;
    crew?: Array<{ name: string; job: string }>;
  };
};

export type TmdbTvShow = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  last_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  adult?: boolean;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  original_language?: string;
  vote_average?: number;
  videos?: {
    results?: Array<{ key: string; site: string; type: string }>;
  };
  credits?: {
    cast?: Array<{
      name: string;
      character?: string;
      profile_path?: string | null;
    }>;
    crew?: Array<{ name: string; job: string }>;
  };
  external_ids?: { imdb_id?: string | null };
  seasons?: Array<{
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string | null;
    episode_count: number;
  }>;
};

export type TmdbEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  vote_average?: number;
};

export type DiscoveryFilters = {
  query?: string;
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: string;
  sort?: "popularity" | "release_date" | "rating";
};

export const movieGenreMap: Record<number, string> = {
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

export const tvGenreMap: Record<number, string> = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western"
};

export const tmdbFetch = async <T>(
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

export const toImageUrl = (
  path: string | null | undefined,
  size: "w185" | "w300" | "w500" | "w780" | "original" = "w500"
): string | null => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);

export const releaseYearFromDate = (date?: string | null): number | null => {
  if (!date) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : null;
};

export const dedupeByTitleId = (movies: MovieCard[]): MovieCard[] => {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    if (seen.has(movie.titleId)) return false;
    seen.add(movie.titleId);
    return true;
  });
};

const movieGenresFromTmdb = (movie: TmdbMovie): string[] => {
  if (movie.genres?.length) return movie.genres.map((entry) => entry.name);
  if (!movie.genre_ids?.length) return ["Movie"];
  return movie.genre_ids.map((id) => movieGenreMap[id] ?? "Movie");
};

const tvGenresFromTmdb = (show: TmdbTvShow): string[] => {
  if (show.genres?.length) return show.genres.map((entry) => entry.name);
  if (!show.genre_ids?.length) return ["TV"];
  return show.genre_ids.map((id) => tvGenreMap[id] ?? "TV");
};

const trailerFromVideos = (videos?: TmdbMovie["videos"]): string | null => {
  const trailer = (videos?.results ?? []).find(
    (video) => video.site === "YouTube" && video.type === "Trailer"
  );
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

const castFromCredits = (
  credits?: TmdbMovie["credits"]
): { names: string[]; details: CastMember[] } => {
  const cast = (credits?.cast ?? []).slice(0, 12);
  return {
    names: cast.map((entry) => entry.name).slice(0, 6),
    details: cast.map((entry) => ({
      name: entry.name,
      character: entry.character ?? null,
      profileUrl: toImageUrl(entry.profile_path ?? null, "w185")
    }))
  };
};

const directorFromCrew = (credits?: TmdbMovie["credits"]): string | null => {
  return (
    credits?.crew?.find((member) => member.job === "Director")?.name ?? null
  );
};

export const toMovieCardFromTmdb = (
  movie: TmdbMovie,
  imdbTitleId?: string | null
): MovieCard => {
  const cast = castFromCredits(movie.credits);
  return {
    id: `tmdb-${movie.id}`,
    titleId: imdbTitleId ?? movieTitleIdFromTmdb(movie.id),
    mediaType: "movie",
    tmdbId: movie.id,
    imdbTitleId: imdbTitleId ?? null,
    title: movie.title,
    synopsis: movie.overview,
    posterUrl: toImageUrl(movie.poster_path, "w500"),
    backdropUrl: toImageUrl(movie.backdrop_path, "w780"),
    releaseYear: releaseYearFromDate(movie.release_date),
    durationMinutes: movie.runtime ?? null,
    voteAverage: movie.vote_average ?? null,
    maturityRating: movie.adult ? "A" : "U/A 13+",
    trailerUrl: trailerFromVideos(movie.videos),
    cast: cast.names,
    castDetails: cast.details,
    director: directorFromCrew(movie.credits),
    playableUrl: imdbTitleId
      ? toPlayableUrl(imdbTitleId, undefined, "playimdb")
      : `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${movie.id}`,
    sourceProvider: imdbTitleId ? "playimdb" : "vidking",
    genres: movieGenresFromTmdb(movie)
  };
};

export const toTvCardFromTmdb = (
  show: TmdbTvShow,
  imdbTitleId?: string | null
): MovieCard => {
  const cast = castFromCredits(show.credits);
  return {
    id: `tmdb-tv-${show.id}`,
    titleId: tvTitleIdFromTmdb(show.id),
    mediaType: "tv",
    tmdbId: show.id,
    imdbTitleId: imdbTitleId ?? show.external_ids?.imdb_id ?? null,
    title: show.name,
    synopsis: show.overview,
    posterUrl: toImageUrl(show.poster_path, "w500"),
    backdropUrl: toImageUrl(show.backdrop_path, "w780"),
    releaseYear: releaseYearFromDate(show.first_air_date),
    durationMinutes: show.episode_run_time?.[0] ?? null,
    voteAverage: show.vote_average ?? null,
    maturityRating: show.adult ? "A" : "U/A 13+",
    trailerUrl: trailerFromVideos(show.videos),
    cast: cast.names,
    castDetails: cast.details,
    director: directorFromCrew(show.credits),
    numberOfSeasons: show.number_of_seasons ?? null,
    numberOfEpisodes: show.number_of_episodes ?? null,
    playableUrl: `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/tv/${show.id}/1/1`,
    sourceProvider: "vidking",
    genres: tvGenresFromTmdb(show)
  };
};

export const toTvSeasonsSummary = (
  seasons: TmdbTvShow["seasons"]
): TvSeasonSummary[] => {
  return (seasons ?? [])
    .filter((season) => season.season_number >= 1)
    .map((season) => ({
      seasonNumber: season.season_number,
      name: season.name,
      overview: season.overview ?? null,
      posterUrl: toImageUrl(season.poster_path, "w300"),
      airDate: season.air_date ?? null,
      episodeCount: season.episode_count
    }));
};

export const applyDiscoveryFilters = (
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
        !movie.genres.some(
          (genre) => genre.toLowerCase() === filters.genre?.toLowerCase()
        )
      )
        return false;
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
      if (filters.sort === "popularity")
        return (b.voteAverage ?? 0) - (a.voteAverage ?? 0);
      return a.title.localeCompare(b.title);
    });
};
