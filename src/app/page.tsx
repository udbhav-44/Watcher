import { HeroRotation } from "@/components/movies/hero-rotation";
import { MovieRail } from "@/components/movies/movie-rail";
import { ContinueWatching } from "@/components/profile/continue-watching";
import { RecentSearches } from "@/components/profile/recent-searches";
import { PersonalizedRail } from "@/components/profile/personalized-rail";
import { UpNextRail } from "@/components/profile/up-next-rail";
import { getFeaturedRails, getNowPlayingMovies } from "@/lib/data/movies";
import { getOnTheAirTv, getTvFeaturedRails } from "@/lib/data/tv";
import { dedupeByTitleId } from "@/lib/data/tmdb";

export default async function HomePage(): Promise<JSX.Element> {
  const [movieRails, tvRails, nowPlaying, onTheAir] = await Promise.all([
    getFeaturedRails(),
    getTvFeaturedRails(),
    getNowPlayingMovies(),
    getOnTheAirTv()
  ]);

  const heroPool = dedupeByTitleId(
    [...(movieRails[0]?.movies ?? []), ...(tvRails[0]?.movies ?? [])]
      .filter((entry) => entry.backdropUrl || entry.posterUrl)
      .slice(0, 5)
  );

  return (
    <div className="space-y-10">
      <HeroRotation titles={heroPool} />
      <RecentSearches />
      <ContinueWatching />
      <UpNextRail />
      <PersonalizedRail />

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
}
