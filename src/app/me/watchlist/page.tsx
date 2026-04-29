import Link from "next/link";

import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { Card } from "@/components/ui/card";
import { getMovies } from "@/lib/data/movies";

export default async function WatchlistPage(): Promise<JSX.Element> {
  const movies = await getMovies();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your Watchlist</h1>
        <p className="text-sm text-white/70">Switch local profiles and keep personalized lists per device.</p>
      </div>
      <ProfileSwitcher />
      <div className="grid gap-3 md:grid-cols-2">
        {movies.slice(0, 8).map((movie) => (
          <Card key={movie.id}>
            <Link href={`/title/${movie.titleId}`} className="space-y-1">
              <p className="font-semibold">{movie.title}</p>
              <p className="text-sm text-white/70">{movie.synopsis}</p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
