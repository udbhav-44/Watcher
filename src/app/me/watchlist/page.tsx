import Link from "next/link";

import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { WatchlistGrid } from "@/components/profile/watchlist-grid";
import { Card } from "@/components/ui/card";
import { getMovies } from "@/lib/data/movies";

export default async function WatchlistPage(): Promise<JSX.Element> {
  const movies = await getMovies();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Watchlist</h1>
        <p className="text-sm text-white/62">Saved titles for the selected profile.</p>
      </div>
      <ProfileSwitcher />
      <WatchlistGrid />
      <Card>
        <p className="mb-2 text-sm text-white/68">Suggested titles</p>
        <div className="grid gap-2 md:grid-cols-2">
          {movies.slice(0, 6).map((movie) => (
            <Link key={movie.id} href={`/title/${movie.titleId}`} className="rounded-md bg-white/[0.05] px-3 py-2 text-sm hover:bg-white/[0.1]">
              {movie.title}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
