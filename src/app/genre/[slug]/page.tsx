import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { MovieCard } from "@/components/movies/movie-card";
import { discoverMovies } from "@/lib/data/movies";
import { discoverTv } from "@/lib/data/tv";
import { movieGenreMap, tvGenreMap } from "@/lib/data/tmdb";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Sort = "popularity" | "release_date" | "rating";
type Scope = "movie" | "tv";

type Props = {
  params: { slug: string };
  searchParams: { sort?: Sort; type?: Scope | "all" };
};

const slugToName = (slug: string): string =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/Sci Fi/i, "Sci-Fi");

const findExactGenre = (
  slug: string,
  dictionary: Record<number, string>
): string | null => {
  const normalized = slug.toLowerCase().replace(/-/g, " ");
  const found = Object.values(dictionary).find(
    (entry) => entry.toLowerCase() === normalized
  );
  return found ?? null;
};

const SORT_OPTIONS: Array<{ value: Sort; label: string }> = [
  { value: "popularity", label: "Popular" },
  { value: "release_date", label: "Latest" },
  { value: "rating", label: "Top rated" }
];

const SCOPE_OPTIONS: Array<{ value: "all" | Scope; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" }
];

function buildHref(
  slug: string,
  overrides: { sort?: Sort; type?: "all" | Scope }
): Route {
  const next = new URLSearchParams();
  if (overrides.sort && overrides.sort !== "popularity") {
    next.set("sort", overrides.sort);
  }
  if (overrides.type && overrides.type !== "all") {
    next.set("type", overrides.type);
  }
  const qs = next.toString();
  return (qs ? `/genre/${slug}?${qs}` : `/genre/${slug}`) as Route;
}

export default async function GenrePage({
  params,
  searchParams
}: Props): Promise<JSX.Element> {
  const movieGenre =
    findExactGenre(params.slug, movieGenreMap) ?? slugToName(params.slug);
  const tvGenre =
    findExactGenre(params.slug, tvGenreMap) ?? slugToName(params.slug);
  const sort = searchParams.sort ?? "popularity";
  const scope = searchParams.type ?? "all";

  const [movies, shows] = await Promise.all([
    scope === "tv"
      ? Promise.resolve([] as MovieCardType[])
      : discoverMovies({ genre: movieGenre, sort }),
    scope === "movie"
      ? Promise.resolve([] as MovieCardType[])
      : discoverTv({ genre: tvGenre, sort })
  ]);

  if (movies.length === 0 && shows.length === 0) return notFound();

  const combined =
    scope === "movie"
      ? movies
      : scope === "tv"
        ? shows
        : [...movies.slice(0, 24), ...shows.slice(0, 24)];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          Genre
        </p>
        <h1 className="text-3xl font-semibold text-fg">
          {slugToName(params.slug)}
        </h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Top movies and TV titles in this genre. Refine below.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs tracking-wide text-fg-faint uppercase">
            Type
          </span>
          <div className="inline-flex items-center rounded-full border border-border bg-fg/[0.04] p-1">
            {SCOPE_OPTIONS.map((option) => {
              const isActive = scope === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildHref(params.slug, {
                    sort,
                    type: option.value
                  })}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? "rounded-full bg-fg/[0.1] px-3 py-1 text-xs text-fg"
                      : "rounded-full px-3 py-1 text-xs text-fg-muted transition hover:bg-fg/[0.06] hover:text-fg"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs tracking-wide text-fg-faint uppercase">
            Sort
          </span>
          {SORT_OPTIONS.map((option) => {
            const isActive = sort === option.value;
            return (
              <Link
                key={option.value}
                href={buildHref(params.slug, {
                  sort: option.value,
                  type: scope
                })}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "shrink-0 rounded-full border border-accent/50 bg-accent-soft px-3 py-1 text-xs font-medium text-accent transition"
                    : "shrink-0 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
                }
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-fg-muted tabular-nums">
        {combined.length} {combined.length === 1 ? "title" : "titles"}
      </p>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
      >
        {combined.map((entry) => (
          <MovieCard key={entry.id} movie={entry} />
        ))}
      </div>
    </div>
  );
}
