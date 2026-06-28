import { MovieRail } from "@/components/movies/movie-rail";
import { getCachedOnTheAirTv, getCachedTvFeaturedRails } from "@/lib/data/cached-catalog";

export const TvRailsSection = async (): Promise<JSX.Element> => {
  const [tvRails, onTheAir] = await Promise.all([
    getCachedTvFeaturedRails(),
    getCachedOnTheAirTv()
  ]);

  return (
    <div className="space-y-10">
      {onTheAir.length > 0 && (
        <MovieRail title="On the air" movies={onTheAir.slice(0, 12)} />
      )}
      {tvRails.slice(0, 2).map((rail) => (
        <MovieRail
          key={`tv-${rail.slug}`}
          title={rail.label}
          movies={rail.movies}
        />
      ))}
    </div>
  );
};
