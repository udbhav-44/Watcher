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
const SERVER_KEY = "campusstream:preferred-provider";
const VIDKING_STALL_MS = 25_000;

type StreamProvider = "megaplay" | "vidking";

type Props = {
  embedUrls: string[];
  vidkingFallbackUrl?: string | null;
  startWithVidking?: boolean;
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
  startWithVidking = false,
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
  const [activeProvider, setActiveProvider] = useState<StreamProvider>(() =>
    startWithVidking && vidkingFallbackUrl ? "vidking" : "megaplay"
  );
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [suggestAlternateLanguage, setSuggestAlternateLanguage] =
    useState(false);
  const probingRef = useRef(false);
  const vidkingProgressRef = useRef(false);
  const vidkingStallTimerRef = useRef<number | null>(null);
  // The server the user last picked by hand. Drives the initial provider on
  // mount and survives episode navigation; null means "use the smart default".
  const preferredServerRef = useRef<StreamProvider | null>(null);

  /**
   * Pick the provider to start on. A manual preference wins when its source is
   * actually available, otherwise fall back to the probe-derived default that
   * keeps MegaPlay primary and only opens on Vidking when MegaPlay is dead.
   */
  const resolveDefaultProvider = useCallback((): StreamProvider => {
    const preferred = preferredServerRef.current;
    if (preferred === "vidking" && vidkingFallbackUrl) return "vidking";
    if (preferred === "megaplay") return "megaplay";
    return startWithVidking && vidkingFallbackUrl ? "vidking" : "megaplay";
  }, [startWithVidking, vidkingFallbackUrl]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_KEY);
      if (stored === "sub" && hasSub) setLanguage("sub");
      if (stored === "dub" && hasDub) setLanguage("dub");
      const storedServer = window.localStorage.getItem(SERVER_KEY);
      if (storedServer === "vidking" || storedServer === "megaplay") {
        preferredServerRef.current = storedServer;
      }
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
    setActiveProvider(resolveDefaultProvider());
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    vidkingProgressRef.current = false;
    clearVidkingStallTimer();
  }, [clearVidkingStallTimer, languageUrls, resolveDefaultProvider]);

  useEffect(() => {
    probingRef.current = false;
  }, [sourceIndex, activeSrc, activeProvider]);

  // Keep the mini-player / watch history bound to whatever is actually playing,
  // regardless of how the source was chosen (manual switch or auto-fallback).
  useEffect(() => {
    if (activeSrc) onActiveSrcChange?.(activeSrc);
  }, [activeSrc, onActiveSrcChange]);

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
      if (!response.ok) {
        tryNextSource();
        return;
      }
      const data = (await response.json()) as { ok?: boolean };
      if (!data.ok) tryNextSource();
    } catch {
      tryNextSource();
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

  const selectServer = (next: StreamProvider): void => {
    if (next === activeProvider) return;
    if (next === "vidking" && !vidkingFallbackUrl) return;
    preferredServerRef.current = next;
    try {
      window.localStorage.setItem(SERVER_KEY, next);
    } catch {
      // ignore
    }
    setActiveProvider(next);
    setSourceIndex(0);
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    vidkingProgressRef.current = false;
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
  const hasVidkingFallback = Boolean(vidkingFallbackUrl);

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
            Playback unavailable for this episode.
          </p>
          <p className="text-xs text-fg-muted">
            {hasVidkingFallback && subDubApplicable
              ? "MegaPlay could not load this episode and the Vidking fallback also failed. Try another episode or check back later."
              : hasVidkingFallback
                ? "Vidking could not play this episode. Try another episode or check back later."
                : "MegaPlay could not play this episode and no Vidking match was found. Try another episode or check back later."}
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

      <div className="glass-panel space-y-3 rounded-lg p-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-fg-faint uppercase">
            Now playing
          </p>
          <p className="text-sm font-medium text-fg">
            {sourceLabel}
            {subDubApplicable ? (
              <span className="text-fg-muted">
                {"  ·  "}
                {language === "dub" ? "Dub" : "Sub"}
              </span>
            ) : null}
            {episodeLabel ? (
              <span className="text-fg-muted">  ·  {episodeLabel}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs tracking-[0.18em] text-fg-faint uppercase">
            Audio
          </span>
          <Button
            type="button"
            size="sm"
            variant={language === "sub" && subDubApplicable ? "primary" : "outline"}
            disabled={!hasSub || !subDubApplicable}
            onClick={() => selectLanguage("sub")}
            className={cn((!hasSub || !subDubApplicable) && "opacity-50")}
          >
            Sub
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "dub" && subDubApplicable ? "primary" : "outline"}
            disabled={!hasDub || !subDubApplicable}
            onClick={() => selectLanguage("dub")}
            className={cn((!hasDub || !subDubApplicable) && "opacity-50")}
          >
            Dub
          </Button>
          {!subDubApplicable && (
            <span className="text-xs text-fg-faint">
              Set audio inside the Vidking player controls
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-14 shrink-0 text-xs tracking-[0.18em] text-fg-faint uppercase">
            Server
          </span>
          <Button
            type="button"
            size="sm"
            variant={activeProvider === "megaplay" ? "primary" : "outline"}
            onClick={() => selectServer("megaplay")}
          >
            MegaPlay
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeProvider === "vidking" ? "primary" : "outline"}
            disabled={!hasVidkingFallback}
            onClick={() => selectServer("vidking")}
            className={cn(!hasVidkingFallback && "opacity-50")}
            title={
              hasVidkingFallback
                ? "TMDB-catalog stream (carries its own audio)"
                : "No Vidking match for this episode"
            }
          >
            Vidking
          </Button>
        </div>

        <p className="text-xs text-fg-faint">
          MegaPlay carries separate Sub and Dub tracks. Quality, captions, and
          any extra audio tracks can also be changed from the player&apos;s own
          settings (gear) menu.
        </p>
      </div>
    </div>
  );
};
