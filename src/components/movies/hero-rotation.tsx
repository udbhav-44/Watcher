"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { detailHrefFor, watchHrefFor } from "@/lib/catalog/titleId";
import type { MovieCard } from "@/lib/types";

type Props = {
  titles: MovieCard[];
  reducedMotion?: boolean;
};

const ROTATE_MS = 8000;

export const HeroRotation = ({
  titles,
  reducedMotion
}: Props): JSX.Element | null => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const systemReducedMotion = useReducedMotion();
  const motionOff = reducedMotion ?? systemReducedMotion ?? false;

  useEffect(() => {
    if (motionOff) return;
    if (titles.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((value) => (value + 1) % titles.length);
    }, ROTATE_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [titles.length, motionOff]);

  if (titles.length === 0) return null;
  const hero = titles[index] ?? titles[0];
  const heroArtwork = hero.backdropUrl ?? hero.posterUrl;
  const heroMeta = [
    hero.releaseYear,
    hero.maturityRating,
    hero.durationMinutes ? `${hero.durationMinutes} min` : null
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <section className="relative isolate min-h-[min(78vh,720px)] overflow-hidden bg-base">
      {heroArtwork && (
        <div className="absolute inset-0">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={hero.titleId}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: motionOff ? 0 : 0.5 }
              }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <Image
                src={heroArtwork}
                alt={hero.title}
                fill
                className="object-cover object-top"
                sizes="100vw"
                priority={index === 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-base via-base/92 to-base/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/20 to-transparent" />

      <div className="relative mx-auto flex min-h-[min(78vh,720px)] max-w-7xl flex-col justify-end gap-6 px-4 pb-12 pt-28 md:px-6 md:pb-16">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-balance text-4xl leading-[1.05] font-semibold tracking-tight text-fg md:text-6xl">
            {hero.title}
          </h1>
          {heroMeta && (
            <p className="text-sm tracking-wide text-fg-muted tabular-nums">
              {heroMeta}
            </p>
          )}
          {hero.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hero.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-border/80 bg-fg/[0.05] px-2.5 py-0.5 text-[11px] tracking-wide text-fg-muted"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          {hero.synopsis && (
            <p className="line-clamp-3 max-w-xl text-pretty text-sm leading-6 text-fg-muted md:line-clamp-2 md:text-base">
              {hero.synopsis}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href={watchHrefFor(hero.titleId)} prefetch>
              <Button size="lg">
                <Play className="h-5 w-5 fill-current" />
                Watch now
              </Button>
            </Link>
            <Link href={detailHrefFor(hero.titleId)} prefetch>
              <Button variant="outline" size="lg">
                <Info className="h-5 w-5" />
                Details
              </Button>
            </Link>
          </div>
        </div>

        {titles.length > 1 && (
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Featured titles"
          >
            {titles.map((entry, entryIndex) => (
              <button
                key={entry.titleId}
                type="button"
                role="tab"
                aria-selected={entryIndex === index}
                aria-label={`Show ${entry.title}`}
                onClick={() => setIndex(entryIndex)}
                className={
                  entryIndex === index
                    ? "h-1 w-8 rounded-full bg-accent transition-[width]"
                    : "h-1 w-4 rounded-full bg-fg/25 transition hover:bg-fg/45"
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
