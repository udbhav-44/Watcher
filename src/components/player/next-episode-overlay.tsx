"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pause, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { watchHrefFor } from "@/lib/catalog/titleId";

type Props = {
  titleId: string;
  currentSeason: number;
  currentEpisode: number;
  nextSeason: number | null;
  nextEpisode: number | null;
  nextEpisodeName: string | null;
  nextEpisodeStillUrl: string | null;
  durationMinutes: number | null;
};

const COUNTDOWN_SECONDS = 10;

const startThresholdMs = (durationMinutes: number | null): number => {
  if (!durationMinutes || durationMinutes < 5) return 30 * 60 * 1000;
  return Math.max(5 * 60 * 1000, (durationMinutes - 1) * 60 * 1000);
};

export const NextEpisodeOverlay = ({
  titleId,
  currentSeason,
  currentEpisode,
  nextSeason,
  nextEpisode,
  nextEpisodeName,
  nextEpisodeStillUrl,
  durationMinutes
}: Props): JSX.Element | null => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!nextSeason || !nextEpisode) return undefined;
    const showAt = startThresholdMs(durationMinutes);
    const timer = window.setTimeout(() => setVisible(true), showAt);
    return () => window.clearTimeout(timer);
  }, [durationMinutes, nextEpisode, nextSeason, currentSeason, currentEpisode]);

  useEffect(() => {
    if (!visible || paused) return undefined;
    if (countdown <= 0) {
      if (nextSeason && nextEpisode) {
        router.push(
          `${watchHrefFor(titleId)}?s=${nextSeason}&e=${nextEpisode}`
        );
      }
      return undefined;
    }
    const timer = window.setTimeout(
      () => setCountdown((value) => value - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [
    countdown,
    nextEpisode,
    nextSeason,
    paused,
    router,
    titleId,
    visible
  ]);

  if (!visible || !nextSeason || !nextEpisode) return null;

  return (
    <div className="relative flex flex-wrap items-center gap-4 rounded-lg border border-accent/40 bg-overlay p-4 shadow-lift backdrop-blur">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 rounded-full p-1 text-fg-faint transition hover:bg-fg/10 hover:text-fg"
        aria-label="Dismiss next episode prompt"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative h-[72px] w-[128px] overflow-hidden rounded-md bg-surface-3">
        {nextEpisodeStillUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={nextEpisodeStillUrl}
            alt={nextEpisodeName ?? "Next episode"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface-3" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs tracking-[0.18em] text-accent uppercase tabular-nums">
          Next episode in {countdown}s
        </p>
        <p className="text-sm font-medium text-fg">
          S{nextSeason}  ·  E{nextEpisode}
          {nextEpisodeName ? `  ·  ${nextEpisodeName}` : ""}
        </p>
        <p className="text-xs text-fg-muted">
          Auto-playing soon. Skip the wait or pause to stay on the current
          episode.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            router.push(
              `${watchHrefFor(titleId)}?s=${nextSeason}&e=${nextEpisode}`
            )
          }
        >
          Watch now
        </Button>
      </div>
    </div>
  );
};
