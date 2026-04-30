export type MovieCard = {
  id: string;
  titleId: string;
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
  playableUrl: string;
  sourceProvider?: "playimdb" | "vidking";
  genres: string[];
};

export type FeaturedRailView = {
  slug: string;
  label: string;
  movies: MovieCard[];
};
