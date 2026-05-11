"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

import { watchHrefFor } from "@/lib/catalog/titleId";
import type { MovieCard as MovieCardType } from "@/lib/types";

type WatchEvent = {
  id: string;
  titleId: string;
  progressPercent: number;
};

type ResumeItem = WatchEvent & {
  movie?: MovieCardType;
};

export const ContinueWatching = (): JSX.Element | null => {
  const [items, setItems] = useState<ResumeItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch("/api/watch-events");
        const data = (await res.json()) as { events?: WatchEvent[] };
        const filtered = (data.events ?? [])
          .filter(
            (event) => event.progressPercent > 5 && event.progressPercent < 95
          )
          .slice(0, 8);
        if (cancelled) return;
        setItems(filtered);
        const enriched = await Promise.all(
          filtered.map(async (event): Promise<ResumeItem> => {
            try {
              const response = await fetch(`/api/movies/${event.titleId}`);
              if (!response.ok) return event;
              const payload = (await response.json()) as {
                movie?: MovieCardType;
              };
              return { ...event, movie: payload.movie ?? undefined };
            } catch {
              return event;
            }
          })
        );
        if (cancelled) return;
        setItems(enriched);
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="rail-continue-watching">
      <div className="flex items-end justify-between gap-3">
        <h2
          id="rail-continue-watching"
          className="text-xl font-medium text-fg"
        >
          Continue watching
        </h2>
        <span className="text-xs text-fg-faint tabular-nums">
          {items.length} {items.length === 1 ? "title" : "titles"}
        </span>
      </div>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {items.map((item) => {
          const artwork = item.movie?.backdropUrl ?? item.movie?.posterUrl;
          const title =
            item.movie?.title ?? `Title ${item.titleId.slice(0, 6)}`;
          const progress = Math.min(100, Math.max(0, item.progressPercent));
          const remaining =
            item.movie?.durationMinutes != null
              ? Math.max(
                  1,
                  Math.round(
                    item.movie.durationMinutes * (1 - progress / 100)
                  )
                )
              : null;
          return (
            <Link
              key={item.id}
              href={watchHrefFor(item.titleId)}
              className="group relative w-[260px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-surface-3">
                {artwork ? (
                  <Image
                    src={artwork}
                    alt={title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="260px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-fg-faint">
                    Artwork unavailable
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-fg/10">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progress}%` }}
                    aria-hidden
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fg text-fg-on-accent shadow-lift">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-medium text-fg">
                  {title}
                </p>
                <p className="text-xs text-fg-faint tabular-nums">
                  {Math.round(progress)}% watched
                  {remaining ? `  ·  ${remaining} min left` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
