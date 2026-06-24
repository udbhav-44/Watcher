import { MovieCard } from "@/components/movies/movie-card";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  title: string;
  movies: MovieCardType[];
};

export const MovieRail = ({ title, movies }: Props): JSX.Element => {
  const railId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="space-y-4" aria-labelledby={railId}>
      <h2 id={railId} className="text-lg font-medium tracking-tight text-fg md:text-xl">
        {title}
      </h2>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};
