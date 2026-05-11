"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
    <section className="relative isolate min-h-[520px] overflow-hidden rounded-xl border border-border bg-surface">
      {heroArtwork && (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={hero.titleId}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: motionOff ? 1 : 1.04 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: motionOff ? 0 : 0.7 }
            }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <Image
              src={heroArtwork}
              alt={hero.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-base via-base/85 to-base/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-base/10" />
      <div className="relative flex min-h-[520px] flex-col justify-end gap-5 p-5 md:p-10">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs tracking-[0.22em] text-accent uppercase">
            Featured
          </p>
          <h1 className="text-balance text-4xl leading-tight font-semibold text-fg md:text-6xl">
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
                  className="rounded-full border border-border bg-fg/[0.04] px-2.5 py-0.5 text-[11px] tracking-wide text-fg-muted"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          {hero.synopsis && (
            <p className="max-w-xl text-pretty text-sm leading-6 text-fg-muted md:text-base">
              {hero.synopsis}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href={watchHrefFor(hero.titleId)} prefetch>
              <Button size="lg">
                <Play className="h-5 w-5 fill-current" />
                Play
              </Button>
            </Link>
            <Link href={detailHrefFor(hero.titleId)} prefetch>
              <Button variant="outline" size="lg">
                <Info className="h-5 w-5" />
                Details
              </Button>
            </Link>
            <SurpriseMeButton />
          </div>
        </div>
        {titles.length > 1 && (
          <div className="flex items-center gap-2" role="tablist" aria-label="Featured titles">
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
                    ? "h-1.5 w-7 rounded-full bg-accent transition-[width]"
                    : "h-1.5 w-3 rounded-full bg-fg/30 transition hover:bg-fg/50"
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
