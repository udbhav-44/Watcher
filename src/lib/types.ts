export type MediaType = "movie" | "tv";

export type CastMember = {
  name: string;
  character?: string | null;
  profileUrl?: string | null;
};

export type MovieCard = {
  id: string;
  titleId: string;
  mediaType?: MediaType;
  tmdbId?: number | null;
  imdbTitleId?: string | null;
  title: string;
  synopsis?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseYear?: number | null;
  durationMinutes?: number | null;
  voteAverage?: number | null;
  maturityRating?: string | null;
  trailerUrl?: string | null;
  cast?: string[];
  castDetails?: CastMember[];
  director?: string | null;
  numberOfSeasons?: number | null;
  numberOfEpisodes?: number | null;
  playableUrl: string;
  sourceProvider?: "playimdb" | "vidking";
  genres: string[];
};

export type FeaturedRailView = {
  slug: string;
  label: string;
  movies: MovieCard[];
};

export type TvSeasonSummary = {
  seasonNumber: number;
  name: string;
  overview?: string | null;
  posterUrl?: string | null;
  airDate?: string | null;
  episodeCount: number;
};

export type TvEpisodeSummary = {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview?: string | null;
  airDate?: string | null;
  runtime?: number | null;
  stillUrl?: string | null;
  voteAverage?: number | null;
};

export type TvDetail = MovieCard & {
  mediaType: "tv";
  seasons: TvSeasonSummary[];
};
