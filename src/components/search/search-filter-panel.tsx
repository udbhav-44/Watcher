"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

import {
  buildSearchHref,
  type SearchParams,
  type SearchScope,
  type SearchSort
} from "@/lib/search/build-href";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: SearchParams;
  scope: SearchScope;
  activeEraId: string;
  activeSort: SearchSort;
  hasFilters: boolean;
  quickGenres: readonly string[];
  eraPresets: ReadonlyArray<{
    id: string;
    label: string;
    yearFrom?: string;
    yearTo?: string;
  }>;
  sortOptions: ReadonlyArray<{ value: SearchSort; label: string }>;
  scopes: ReadonlyArray<{ value: SearchScope; label: string }>;
};

export const SearchFilterPanel = ({
  searchParams,
  scope,
  activeEraId,
  activeSort,
  hasFilters,
  quickGenres,
  eraPresets,
  sortOptions,
  scopes
}: Props): JSX.Element => {
  const [expanded, setExpanded] = useState(hasFilters);
  const activeFilterCount = [
    searchParams.genre,
    searchParams.yearFrom || searchParams.yearTo,
    searchParams.sort && searchParams.sort !== "popularity"
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Filter by media type"
          className="inline-flex items-center rounded-full border border-border bg-fg/[0.04] p-1"
        >
          {scopes.map((entry) => {
            const isActive = scope === entry.value;
            return (
              <Link
                key={entry.value}
                href={buildSearchHref(searchParams, { type: entry.value })}
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

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
            expanded || activeFilterCount > 0
              ? "border-accent/40 bg-accent-soft text-accent"
              : "border-border bg-fg/[0.04] text-fg-muted hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Refine
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition",
              expanded && "rotate-180"
            )}
          />
        </button>

        {hasFilters && (
          <Link
            href={buildSearchHref({ q: searchParams.q, type: scope }, {})}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-fg-faint transition hover:text-fg"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Link>
        )}
      </div>

      {expanded && (
        <div className="surface-panel space-y-4 rounded-xl p-4">
          <FilterRow label="Genre">
            <Chip
              href={buildSearchHref(searchParams, { genre: undefined })}
              active={!searchParams.genre}
            >
              Any
            </Chip>
            {quickGenres.map((genre) => (
              <Chip
                key={genre}
                href={buildSearchHref(searchParams, { genre })}
                active={searchParams.genre === genre}
              >
                {genre}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Era">
            {eraPresets.map((era) => (
              <Chip
                key={era.id}
                href={buildSearchHref(searchParams, {
                  yearFrom: era.yearFrom,
                  yearTo: era.yearTo
                })}
                active={activeEraId === era.id}
              >
                {era.label}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Sort">
            {sortOptions.map((option) => (
              <Chip
                key={option.value}
                href={buildSearchHref(searchParams, { sort: option.value })}
                active={activeSort === option.value}
              >
                {option.label}
              </Chip>
            ))}
          </FilterRow>
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
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
    <span className="w-12 shrink-0 pt-1 text-[10px] tracking-[0.16em] text-fg-faint uppercase">
      {label}
    </span>
    <div className="flex flex-1 flex-wrap gap-1.5">{children}</div>
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
