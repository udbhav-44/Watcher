import Link from "next/link";

import { CatalogFilterChips } from "@/components/movies/catalog-filter-chips";
import { MovieCard } from "@/components/movies/movie-card";
import { MovieRail } from "@/components/movies/movie-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { discoverMovies, getFeaturedRails } from "@/lib/data/movies";

const QUICK_GENRES = [
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Animation",
  "Horror"
];

type Props = {
  searchParams: {
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: "popularity" | "release_date" | "rating";
  };
};

const genreSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

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
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          Catalog
        </p>
        <h1 className="text-3xl font-semibold text-fg">Movies</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Browse by genre, era, and sort. Tap a chip to apply instantly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_GENRES.map((entry) => (
          <Link
            key={entry}
            href={`/genre/${genreSlug(entry)}`}
            className="rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
          >
            {entry}
          </Link>
        ))}
      </div>

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
