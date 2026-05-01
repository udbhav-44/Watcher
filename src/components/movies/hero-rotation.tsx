"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Info, Play } from "lucide-react";

import { SurpriseMeButton } from "@/components/movies/surprise-me-button";
import { Button } from "@/components/ui/button";
import { detailHrefFor, watchHrefFor } from "@/lib/catalog/titleId";
import type { MovieCard } from "@/lib/types";

type Props = {
  titles: MovieCard[];
  reducedMotion?: boolean;
};

const ROTATE_MS = 7000;

export const HeroRotation = ({
  titles,
  reducedMotion
}: Props): JSX.Element | null => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (titles.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((value) => (value + 1) % titles.length);
    }, ROTATE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [titles.length, reducedMotion]);

  if (titles.length === 0) return null;
  const hero = titles[index] ?? titles[0];
  const heroArtwork = hero.backdropUrl ?? hero.posterUrl;
  const heroMeta = [
    hero.releaseYear,
    hero.maturityRating,
    hero.durationMinutes ? `${hero.durationMinutes} min` : null
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-[#101010]">
      {heroArtwork && (
        <div className="absolute inset-0">
          <Image
            key={hero.titleId}
            src={heroArtwork}
            alt={hero.title}
            fill
            className="object-cover transition-opacity duration-700"
            sizes="100vw"
            priority
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/82 to-[#070707]/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-black/10" />
      <div className="relative flex min-h-[520px] flex-col justify-end gap-4 p-5 md:p-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs tracking-[0.22em] text-[#f2c46d] uppercase">
            Featured
          </p>
          <h1 className="text-4xl leading-tight font-semibold md:text-6xl">
            {hero.title}
          </h1>
          {heroMeta && <p className="text-sm text-white/72">{heroMeta}</p>}
          {hero.synopsis && (
            <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
              {hero.synopsis}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={watchHrefFor(hero.titleId)} prefetch>
              <Button size="lg">
                <Play className="mr-2 h-5 w-5 fill-current" />
                Play
              </Button>
            </Link>
            <Link href={detailHrefFor(hero.titleId)} prefetch>
              <Button variant="outline" size="lg">
                <Info className="mr-2 h-5 w-5" />
                Details
              </Button>
            </Link>
            <SurpriseMeButton />
          </div>
        </div>
        {titles.length > 1 && (
          <div className="flex items-center gap-2">
            {titles.map((entry, entryIndex) => (
              <button
                key={entry.titleId}
                type="button"
                aria-label={`Show ${entry.title}`}
                onClick={() => setIndex(entryIndex)}
                className={
                  entryIndex === index
                    ? "h-1.5 w-6 rounded-full bg-[#f2c46d]"
                    : "h-1.5 w-3 rounded-full bg-white/30 transition hover:bg-white/50"
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
