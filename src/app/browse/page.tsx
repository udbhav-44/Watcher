import { CatalogFilterChips } from "@/components/movies/catalog-filter-chips";
import { MovieCard } from "@/components/movies/movie-card";
import { MovieRail } from "@/components/movies/movie-rail";
import { EmptyState } from "@/components/ui/empty-state";
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
  const [rails, filtered] = await Promise.all([
    getFeaturedRails(),
    discoverMovies({
      genre: searchParams.genre,
      yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
      yearTo: Number(searchParams.yearTo ?? "") || undefined,
      sort: searchParams.sort
    })
  ]);

  const hasFilters = Boolean(
    searchParams.genre ||
      searchParams.yearFrom ||
      searchParams.yearTo ||
      searchParams.sort
  );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Movies</h1>
      </header>

      <CatalogFilterChips base="/browse" scope="movie" filters={searchParams} />

      {hasFilters ? (
        <>
          <p className="text-sm text-fg-muted tabular-nums">
            {filtered.length}{" "}
            {filtered.length === 1 ? "result" : "results"}
          </p>
          {filtered.length > 0 ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))"
              }}
            >
              {filtered.slice(0, 60).map((entry) => (
                <MovieCard key={entry.id} movie={entry} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches"
              description="Try widening the era, choosing a different genre, or clearing filters."
            />
          )}
        </>
      ) : (
        <div className="space-y-10">
          {filtered.length > 0 && (
            <MovieRail title="Trending now" movies={filtered.slice(0, 18)} />
          )}
          {rails.map((rail) => (
            <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
          ))}
        </div>
      )}
    </div>
  );
}
