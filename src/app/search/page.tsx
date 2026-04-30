import Image from "next/image";
import Link from "next/link";

import { DiscoveryFilters } from "@/components/movies/discovery-filters";
import { searchMovies } from "@/lib/data/movies";

type Props = {
  searchParams: {
    q?: string;
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    sort?: "popularity" | "release_date" | "rating";
  };
};

export default async function SearchPage({
  searchParams
}: Props): Promise<JSX.Element> {
  const query = searchParams.q ?? "";
  const movies = await searchMovies(query, {
    genre: searchParams.genre,
    yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
    yearTo: Number(searchParams.yearTo ?? "") || undefined,
    sort: searchParams.sort
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Search</h1>
        <p className="text-sm text-white/62">Find a title, genre, or year.</p>
      </div>
      <DiscoveryFilters
        action="/search"
        query={query}
        genre={searchParams.genre}
        yearFrom={searchParams.yearFrom}
        yearTo={searchParams.yearTo}
        sort={searchParams.sort}
        submitLabel="Search"
      />
      <p className="text-sm text-white/56">{movies.length} titles found</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/title/${movie.titleId}`}
            className="surface-panel grid grid-cols-[72px_1fr] gap-3 rounded-lg p-3 transition hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70"
          >
            <div className="relative h-[102px] overflow-hidden rounded-md bg-white/5">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="h-full w-full bg-[#1a1a1a]" />
              )}
            </div>
            <div className="space-y-1">
              <p className="font-semibold">{movie.title}</p>
              <p className="text-xs text-white/56">
                {movie.releaseYear ?? "TBA"}{" "}
                {movie.genres[0] ? `• ${movie.genres[0]}` : ""}
              </p>
              <p className="line-clamp-2 text-sm text-white/68">
                {movie.synopsis}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
