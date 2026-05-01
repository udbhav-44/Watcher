import { notFound } from "next/navigation";

import { MovieRail } from "@/components/movies/movie-rail";
import { discoverMovies } from "@/lib/data/movies";
import { discoverTv } from "@/lib/data/tv";
import { movieGenreMap, tvGenreMap } from "@/lib/data/tmdb";

type Props = {
  params: { slug: string };
};

const slugToName = (slug: string): string =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/Sci Fi/i, "Sci-Fi");

const findExactGenre = (slug: string, dictionary: Record<number, string>): string | null => {
  const normalized = slug.toLowerCase().replace(/-/g, " ");
  const found = Object.values(dictionary).find(
    (entry) => entry.toLowerCase() === normalized
  );
  return found ?? null;
};

export default async function GenrePage({
  params
}: Props): Promise<JSX.Element> {
  const movieGenre =
    findExactGenre(params.slug, movieGenreMap) ?? slugToName(params.slug);
  const tvGenre =
    findExactGenre(params.slug, tvGenreMap) ?? slugToName(params.slug);

  const [movies, shows] = await Promise.all([
    discoverMovies({ genre: movieGenre, sort: "popularity" }),
    discoverTv({ genre: tvGenre, sort: "popularity" })
  ]);

  if (movies.length === 0 && shows.length === 0) return notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs tracking-[0.22em] text-[#f2c46d] uppercase">
          Genre
        </p>
        <h1 className="text-3xl font-semibold">{slugToName(params.slug)}</h1>
        <p className="text-sm text-white/62">
          Top movies and TV titles in this genre.
        </p>
      </div>
      {movies.length > 0 && (
        <MovieRail title={`Movies · ${movieGenre}`} movies={movies.slice(0, 24)} />
      )}
      {shows.length > 0 && (
        <MovieRail title={`TV · ${tvGenre}`} movies={shows.slice(0, 24)} />
      )}
    </div>
  );
}
