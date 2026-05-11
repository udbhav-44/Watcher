import { MovieRail } from "@/components/movies/movie-rail";
import { getFeaturedRails, getNowPlayingMovies } from "@/lib/data/movies";

export const MovieRailsSection = async (): Promise<JSX.Element> => {
  const [movieRails, nowPlaying] = await Promise.all([
    getFeaturedRails(),
    getNowPlayingMovies()
  ]);

  return (
    <div className="space-y-10">
      {nowPlaying.length > 0 && (
        <MovieRail title="In theaters now" movies={nowPlaying} />
      )}
      {movieRails.map((rail) => (
        <MovieRail
          key={`movie-${rail.slug}`}
          title={rail.label}
          movies={rail.movies}
        />
      ))}
    </div>
  );
};
