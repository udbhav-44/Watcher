"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { MovieCard } from "@/components/movies/movie-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PosterSkeleton } from "@/components/ui/skeleton";
import type { MovieCard as MovieCardType } from "@/lib/types";

type WatchedEntry = {
  titleId: string;
  watchedAt: string;
};

const placeholderMovie = (titleId: string): MovieCardType => ({
  id: titleId,
  titleId,
  title: `Saved title (${titleId})`,
  synopsis: "Details are not available right now.",
  posterUrl: null,
  backdropUrl: null,
  releaseYear: null,
  durationMinutes: null,
  voteAverage: null,
  maturityRating: null,
  cast: [],
  castDetails: [],
  director: null,
  numberOfSeasons: null,
  numberOfEpisodes: null,
  playableUrl: "",
  genres: []
});

export const WatchedGrid = (): JSX.Element => {
  const [movies, setMovies] = useState<MovieCardType[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch("/api/watched");
        if (!res.ok) {
          if (!cancelled) setMovies([]);
          return;
        }
        const data = (await res.json()) as { watched?: WatchedEntry[] };
        const entries = data.watched ?? [];

        const details = await Promise.all(
          entries.slice(0, 48).map(async (entry) => {
            try {
              const movieRes = await fetch(`/api/movies/${entry.titleId}`);
              if (!movieRes.ok) return placeholderMovie(entry.titleId);
              const payload = (await movieRes.json()) as {
                movie?: MovieCardType;
              };
              return payload.movie ?? placeholderMovie(entry.titleId);
            } catch {
              return placeholderMovie(entry.titleId);
            }
          })
        );

        if (!cancelled) setMovies(details);
      } catch {
        if (!cancelled) setMovies([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (movies === null) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
        aria-busy="true"
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <PosterSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <EmptyState
        icon={<Eye className="h-5 w-5" />}
        title="Nothing marked as watched yet"
        description="Titles move here automatically when you finish them, or mark them watched from any title page."
        action={
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
          >
            Browse the catalog
          </Link>
        }
      />
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
    >
      {movies.map((movie) => (
        <MovieCard key={movie.titleId} movie={movie} />
      ))}
    </div>
  );
};
