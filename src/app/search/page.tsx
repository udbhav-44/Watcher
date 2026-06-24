import Link from "next/link";
import type { Route } from "next";
import { Search as SearchIcon, X } from "lucide-react";

import { MovieCard } from "@/components/movies/movie-card";
import { RecordSearch } from "@/components/profile/record-search";
import { RecentSearches } from "@/components/profile/recent-searches";
import { SearchAutocomplete } from "@/components/movies/search-autocomplete";
import { EmptyState } from "@/components/ui/empty-state";
import { searchMovies } from "@/lib/data/movies";
import { searchTv } from "@/lib/data/tv";
import { applyDiscoveryFilters } from "@/lib/data/tmdb";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Scope = "all" | "movie" | "tv";
type Sort = "popularity" | "release_date" | "rating";

type SearchParams = {
  q?: string;
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: Sort;
  language?: string;
  type?: Scope;
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
];

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
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

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" }
];

function buildHref(
  params: SearchParams,
  overrides: Partial<SearchParams>
): Route {
  const next = new URLSearchParams();
  const merged: SearchParams = { ...params, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "") continue;
    next.set(key, value);
  }
  const qs = next.toString();
  return (qs ? `/search?${qs}` : "/search") as Route;
}

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

  const scope: Scope = searchParams.type ?? "all";
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

  const activeEra = ERA_PRESETS.find((era) => {
    if (era.id === "any") {
      return !searchParams.yearFrom && !searchParams.yearTo;
    }
    return (
      (era.yearFrom ?? undefined) === (searchParams.yearFrom ?? undefined) &&
      (era.yearTo ?? undefined) === (searchParams.yearTo ?? undefined)
    );
  });
  const activeSort = searchParams.sort ?? "popularity";
  const hasFilters = Boolean(
    searchParams.genre ||
      searchParams.yearFrom ||
      searchParams.yearTo ||
      searchParams.sort
  );

  return (
    <div className="space-y-8">
      <RecordSearch query={query} />

      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">Search</h1>
        <SearchAutocomplete initialQuery={query} />
        <RecentSearches />
      </div>

      {query ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ScopeFilter scope={scope} searchParams={searchParams} />
          </div>

          <FilterRow label="Genre">
            <Chip
              href={buildHref(searchParams, { genre: undefined })}
              active={!searchParams.genre}
            >
              Any
            </Chip>
            {QUICK_GENRES.map((g) => (
              <Chip
                key={g}
                href={buildHref(searchParams, { genre: g })}
                active={searchParams.genre === g}
              >
                {g}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Era">
            {ERA_PRESETS.map((era) => (
              <Chip
                key={era.id}
                href={buildHref(searchParams, {
                  yearFrom: era.yearFrom,
                  yearTo: era.yearTo
                })}
                active={activeEra?.id === era.id}
              >
                {era.label}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Sort">
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                href={buildHref(searchParams, { sort: option.value })}
                active={activeSort === option.value}
              >
                {option.label}
              </Chip>
            ))}
          </FilterRow>

          {hasFilters && (
            <div>
              <Link
                href={buildHref({ q: query, type: scope }, {})}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg"
              >
                <X className="h-3 w-3" />
                Clear filters
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <p className="text-sm text-fg-muted tabular-nums">
        {query
          ? `${results.length} ${results.length === 1 ? "result" : "results"}`
          : "Type to search the catalog"}
      </p>

      {query && results.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" />}
          title={`No results for "${query}"`}
          description="Try a different genre, broaden the era, or check the spelling."
          action={
            <Link
              href={buildHref({ q: query, type: scope }, {})}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
            >
              Clear filters
            </Link>
          }
        />
      ) : results.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
        >
          {results.map((entry) => (
            <MovieCard key={entry.id} movie={entry} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const ScopeFilter = ({
  scope,
  searchParams
}: {
  scope: Scope;
  searchParams: SearchParams;
}): JSX.Element => (
  <div
    role="tablist"
    aria-label="Filter by media type"
    className="inline-flex items-center rounded-full border border-border bg-fg/[0.04] p-1"
  >
    {SCOPES.map((entry) => {
      const isActive = scope === entry.value;
      return (
        <Link
          key={entry.value}
          href={buildHref(searchParams, { type: entry.value })}
          role="tab"
          aria-selected={isActive}
          className={
            isActive
              ? "rounded-full bg-fg/[0.1] px-3 py-1 text-xs text-fg"
              : "rounded-full px-3 py-1 text-xs text-fg-muted transition hover:bg-fg/[0.06] hover:text-fg"
          }
        >
          {entry.label}
        </Link>
      );
    })}
  </div>
);

const FilterRow = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
    <span className="w-12 shrink-0 text-[10px] tracking-[0.16em] text-fg-faint uppercase">
      {label}
    </span>
    <div className="-mx-1 flex flex-1 flex-wrap gap-1.5 overflow-x-auto px-1 py-0.5">
      {children}
    </div>
  </div>
);

const Chip = ({
  href,
  active,
  children
}: {
  href: Route;
  active?: boolean;
  children: React.ReactNode;
}): JSX.Element => (
  <Link
    href={href}
    aria-pressed={active}
    className={
      active
        ? "shrink-0 rounded-full border border-accent/50 bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition"
        : "shrink-0 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
    }
  >
    {children}
  </Link>
);
