import { MovieCard } from "@/components/movies/movie-card";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  title: string;
  movies: MovieCardType[];
};

export const MovieRail = ({ title, movies }: Props): JSX.Element => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  </section>
);
