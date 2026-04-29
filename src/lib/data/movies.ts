import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { mockMovies } from "@/lib/data/mockMovies";
import { recommendMovies } from "@/lib/reco/engine";
import type { FeaturedRailView, MovieCard } from "@/lib/types";

const movieInclude = {
  genres: { include: { genre: true } }
} satisfies Prisma.MovieInclude;

const toMovieCard = (movie: Prisma.MovieGetPayload<{ include: typeof movieInclude }>): MovieCard => ({
  id: movie.id,
  titleId: movie.titleId,
  title: movie.title,
  synopsis: movie.synopsis,
  posterUrl: movie.posterUrl,
  backdropUrl: movie.backdropUrl,
  releaseYear: movie.releaseYear,
  durationMinutes: movie.durationMinutes,
  maturityRating: movie.maturityRating,
  playableUrl: movie.playableUrl,
  genres: movie.genres.map((item) => item.genre.name)
});

export const getMovies = async (): Promise<MovieCard[]> => {
  if (!process.env.DATABASE_URL) return mockMovies;
  try {
    const dbMovies = await prisma.movie.findMany({
      where: { isActive: true },
      include: movieInclude,
      orderBy: { updatedAt: "desc" },
      take: 150
    });

    if (!dbMovies.length) return mockMovies;
    return dbMovies.map(toMovieCard);
  } catch {
    return mockMovies;
  }
};

export const searchMovies = async (query: string): Promise<MovieCard[]> => {
  const q = query.trim();
  if (!q) return getMovies();
  if (!process.env.DATABASE_URL) return mockMovies.filter((movie) => movie.title.toLowerCase().includes(q.toLowerCase()));

  try {
    const dbMovies = await prisma.movie.findMany({
      where: {
        isActive: true,
        OR: [{ title: { contains: q, mode: "insensitive" } }, { synopsis: { contains: q, mode: "insensitive" } }]
      },
      include: movieInclude,
      take: 30
    });

    if (!dbMovies.length) return mockMovies.filter((movie) => movie.title.toLowerCase().includes(q.toLowerCase()));
    return dbMovies.map(toMovieCard);
  } catch {
    return mockMovies.filter((movie) => movie.title.toLowerCase().includes(q.toLowerCase()));
  }
};

export const getMovieByTitleId = async (titleId: string): Promise<MovieCard | null> => {
  if (!process.env.DATABASE_URL) return mockMovies.find((entry) => entry.titleId === titleId) ?? null;
  try {
    const movie = await prisma.movie.findUnique({
      where: { titleId },
      include: movieInclude
    });
    return movie ? toMovieCard(movie) : mockMovies.find((entry) => entry.titleId === titleId) ?? null;
  } catch {
    return mockMovies.find((entry) => entry.titleId === titleId) ?? null;
  }
};

export const getFeaturedRails = async (): Promise<FeaturedRailView[]> => {
  const movies = await getMovies();
  const watchedGenres = ["Sci-Fi", "Thriller"];
  const recommendations = recommendMovies(movies, watchedGenres);

  return [
    { slug: "trending-now", label: "Trending Now", movies: movies.slice(0, 12) },
    { slug: "for-you", label: "For You", movies: recommendations.slice(0, 12) },
    { slug: "new-arrivals", label: "New Arrivals", movies: [...movies].sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0)).slice(0, 12) }
  ];
};
