import Link from "next/link";
import type { Route } from "next";
import { X } from "lucide-react";

type Sort = "popularity" | "release_date" | "rating";

export type CatalogScope = "movie" | "tv";

type FilterShape = {
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: Sort;
};

type Props = {
  base: Route;
  scope: CatalogScope;
  filters: FilterShape;
};

const MOVIE_GENRES = [
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

const TV_GENRES = [
  "Drama",
  "Comedy",
  "Action & Adventure",
  "Sci-Fi & Fantasy",
  "Crime",
  "Mystery",
  "Documentary",
  "Animation",
  "Family",
  "Reality"
];

const ERA_PRESETS: Array<{
  id: string;
  label: string;
  yearFrom?: string;
  yearTo?: string;
}> = [
  { id: "any", label: "Any era" },
  {
    id: "now",
    label: "This year",
    yearFrom: String(new Date().getFullYear())
  },
  {
    id: "recent",
    label: "Last 5 years",
    yearFrom: String(new Date().getFullYear() - 5)
  },
  {
    id: "decade",
    label: "Last decade",
    yearFrom: String(new Date().getFullYear() - 10)
  },
  { id: "2000s", label: "2000s", yearFrom: "2000", yearTo: "2009" },
  { id: "classics", label: "Classics", yearTo: "1999" }
];

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: "popularity", label: "Popular" },
  { value: "release_date", label: "Latest" },
  { value: "rating", label: "Top rated" }
];

function buildHref(
  base: Route,
  current: FilterShape,
  overrides: Partial<FilterShape>
): Route {
  const next = new URLSearchParams();
  const merged = { ...current, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "") continue;
    next.set(key, value);
  }
  const qs = next.toString();
  return (qs ? `${base}?${qs}` : base) as Route;
}

export const CatalogFilterChips = ({
  base,
  scope,
  filters
}: Props): JSX.Element => {
  const genres = scope === "tv" ? TV_GENRES : MOVIE_GENRES;
  const activeEra = ERA_PRESETS.find((era) => {
    if (era.id === "any") return !filters.yearFrom && !filters.yearTo;
    return (
      (era.yearFrom ?? undefined) === (filters.yearFrom ?? undefined) &&
      (era.yearTo ?? undefined) === (filters.yearTo ?? undefined)
    );
  });
  const activeSort = filters.sort ?? "popularity";
  const hasFilters = Boolean(
    filters.genre || filters.yearFrom || filters.yearTo || filters.sort
  );

  return (
    <div className="space-y-3">
      <FilterRow label="Genre">
        <Chip
          href={buildHref(base, filters, { genre: undefined })}
          active={!filters.genre}
        >
          Any
        </Chip>
        {genres.map((g) => (
          <Chip
            key={g}
            href={buildHref(base, filters, { genre: g })}
            active={filters.genre === g}
          >
            {g}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="Era">
        {ERA_PRESETS.map((era) => (
          <Chip
            key={era.id}
            href={buildHref(base, filters, {
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
            href={buildHref(base, filters, { sort: option.value })}
            active={activeSort === option.value}
          >
            {option.label}
          </Chip>
        ))}
      </FilterRow>

      {hasFilters && (
        <div>
          <Link
            href={base}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
};

const FilterRow = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element => (
  <div className="flex items-center gap-3">
    <span className="w-14 shrink-0 text-xs tracking-wide text-fg-faint uppercase">
      {label}
    </span>
    <div className="-mx-2 flex flex-1 flex-wrap gap-2 overflow-x-auto px-2 py-0.5">
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
