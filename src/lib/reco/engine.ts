import type { MovieCard } from "@/lib/types";

const scoreMovie = (movie: MovieCard, watchedGenres: string[], releaseBoostYear = 2021): number => {
  const genreOverlap = movie.genres.filter((genre) => watchedGenres.includes(genre)).length;
  const freshnessBoost = (movie.releaseYear ?? 0) >= releaseBoostYear ? 1 : 0;
  return genreOverlap * 2 + freshnessBoost;
};

export const recommendMovies = (movies: MovieCard[], watchedGenres: string[]): MovieCard[] => {
  if (!watchedGenres.length) return movies.slice(0, 24);

  return [...movies]
    .map((movie) => ({ movie, score: scoreMovie(movie, watchedGenres) }))
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title))
    .map((entry) => entry.movie)
    .slice(0, 24);
};
