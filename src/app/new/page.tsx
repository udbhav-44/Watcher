import { MovieRail } from "@/components/movies/movie-rail";
import { getNowPlayingMovies } from "@/lib/data/movies";
import { getOnTheAirTv } from "@/lib/data/tv";

export const revalidate = 1800;

export default async function NewArrivalsPage(): Promise<JSX.Element> {
  const [nowPlaying, onTheAir] = await Promise.all([
    getNowPlayingMovies(),
    getOnTheAirTv()
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">New arrivals</h1>
        <p className="text-sm text-white/62">
          Latest movies in theaters and TV series currently airing.
        </p>
      </div>
      <MovieRail title="In theaters now" movies={nowPlaying} />
      <MovieRail title="On the air" movies={onTheAir} />
    </div>
  );
}
