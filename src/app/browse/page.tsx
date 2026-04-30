import { DiscoveryFilters } from "@/components/movies/discovery-filters";
import { MovieRail } from "@/components/movies/movie-rail";
import { discoverMovies, getFeaturedRails } from "@/lib/data/movies";

type Props = {
  searchParams: {
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: "popularity" | "release_date" | "rating";
  };
};

export default async function BrowsePage({
  searchParams
}: Props): Promise<JSX.Element> {
  const rails = await getFeaturedRails();
  const filtered = await discoverMovies({
    genre: searchParams.genre,
    yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
    yearTo: Number(searchParams.yearTo ?? "") || undefined,
    sort: searchParams.sort
  });
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Browse the library</h1>
        <p className="text-sm text-white/62">
          Filter by genre, year, and rating.
        </p>
      </div>
      <DiscoveryFilters
        action="/browse"
        genre={searchParams.genre}
        yearFrom={searchParams.yearFrom}
        yearTo={searchParams.yearTo}
        sort={searchParams.sort}
        submitLabel="Apply filters"
      />
      <MovieRail title="Results" movies={filtered.slice(0, 18)} />
      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
