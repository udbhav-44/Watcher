import type { Route } from "next";

export type SearchScope = "all" | "movie" | "tv";
export type SearchSort = "popularity" | "release_date" | "rating";

export type SearchParams = {
  q?: string;
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  sort?: SearchSort;
  language?: string;
  type?: SearchScope;
};

export function buildSearchHref(
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
