export type MovieCard = {
  id: string;
  titleId: string;
  title: string;
  synopsis?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseYear?: number | null;
  durationMinutes?: number | null;
  maturityRating?: string | null;
  playableUrl: string;
  genres: string[];
};

export type FeaturedRailView = {
  slug: string;
  label: string;
  movies: MovieCard[];
};
