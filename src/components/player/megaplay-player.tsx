"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button, buttonVariants } from "@/components/ui/button";
import { parseEmbedMessage } from "@/lib/player/embedEvents";
import { cn } from "@/lib/utils";
import {
  applyMegaplayLanguage,
  type MegaplayLanguage
} from "@/lib/streaming/megaplay";

const LANGUAGE_KEY = "campusstream:anime-language";
const VIDKING_STALL_MS = 25_000;

type StreamProvider = "megaplay" | "vidking";

type Props = {
  embedUrls: string[];
  vidkingFallbackUrl?: string | null;
  poster?: string | null;
  titleId: string;
  hasSub: boolean;
  hasDub: boolean;
  episodeLabel?: string | null;
  nextEpisode?: number | null;
  onActiveSrcChange?: (src: string) => void;
};

export const MegaplayPlayer = ({
  embedUrls,
  vidkingFallbackUrl = null,
  poster,
  titleId,
  hasSub,
  hasDub,
  episodeLabel,
  nextEpisode = null,
  onActiveSrcChange
}: Props): JSX.Element => {
  const defaultLanguage: MegaplayLanguage = hasSub ? "sub" : "dub";
  const [language, setLanguage] = useState<MegaplayLanguage>(defaultLanguage);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [activeProvider, setActiveProvider] = useState<StreamProvider>("megaplay");
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [suggestAlternateLanguage, setSuggestAlternateLanguage] =
    useState(false);
  const probingRef = useRef(false);
  const vidkingProgressRef = useRef(false);
  const vidkingStallTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_KEY);
      if (stored === "sub" && hasSub) setLanguage("sub");
      if (stored === "dub" && hasDub) setLanguage("dub");
    } catch {
      // ignore
    }
  }, [hasSub, hasDub]);

  const languageUrls = useMemo(
    () => applyMegaplayLanguage(embedUrls, language),
    [embedUrls, language]
  );

  const activeSrc =
    activeProvider === "vidking"
      ? (vidkingFallbackUrl ?? "")
      : (languageUrls[sourceIndex] ?? languageUrls[0] ?? "");

  const clearVidkingStallTimer = useCallback((): void => {
    if (vidkingStallTimerRef.current != null) {
      window.clearTimeout(vidkingStallTimerRef.current);
      vidkingStallTimerRef.current = null;
    }
  }, []);

  const markPlaybackFailed = useCallback((): void => {
    setPlaybackFailed(true);
    if (language === "sub" && hasDub) setSuggestAlternateLanguage(true);
    if (language === "dub" && hasSub) setSuggestAlternateLanguage(true);
  }, [language, hasDub, hasSub]);

  const switchToVidkingFallback = useCallback((): boolean => {
    if (!vidkingFallbackUrl) return false;
    setActiveProvider("vidking");
    setSourceIndex(0);
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    vidkingProgressRef.current = false;
    onActiveSrcChange?.(vidkingFallbackUrl);
    return true;
  }, [onActiveSrcChange, vidkingFallbackUrl]);

  useEffect(() => {
    setSourceIndex(0);
    setActiveProvider("megaplay");
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    vidkingProgressRef.current = false;
    clearVidkingStallTimer();
  }, [clearVidkingStallTimer, languageUrls, vidkingFallbackUrl]);

  useEffect(() => {
    probingRef.current = false;
  }, [sourceIndex, activeSrc, activeProvider]);

  const tryNextSource = useCallback((): void => {
    if (activeProvider === "vidking") {
      markPlaybackFailed();
      return;
    }

    setSourceIndex((current) => {
      const next = current + 1;
      if (next < languageUrls.length) return next;
      if (switchToVidkingFallback()) return current;
      markPlaybackFailed();
      return current;
    });
  }, [
    activeProvider,
    languageUrls.length,
    markPlaybackFailed,
    switchToVidkingFallback
  ]);

  const probeCurrentSource = useCallback(async (): Promise<void> => {
    if (
      activeProvider !== "megaplay" ||
      !activeSrc ||
      probingRef.current ||
      playbackFailed
    ) {
      return;
    }
    probingRef.current = true;
    try {
      const response = await fetch(
        `/api/megaplay/probe?url=${encodeURIComponent(activeSrc)}`
      );
      if (!response.ok) return;
      const data = (await response.json()) as { ok?: boolean };
      if (!data.ok) tryNextSource();
    } catch {
      // best-effort
    } finally {
      probingRef.current = false;
    }
  }, [activeProvider, activeSrc, playbackFailed, tryNextSource]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      const parsed = parseEmbedMessage(event.data);
      if (!parsed) return;

      if (parsed.kind === "progress" || parsed.kind === "complete") {
        if (activeProvider === "vidking") {
          vidkingProgressRef.current = true;
          clearVidkingStallTimer();
        }
        return;
      }

      if (parsed.kind === "error") tryNextSource();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeProvider, clearVidkingStallTimer, tryNextSource]);

  useEffect(() => {
    clearVidkingStallTimer();
    if (activeProvider !== "vidking" || !activeSrc || playbackFailed) return;

    vidkingStallTimerRef.current = window.setTimeout(() => {
      if (!vidkingProgressRef.current) markPlaybackFailed();
    }, VIDKING_STALL_MS);

    return clearVidkingStallTimer;
  }, [
    activeProvider,
    activeSrc,
    clearVidkingStallTimer,
    markPlaybackFailed,
    playbackFailed
  ]);

  const selectLanguage = (next: MegaplayLanguage): void => {
    if (activeProvider === "vidking") return;
    setLanguage(next);
    setSuggestAlternateLanguage(false);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const alternateLanguage: MegaplayLanguage | null =
    language === "sub" && hasDub
      ? "dub"
      : language === "dub" && hasSub
        ? "sub"
        : null;

  const nextEpisodeHref =
    nextEpisode != null
      ? (`/anime/${titleId}/watch?e=${nextEpisode}` as Route)
      : null;

  const sourceLabel = activeProvider === "vidking" ? "Vidking" : "MegaPlay";
  const subDubApplicable = activeProvider === "megaplay";

  return (
    <div className="space-y-3">
      {!playbackFailed && activeSrc ? (
        <StreamingPlayer
          src={activeSrc}
          poster={poster}
          titleId={titleId}
          onEmbedLoad={() => {
            if (activeProvider === "megaplay") {
              void probeCurrentSource();
            }
          }}
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-black/80 px-6 text-center">
          <p className="text-sm font-medium text-fg">
            Playback unavailable for this{" "}
            {language === "sub" ? "subtitled" : "dubbed"} stream.
          </p>
          <p className="text-xs text-fg-muted">
            MegaPlay and Vidking could not play this episode. Try another audio
            track, episode, or check back later.
          </p>
        </div>
      )}

      {playbackFailed && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-fg">
            {suggestAlternateLanguage && alternateLanguage && subDubApplicable
              ? `This episode may be available in ${
                  alternateLanguage === "dub" ? "dub" : "sub"
                } instead.`
              : "Try another audio track, episode, or come back later."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestAlternateLanguage &&
              alternateLanguage &&
              subDubApplicable && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={() => selectLanguage(alternateLanguage)}
                >
                  Try {alternateLanguage === "dub" ? "Dub" : "Sub"}
                </Button>
              )}
            {nextEpisodeHref && (
              <Link
                href={nextEpisodeHref}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Try another episode
              </Link>
            )}
            <Link
              href={`/anime/${titleId}` as Route}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to series
            </Link>
          </div>
        </div>
      )}

      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-fg-faint uppercase">
            {activeProvider === "vidking" ? "Source" : "Audio"}
          </p>
          <p className="text-sm font-medium text-fg">
            {sourceLabel}
            {episodeLabel ? (
              <span className="text-fg-muted">  ·  {episodeLabel}</span>
            ) : null}
          </p>
          {activeProvider === "vidking" && (
            <p className="mt-0.5 text-xs text-fg-faint">
              Fallback stream via TMDB catalog
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === "sub" ? "primary" : "outline"}
            disabled={!hasSub || !subDubApplicable}
            onClick={() => selectLanguage("sub")}
            className={cn((!hasSub || !subDubApplicable) && "opacity-50")}
          >
            Sub
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "dub" ? "primary" : "outline"}
            disabled={!hasDub || !subDubApplicable}
            onClick={() => selectLanguage("dub")}
            className={cn((!hasDub || !subDubApplicable) && "opacity-50")}
          >
            Dub
          </Button>
        </div>
      </div>
    </div>
  );
};
