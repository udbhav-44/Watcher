import { MovieRail } from "@/components/movies/movie-rail";
import { getFeaturedRails } from "@/lib/data/movies";

export default async function BrowsePage(): Promise<JSX.Element> {
  const rails = await getFeaturedRails();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Browse</h1>
      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
