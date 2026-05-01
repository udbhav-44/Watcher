"use client";

import { useEffect, useRef } from "react";

type Props = {
  titleId: string;
  mediaType: "movie" | "tv";
  season?: number | null;
  episode?: number | null;
};

export const EpisodeWatchRecorder = ({
  titleId,
  mediaType,
  season,
  episode
}: Props): null => {
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();

    const record = async (
      progressPercent: number,
      completed = false
    ): Promise<void> => {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - startedAt.current) / 1000)
      );
      try {
        await fetch("/api/watch-events", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleId,
            mediaType,
            season: season ?? undefined,
            episode: episode ?? undefined,
            secondsWatched: elapsed,
            progressPercent,
            completed
          })
        });
      } catch {
        // best-effort
      }
    };

    const interval = window.setInterval(() => {
      void record(35);
    }, 60_000);

    const onVisibility = (): void => {
      if (document.visibilityState === "hidden") {
        void record(20);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    void record(5);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      void record(100, true);
    };
  }, [titleId, mediaType, season, episode]);

  return null;
};
