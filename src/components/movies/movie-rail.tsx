import { MovieCard } from "@/components/movies/movie-card";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  title: string;
  movies: MovieCardType[];
};

export const MovieRail = ({ title, movies }: Props): JSX.Element => (
  <section
    className="space-y-3"
    aria-labelledby={`rail-${title.replace(/\s+/g, "-").toLowerCase()}`}
  >
    <div className="flex items-center justify-between gap-3">
      <h2
        id={`rail-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="text-xl font-medium"
      >
        {title}
      </h2>
      <span className="text-xs text-white/45">{movies.length} titles</span>
    </div>
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  </section>
);
