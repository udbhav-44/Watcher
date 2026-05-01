"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";

import { detailHrefFor, watchHrefFor } from "@/lib/catalog/titleId";

type UpNextEntry = {
  titleId: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  season: number;
  episode: number;
  episodeName: string;
  episodeStillUrl: string | null;
  totalEpisodes: number;
  watchedEpisodes: number;
  completionPercent: number;
  progressPercent: number;
  reason: "in_progress" | "next_episode" | "in_watchlist";
};

const reasonLabel = (reason: UpNextEntry["reason"]): string => {
  if (reason === "in_progress") return "Resume";
  if (reason === "next_episode") return "Next up";
  return "Start watching";
};

export const UpNextRail = (): JSX.Element | null => {
  const [entries, setEntries] = useState<UpNextEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch("/api/up-next", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) {
        if (!cancelled) setEntries([]);
        return;
      }
      const data = (await response.json()) as { upNext?: UpNextEntry[] };
      if (!cancelled) setEntries(data.upNext ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!entries || entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-medium">Up next on TV</h2>
        <Link
          href="/calendar"
          className="text-xs text-[#f2c46d] hover:underline"
        >
          View calendar
        </Link>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {entries.map((entry) => {
          const watchHref =
            `${watchHrefFor(entry.titleId)}?s=${entry.season}&e=${entry.episode}` as Route;
          return (
            <div
              key={`${entry.titleId}-${entry.season}-${entry.episode}`}
              className="surface-panel min-w-[280px] overflow-hidden rounded-lg"
            >
              <Link href={watchHref} className="block">
                <div className="relative aspect-video w-full bg-[#1a1a1a]">
                  {entry.episodeStillUrl ? (
                    <Image
                      src={entry.episodeStillUrl}
                      alt={`${entry.title} S${entry.season}E${entry.episode}`}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : entry.backdropUrl ? (
                    <Image
                      src={entry.backdropUrl}
                      alt={entry.title}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#1a1a1a]" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 text-white">
                    <p className="text-xs tracking-[0.18em] text-[#f2c46d] uppercase">
                      {reasonLabel(entry.reason)}
                    </p>
                    <p className="text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-white/70">
                      S{entry.season} • E{entry.episode}
                      {entry.episodeName ? ` · ${entry.episodeName}` : ""}
                    </p>
                  </div>
                  {entry.progressPercent > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div
                        className="h-full bg-[#f2c46d]"
                        style={{ width: `${Math.min(100, entry.progressPercent)}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-white/60">
                <Link href={detailHrefFor(entry.titleId)} className="hover:underline">
                  Series details
                </Link>
                <span>
                  {entry.watchedEpisodes}/{entry.totalEpisodes} watched ·{" "}
                  {entry.completionPercent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
