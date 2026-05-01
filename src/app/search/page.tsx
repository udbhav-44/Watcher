import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { DiscoveryFilters } from "@/components/movies/discovery-filters";
import { SearchAutocomplete } from "@/components/movies/search-autocomplete";
import { RecordSearch } from "@/components/profile/record-search";
import { detailHrefFor } from "@/lib/catalog/titleId";
import { searchMovies } from "@/lib/data/movies";
import { searchTv } from "@/lib/data/tv";
import { applyDiscoveryFilters } from "@/lib/data/tmdb";
import type { MovieCard } from "@/lib/types";

type Props = {
  searchParams: {
    q?: string;
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: "popularity" | "release_date" | "rating";
    language?: string;
    type?: "all" | "movie" | "tv";
  };
};

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

  const scope = searchParams.type ?? "all";
  let results: MovieCard[] = [];

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

  return (
    <div className="space-y-6">
      <RecordSearch query={query} />
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Search</h1>
        <p className="text-sm text-white/62">Find a title, genre, or year.</p>
      </div>
      <SearchAutocomplete initialQuery={query} />
      <DiscoveryFilters
        action="/search"
        query={query}
        genre={searchParams.genre}
        yearFrom={searchParams.yearFrom}
        yearTo={searchParams.yearTo}
        sort={searchParams.sort}
        language={searchParams.language}
        scope={scope === "tv" ? "tv" : "movie"}
        submitLabel="Search"
      />
      <div className="flex items-center gap-2 text-xs text-white/56">
        <span>Type:</span>
        {(
          [
            { value: "all", label: "All" },
            { value: "movie", label: "Movies" },
            { value: "tv", label: "TV" }
          ] as const
        ).map((entry) => {
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (searchParams.genre) params.set("genre", searchParams.genre);
          if (searchParams.yearFrom) params.set("yearFrom", searchParams.yearFrom);
          if (searchParams.yearTo) params.set("yearTo", searchParams.yearTo);
          if (searchParams.sort) params.set("sort", searchParams.sort);
          if (searchParams.language) params.set("language", searchParams.language);
          params.set("type", entry.value);
          const active = scope === entry.value;
          return (
            <Link
              key={entry.value}
              href={`/search?${params.toString()}` as Route}
              className={
                active
                  ? "rounded-full border border-[#f2c46d]/60 bg-[#f2c46d]/15 px-3 py-1 text-white"
                  : "rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-white/65 hover:bg-white/[0.08]"
              }
            >
              {entry.label}
            </Link>
          );
        })}
      </div>
      <p className="text-sm text-white/56">{results.length} titles found</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {results.map((entry) => (
          <Link
            key={entry.id}
            href={detailHrefFor(entry.titleId)}
            className="surface-panel grid grid-cols-[72px_1fr] gap-3 rounded-lg p-3 transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
          >
            <div className="relative h-[102px] overflow-hidden rounded-md bg-white/5">
              {entry.posterUrl ? (
                <Image
                  src={entry.posterUrl}
                  alt={entry.title}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="h-full w-full bg-[#1a1a1a]" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">
                {entry.title}
                <span className="ml-2 text-xs text-white/45">
                  {entry.mediaType === "tv" ? "TV" : "Movie"}
                </span>
              </p>
              <p className="text-xs text-white/56">
                {entry.releaseYear ?? "TBA"}{" "}
                {entry.genres[0] ? `• ${entry.genres[0]}` : ""}
              </p>
              <p className="line-clamp-2 text-sm text-white/68">
                {entry.synopsis}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
