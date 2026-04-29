import Link from "next/link";

import { searchMovies } from "@/lib/data/movies";

type Props = {
  searchParams: { q?: string };
};

export default async function SearchPage({ searchParams }: Props): Promise<JSX.Element> {
  const query = searchParams.q ?? "";
  const movies = await searchMovies(query);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>
      <form className="glass-panel flex items-center gap-2 rounded-2xl p-3" action="/search">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search by title, genre, or vibe..."
          className="w-full rounded-xl bg-black/30 px-3 py-2 outline-none placeholder:text-white/40"
        />
        <button className="rounded-xl bg-cyan-400 px-4 py-2 text-black">Go</button>
      </form>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {movies.map((movie) => (
          <Link key={movie.id} href={`/title/${movie.titleId}`} className="glass-panel rounded-2xl p-4 transition hover:bg-white/10">
            <p className="font-semibold">{movie.title}</p>
            <p className="line-clamp-2 text-sm text-white/70">{movie.synopsis}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
