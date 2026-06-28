import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

import { MovieCard } from "@/components/movies/movie-card";
import { RecordSearch } from "@/components/profile/record-search";
import { RecentSearches } from "@/components/profile/recent-searches";
import { SearchAutocomplete } from "@/components/movies/search-autocomplete";
import { SearchFilterPanel } from "@/components/search/search-filter-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { searchMovies } from "@/lib/data/movies";
import { searchTv } from "@/lib/data/tv";
import { applyDiscoveryFilters } from "@/lib/data/tmdb";
import {
  buildSearchHref,
  type SearchScope,
  type SearchSort
} from "@/lib/search/build-href";
import type { MovieCard as MovieCardType } from "@/lib/types";

type SearchParams = {
  q?: string;
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: SearchSort;
  language?: string;
  type?: SearchScope;
};

type Props = {
  searchParams: SearchParams;
};

const QUICK_GENRES = [
  "Action",
  "Drama",
  "Comedy",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Animation",
  "Horror",
  "Documentary",
  "Crime"
] as const;

const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: "popularity", label: "Popular" },
  { value: "release_date", label: "Latest" },
  { value: "rating", label: "Top rated" }
];

const ERA_PRESETS: Array<{ id: string; label: string; yearFrom?: string; yearTo?: string }> = [
  { id: "any", label: "Any era" },
  { id: "now", label: "This year", yearFrom: String(new Date().getFullYear()) },
  { id: "recent", label: "Last 5 years", yearFrom: String(new Date().getFullYear() - 5) },
  { id: "decade", label: "Last decade", yearFrom: String(new Date().getFullYear() - 10) },
  { id: "2000s", label: "2000s", yearFrom: "2000", yearTo: "2009" },
  { id: "classics", label: "Classics", yearTo: "1999" }
];

const SCOPES: Array<{ value: SearchScope; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" }
];

export default async function SearchPage({
  searchParams
}: Props): Promise<JSX.Element> {
  const query = searchParams.q ?? "";
  const filterShape = {
    genre: searchParams.genre,
    yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
    yearTo: Number(searchParams.yearTo ?? "") || undefined,
    sort: searchParams.sort,
    language: searchParams.language
  };

  const scope: SearchScope = searchParams.type ?? "all";
  let results: MovieCardType[] = [];

  if (query) {
    if (scope === "tv") {
      results = await searchTv(query, filterShape);
    } else if (scope === "movie") {
      results = await searchMovies(query, filterShape);
    } else {
      const [movies, tv] = await Promise.all([
        searchMovies(query, filterShape),
        searchTv(query, filterShape)
      ]);
      results = applyDiscoveryFilters(
        [...movies.slice(0, 30), ...tv.slice(0, 30)],
        { query, ...filterShape }
      );
    }
  }

  const activeEra =
    ERA_PRESETS.find((era) => {
      if (era.id === "any") {
        return !searchParams.yearFrom && !searchParams.yearTo;
      }
      return (
        (era.yearFrom ?? undefined) === (searchParams.yearFrom ?? undefined) &&
        (era.yearTo ?? undefined) === (searchParams.yearTo ?? undefined)
      );
    }) ?? ERA_PRESETS[0];
  const activeSort = searchParams.sort ?? "popularity";
  const hasFilters = Boolean(
    searchParams.genre ||
      searchParams.yearFrom ||
      searchParams.yearTo ||
      (searchParams.sort && searchParams.sort !== "popularity")
  );

  return (
    <div className="space-y-8">
      <RecordSearch query={query} />

      {!query ? (
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-8 text-center md:py-14">
          <div className="space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-fg/[0.04] text-fg-muted">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-fg text-balance">
              Find something to watch
            </h1>
            <p className="text-sm text-fg-muted text-pretty">
              Search movies and TV by title, genre, or keyword. Press{" "}
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-fg-faint">
                ⌘K
              </kbd>{" "}
              from anywhere.
            </p>
          </div>
          <div className="w-full">
            <SearchAutocomplete />
          </div>
          <div className="w-full text-left">
            <RecentSearches />
          </div>
        </section>
      ) : (
        <>
          <header className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] tracking-[0.16em] text-fg-faint uppercase">
                Search results
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                &ldquo;{query}&rdquo;
              </h1>
              <p className="text-sm text-fg-muted tabular-nums">
                {results.length} {results.length === 1 ? "result" : "results"}
                {scope !== "all" && (
                  <span>
                    {" "}
                    in {scope === "movie" ? "Movies" : "TV"}
                  </span>
                )}
              </p>
            </div>
            <SearchAutocomplete initialQuery={query} />
          </header>

          <SearchFilterPanel
            searchParams={searchParams}
            scope={scope}
            activeEraId={activeEra.id}
            activeSort={activeSort}
            hasFilters={hasFilters}
            quickGenres={QUICK_GENRES}
            eraPresets={ERA_PRESETS}
            sortOptions={SORT_OPTIONS}
            scopes={SCOPES}
          />

          {results.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-5 w-5" />}
              title={`No results for "${query}"`}
              description="Try a different genre, broaden the era, or check the spelling."
              action={
                <Link
                  href={buildSearchHref({ q: query, type: scope }, {})}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
                >
                  Clear filters
                </Link>
              }
            />
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
            >
              {results.map((entry) => (
                <MovieCard key={entry.id} movie={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
