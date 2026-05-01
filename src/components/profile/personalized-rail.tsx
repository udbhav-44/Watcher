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
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-medium">
          Because you rated{" "}
          <span className="text-[#f2c46d]">{data.basis.title}</span>
        </h2>
        <span className="text-xs text-white/45">
          {data.recommendations.length} suggestions
        </span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {data.recommendations.map((entry) => (
          <Link
            key={entry.titleId}
            href={detailHrefFor(entry.titleId)}
            className="group w-[160px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#121212]"
          >
            <div className="relative aspect-[2/3] w-full bg-[#1a1a1a]">
              {entry.posterUrl ? (
                <Image
                  src={entry.posterUrl}
                  alt={entry.title}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="160px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                  Artwork unavailable
                </div>
              )}
            </div>
            <div className="space-y-1 p-2">
              <p className="line-clamp-1 text-sm font-medium">{entry.title}</p>
              <p className="text-xs text-white/56">
                {entry.releaseYear ?? "TBA"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
