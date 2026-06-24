"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pause, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { watchHrefFor } from "@/lib/catalog/titleId";
import {
  readAutoplayNextPreference,
  AUTOPLAY_NEXT_KEY
} from "@/lib/player/embedEvents";

type Props = {
  titleId: string;
  currentSeason: number;
  currentEpisode: number;
  nextSeason: number | null;
  nextEpisode: number | null;
  nextEpisodeName: string | null;
  nextEpisodeStillUrl: string | null;
  /** Set when the embed player signals natural end-of-episode. */
  episodeEnded?: boolean;
  /** Query-param style for anime (episode only, no season). */
  nextHref?: string | null;
};

const COUNTDOWN_SECONDS = 10;

export const NextEpisodeOverlay = ({
  titleId,
  currentSeason,
  currentEpisode,
  nextSeason,
  nextEpisode,
  nextEpisodeName,
  nextEpisodeStillUrl,
  episodeEnded = false,
  nextHref
}: Props): JSX.Element | null => {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [paused, setPaused] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  useEffect(() => {
    setAutoplayEnabled(readAutoplayNextPreference());
  }, []);

  useEffect(() => {
    if (!episodeEnded || !nextSeason || !nextEpisode) return;
    setVisible(true);
    setCountdown(COUNTDOWN_SECONDS);
    setPaused(false);
  }, [episodeEnded, nextSeason, nextEpisode, currentSeason, currentEpisode]);

  const targetHref =
    nextHref ??
    (nextSeason && nextEpisode
      ? `${watchHrefFor(titleId)}?s=${nextSeason}&e=${nextEpisode}`
      : null);

  useEffect(() => {
    if (!visible || paused || !autoplayEnabled || !targetHref) return undefined;
    if (countdown <= 0) {
      router.push(targetHref as Parameters<typeof router.push>[0]);
      return undefined;
    }
    const timer = window.setTimeout(
      () => setCountdown((value) => value - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [countdown, paused, autoplayEnabled, router, targetHref, visible]);

  const toggleAutoplay = (): void => {
    const next = !autoplayEnabled;
    setAutoplayEnabled(next);
    try {
      window.localStorage.setItem(AUTOPLAY_NEXT_KEY, String(next));
    } catch {
      // ignore
    }
  };

  if (!visible || !nextSeason || !nextEpisode || !targetHref) return null;

  const label =
    nextSeason === currentSeason
      ? `E${nextEpisode}`
      : `S${nextSeason}  ·  E${nextEpisode}`;

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
          {autoplayEnabled && !paused
            ? `Next episode in ${countdown}s`
            : "Next episode"}
        </p>
        <p className="text-sm font-medium text-fg">
          {label}
          {nextEpisodeName ? `  ·  ${nextEpisodeName}` : ""}
        </p>
        <p className="text-xs text-fg-muted">
          {autoplayEnabled
            ? "Auto-playing when the episode ends. Pause or disable autoplay to stay put."
            : "Autoplay is off. Use Watch now to continue."}
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
        <Button type="button" variant="outline" size="sm" onClick={toggleAutoplay}>
          {autoplayEnabled ? "Disable autoplay" : "Enable autoplay"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            router.push(targetHref as Parameters<typeof router.push>[0])
          }
        >
          Watch now
        </Button>
      </div>
    </div>
  );
};
