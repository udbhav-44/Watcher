"use client";

import { useEffect, useRef } from "react";

import { parseEmbedMessage } from "@/lib/player/embedEvents";
import { setPlaybackProgress } from "@/lib/player/playerStore";

type MediaType = "movie" | "tv" | "anime";

type Props = {
  titleId: string;
  mediaType: MediaType;
  season?: number | null;
  episode?: number | null;
  onEpisodeEnded?: () => void;
};

const THROTTLE_MS = 15_000;

export const EmbedWatchRecorder = ({
  titleId,
  mediaType,
  season,
  episode,
  onEpisodeEnded
}: Props): null => {
  const lastSentAt = useRef(0);
  const lastProgress = useRef<{
    secondsWatched: number;
    progressPercent: number;
    completed: boolean;
  } | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    lastSentAt.current = 0;
    lastProgress.current = null;
    endedRef.current = false;

    const record = async (
      secondsWatched: number,
      progressPercent: number,
      completed = false
    ): Promise<void> => {
      lastProgress.current = {
        secondsWatched,
        progressPercent,
        completed
      };
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
            secondsWatched,
            progressPercent,
            completed
          })
        });
      } catch {
        // best-effort
      }
    };

    const maybeRecord = (
      secondsWatched: number,
      progressPercent: number,
      completed = false,
      force = false
    ): void => {
      const now = Date.now();
      if (!force && !completed && now - lastSentAt.current < THROTTLE_MS) return;
      lastSentAt.current = now;
      void record(secondsWatched, progressPercent, completed);
    };

    const onMessage = (event: MessageEvent): void => {
      const parsed = parseEmbedMessage(event.data);
      if (!parsed) return;

      if (parsed.kind === "complete") {
        if (endedRef.current) return;
        endedRef.current = true;
        const snapshot = lastProgress.current;
        maybeRecord(
          snapshot?.secondsWatched ?? 0,
          100,
          true,
          true
        );
        onEpisodeEnded?.();
        return;
      }

      if (parsed.kind === "progress" && parsed.progress) {
        const { currentTime, duration, progressPercent } = parsed.progress;
        setPlaybackProgress({ currentTime, duration, progressPercent });
        maybeRecord(Math.floor(currentTime), progressPercent);
      }
    };

    const onVisibility = (): void => {
      if (document.visibilityState !== "hidden") return;
      const snapshot = lastProgress.current;
      if (!snapshot || snapshot.completed) return;
      maybeRecord(
        snapshot.secondsWatched,
        snapshot.progressPercent,
        false,
        true
      );
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisibility);
      const snapshot = lastProgress.current;
      if (snapshot && !snapshot.completed && snapshot.progressPercent > 5) {
        void record(
          snapshot.secondsWatched,
          snapshot.progressPercent,
          false
        );
      }
    };
  }, [titleId, mediaType, season, episode, onEpisodeEnded]);

  return null;
};
