"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { detailHrefFor } from "@/lib/catalog/titleId";

type Recommendation = {
  titleId: string;
  title: string;
  posterUrl?: string | null;
  basisTitle?: string | null;
  releaseYear?: number | null;
};

type Payload = {
  basis: { titleId: string; title: string; score: number } | null;
  recommendations: Recommendation[];
};

export const PersonalizedRail = (): JSX.Element | null => {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch("/api/recommendations", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) {
        if (!cancelled) setData(null);
        return;
      }
      const payload = (await response.json()) as Payload;
      if (!cancelled) setData(payload);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || !data.basis || data.recommendations.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="personalized-rail-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="personalized-rail-heading" className="text-xl font-medium text-fg">
          Because you rated{" "}
          <span className="text-accent">{data.basis.title}</span>
        </h2>
        <span className="text-xs text-fg-faint tabular-nums">
          {data.recommendations.length} suggestions
        </span>
      </div>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {data.recommendations.map((entry) => (
          <Link
            key={entry.titleId}
            href={detailHrefFor(entry.titleId)}
            className="group w-[160px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/70 outline-none"
          >
            <div className="relative aspect-[2/3] w-full bg-surface-3">
              {entry.posterUrl ? (
                <Image
                  src={entry.posterUrl}
                  alt={entry.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                  sizes="160px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-fg-faint">
                  Artwork unavailable
                </div>
              )}
            </div>
            <div className="space-y-1 p-2">
              <p className="line-clamp-1 text-sm font-medium text-fg">
                {entry.title}
              </p>
              <p className="text-xs text-fg-faint tabular-nums">
                {entry.releaseYear ?? "TBA"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
