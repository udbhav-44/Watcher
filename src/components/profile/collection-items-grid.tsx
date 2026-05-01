"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { detailHrefFor } from "@/lib/catalog/titleId";

type Item = {
  id: string;
  titleId: string;
  mediaType: string;
  addedAt: string;
};

type Movie = {
  titleId: string;
  title: string;
  synopsis?: string | null;
  posterUrl?: string | null;
};

type Props = {
  slug: string;
  items: Item[];
};

export const CollectionItemsGrid = ({ slug, items }: Props): JSX.Element => {
  const [enriched, setEnriched] = useState<Movie[] | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const requests = items.map(async (entry) => {
        const response = await fetch(`/api/movies/${entry.titleId}`, {
          credentials: "same-origin"
        });
        if (!response.ok) {
          return {
            titleId: entry.titleId,
            title: `Saved title (${entry.titleId})`,
            synopsis: "Details are not available right now.",
            posterUrl: null
          } satisfies Movie;
        }
        const data = (await response.json()) as { movie: Movie };
        return data.movie;
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
    toast.info(`Removed “${label}”`);
  };

  if (!enriched) {
    return (
      <Card>
        <p className="text-sm text-white/68">Loading items...</p>
      </Card>
    );
  }

  const visible = enriched.filter((entry) => !hidden.has(entry.titleId));

  if (visible.length === 0) {
    return (
      <Card>
        <p className="text-sm text-white/68">
          This collection is empty. Add titles from any detail page.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visible.map((movie) => (
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
          <div className="flex flex-col justify-between gap-2">
            <Link href={detailHrefFor(movie.titleId)} className="space-y-1">
              <p className="font-semibold">{movie.title}</p>
              <p className="line-clamp-2 text-sm text-white/68">
                {movie.synopsis}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => remove(movie.titleId, movie.title)}
              className="inline-flex w-fit items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white/60 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
};
