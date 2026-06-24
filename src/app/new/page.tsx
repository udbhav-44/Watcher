import { MovieRail } from "@/components/movies/movie-rail";
import { getNowPlayingMovies } from "@/lib/data/movies";
import { getOnTheAirTv } from "@/lib/data/tv";

export const dynamic = "force-dynamic";

export default async function NewArrivalsPage(): Promise<JSX.Element> {
  const [nowPlaying, onTheAir] = await Promise.all([
    getNowPlayingMovies(),
    getOnTheAirTv()
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          What&apos;s fresh
        </p>
        <h1 className="text-3xl font-semibold text-fg">New arrivals</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          The latest movies in theaters and TV series currently airing. Updated
          every 30 minutes.
        </p>
      </div>
      {nowPlaying.length > 0 && (
        <MovieRail title="In theaters now" movies={nowPlaying} />
      )}
      {onTheAir.length > 0 && (
        <MovieRail title="On the air" movies={onTheAir} />
      )}
    </div>
  );
}
