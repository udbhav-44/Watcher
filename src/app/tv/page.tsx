import { DiscoveryFilters } from "@/components/movies/discovery-filters";
import { MovieRail } from "@/components/movies/movie-rail";
import { discoverTv, getTvFeaturedRails } from "@/lib/data/tv";

type Props = {
  searchParams: {
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: "popularity" | "release_date" | "rating";
    language?: string;
  };
};

export default async function TvIndexPage({
  searchParams
}: Props): Promise<JSX.Element> {
  const [rails, filtered] = await Promise.all([
    getTvFeaturedRails(),
    discoverTv({
      genre: searchParams.genre,
      yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
      yearTo: Number(searchParams.yearTo ?? "") || undefined,
      sort: searchParams.sort,
      language: searchParams.language
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">TV shows</h1>
        <p className="text-sm text-white/62">
          Series, mini-series, and seasons. Filter by genre, year, and rating.
        </p>
      </div>
      <DiscoveryFilters
        action="/tv"
        genre={searchParams.genre}
        yearFrom={searchParams.yearFrom}
        yearTo={searchParams.yearTo}
        sort={searchParams.sort}
        language={searchParams.language}
        scope="tv"
        submitLabel="Apply filters"
      />
      <MovieRail title="Filtered results" movies={filtered.slice(0, 18)} />
      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
