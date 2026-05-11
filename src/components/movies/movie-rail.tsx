import { MovieCard } from "@/components/movies/movie-card";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  title: string;
  movies: MovieCardType[];
};

export const MovieRail = ({ title, movies }: Props): JSX.Element => {
  const railId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="space-y-3" aria-labelledby={railId}>
      <div className="flex items-end justify-between gap-3">
        <h2 id={railId} className="text-xl font-medium text-fg">
          {title}
        </h2>
        <span className="text-xs text-fg-faint tabular-nums">
          {movies.length} titles
        </span>
      </div>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};
