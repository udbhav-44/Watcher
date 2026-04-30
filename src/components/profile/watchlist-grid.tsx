"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";

type WatchlistEntry = {
  titleId: string;
};

type Movie = {
  titleId: string;
  title: string;
  synopsis?: string | null;
  posterUrl?: string | null;
};

export const WatchlistGrid = (): JSX.Element => {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const watchlistRes = await fetch("/api/watchlist");
      const watchlistData = (await watchlistRes.json()) as {
        watchlist?: WatchlistEntry[];
      };
      const entries = watchlistData.watchlist ?? [];

      const detailRequests = await Promise.all(
        entries.slice(0, 24).map(async (entry) => {
          const movieRes = await fetch(`/api/movies/${entry.titleId}`);
          if (!movieRes.ok) {
            return {
              titleId: entry.titleId,
              title: `Saved title (${entry.titleId})`,
              synopsis: "Details are not available right now.",
              posterUrl: null
            } satisfies Movie;
          }
          const data = (await movieRes.json()) as { movie: Movie };
          return data.movie;
        })
      );

      setMovies(detailRequests);
    };

    void load();
  }, []);

  if (!movies.length) {
    return (
      <Card>
        <p className="text-sm text-white/68">
          Your watchlist is empty. Add titles from any detail page.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {movies.map((movie) => (
        <Card key={movie.titleId} className="grid grid-cols-[72px_1fr] gap-3">
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
          <Link href={`/title/${movie.titleId}`} className="space-y-1">
            <p className="font-semibold">{movie.title}</p>
            <p className="line-clamp-2 text-sm text-white/68">
              {movie.synopsis}
            </p>
          </Link>
        </Card>
      ))}
    </div>
  );
};
