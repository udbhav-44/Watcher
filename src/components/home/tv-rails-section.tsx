import { MovieRail } from "@/components/movies/movie-rail";
import { getOnTheAirTv, getTvFeaturedRails } from "@/lib/data/tv";

export const TvRailsSection = async (): Promise<JSX.Element> => {
  const [tvRails, onTheAir] = await Promise.all([
    getTvFeaturedRails(),
    getOnTheAirTv()
  ]);

  return (
    <div className="space-y-10">
      {onTheAir.length > 0 && (
        <MovieRail title="On the air" movies={onTheAir} />
      )}
      {tvRails.map((rail) => (
        <MovieRail
          key={`tv-${rail.slug}`}
          title={rail.label}
          movies={rail.movies}
        />
      ))}
    </div>
  );
};
