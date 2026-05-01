import Link from "next/link";

import { DiscoveryFilters } from "@/components/movies/discovery-filters";
import { MovieRail } from "@/components/movies/movie-rail";
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
    language?: string;
  };
};

const genreSlug = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function BrowsePage({
  searchParams
}: Props): Promise<JSX.Element> {
  const [rails, filtered] = await Promise.all([
    getFeaturedRails(),
    discoverMovies({
      genre: searchParams.genre,
      yearFrom: Number(searchParams.yearFrom ?? "") || undefined,
      yearTo: Number(searchParams.yearTo ?? "") || undefined,
      sort: searchParams.sort,
      language: searchParams.language
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Movies</h1>
        <p className="text-sm text-white/62">
          Filter by genre, year, language, and rating.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_GENRES.map((entry) => (
          <Link
            key={entry}
            href={`/genre/${genreSlug(entry)}`}
            className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/70 transition hover:bg-white/[0.08]"
          >
            {entry}
          </Link>
        ))}
      </div>
      <DiscoveryFilters
        action="/browse"
        genre={searchParams.genre}
        yearFrom={searchParams.yearFrom}
        yearTo={searchParams.yearTo}
        sort={searchParams.sort}
        language={searchParams.language}
        scope="movie"
        submitLabel="Apply filters"
      />
      <MovieRail title="Filtered results" movies={filtered.slice(0, 18)} />
      {rails.map((rail) => (
        <MovieRail key={rail.slug} title={rail.label} movies={rail.movies} />
      ))}
    </div>
  );
}
