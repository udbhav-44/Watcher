"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderOpen, Play, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { PosterSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { detailHrefFor } from "@/lib/catalog/titleId";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Item = {
  id: string;
  titleId: string;
  mediaType: string;
  addedAt: string;
};

type Props = {
  slug: string;
  items: Item[];
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

export const CollectionItemsGrid = ({ slug, items }: Props): JSX.Element => {
  const [enriched, setEnriched] = useState<MovieCardType[] | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const requests = items.map(async (entry) => {
        try {
          const response = await fetch(`/api/movies/${entry.titleId}`, {
            credentials: "same-origin"
          });
          if (!response.ok) return placeholderMovie(entry.titleId);
          const data = (await response.json()) as { movie?: MovieCardType };
          return data.movie ?? placeholderMovie(entry.titleId);
        } catch {
          return placeholderMovie(entry.titleId);
        }
      });
      const result = await Promise.all(requests);
      if (!cancelled) setEnriched(result);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const remove = async (titleId: string, label: string): Promise<void> => {
    const response = await fetch(
      `/api/collections/${slug}/items?titleId=${encodeURIComponent(titleId)}`,
      { method: "DELETE", credentials: "same-origin" }
    );
    if (!response.ok) {
      toast.error("Could not remove from collection");
      return;
    }
    setHidden((prev) => new Set(prev).add(titleId));
    toast.info(`Removed "${label}"`);
  };

  if (enriched === null) {
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

  const visible = enriched.filter((entry) => !hidden.has(entry.titleId));

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-5 w-5" />}
        title="This collection is empty"
        description="Save titles to this collection from any detail page using the Save to... menu."
        action={
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
          >
            Find titles to add
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
      {visible.map((movie) => (
        <div
          key={movie.titleId}
          className="group relative w-full overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition hover:border-border-strong"
        >
          <Link
            href={detailHrefFor(movie.titleId)}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-3">
              {movie.posterUrl ? (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                  sizes="(max-width:768px) 50vw, 20vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-fg-faint">
                  Artwork unavailable
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />
              <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-fg text-fg-on-accent opacity-0 shadow-lift transition group-focus-within:opacity-100 group-hover:opacity-100">
                <Play className="h-4 w-4 fill-current" />
              </div>
            </div>
            <div className="space-y-1 p-3">
              <p className="line-clamp-1 text-sm font-medium text-fg">
                {movie.title}
              </p>
              {movie.synopsis && (
                <p className="line-clamp-2 text-xs text-fg-faint">
                  {movie.synopsis}
                </p>
              )}
            </div>
          </Link>
          <button
            type="button"
            onClick={() => remove(movie.titleId, movie.title)}
            aria-label={`Remove ${movie.title} from collection`}
            className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-overlay text-fg-muted opacity-0 backdrop-blur transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 hover:border-danger/40 hover:bg-danger/15 hover:text-danger group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
