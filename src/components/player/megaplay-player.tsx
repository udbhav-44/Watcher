"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button, buttonVariants } from "@/components/ui/button";
import { parseEmbedMessage } from "@/lib/player/embedEvents";
import { cn } from "@/lib/utils";
import type { AnimeExtraServer } from "@/lib/streaming/animeServers";
import {
  applyMegaplayLanguage,
  type MegaplayLanguage
} from "@/lib/streaming/megaplay";

const LANGUAGE_KEY = "campusstream:anime-language";
const SERVER_KEY = "campusstream:preferred-provider";
const DIRECT_STALL_MS = 25_000;

const MEGAPLAY_ID = "megaplay";
const VIDKING_ID = "vidking";

type Props = {
  embedUrls: string[];
  vidkingFallbackUrl?: string | null;
  startWithVidking?: boolean;
  extraServers?: AnimeExtraServer[];
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
  extraServers = [],
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

  const hasMegaplay = embedUrls.length > 0;
  const hasVidkingFallback = Boolean(vidkingFallbackUrl);

  const availableExtras = useMemo(
    () => extraServers.filter((server) => server.urls.length > 0),
    [extraServers]
  );

  const firstAvailableId = useMemo((): string => {
    if (hasMegaplay) return MEGAPLAY_ID;
    if (availableExtras[0]) return availableExtras[0].id;
    if (hasVidkingFallback) return VIDKING_ID;
    return MEGAPLAY_ID;
  }, [availableExtras, hasMegaplay, hasVidkingFallback]);

  const [activeProvider, setActiveProvider] = useState<string>(() =>
    startWithVidking && vidkingFallbackUrl ? VIDKING_ID : firstAvailableId
  );
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [suggestAlternateLanguage, setSuggestAlternateLanguage] =
    useState(false);
  const probingRef = useRef(false);
  const directProgressRef = useRef(false);
  const stallTimerRef = useRef<number | null>(null);
  // The server the user last picked by hand. Drives the initial provider on
  // mount and survives episode navigation; null means "use the smart default".
  const preferredServerRef = useRef<string | null>(null);

  const activeExtra = useMemo(
    () => availableExtras.find((server) => server.id === activeProvider) ?? null,
    [availableExtras, activeProvider]
  );

  const subDubApplicable =
    activeProvider === MEGAPLAY_ID ||
    (activeExtra?.supportsLanguageToggle ?? false);

  /**
   * Pick the provider to start on. A manual preference wins when its source is
   * actually available, otherwise fall back to the probe-derived default that
   * keeps MegaPlay primary and only opens on Vidking when MegaPlay is dead.
   */
  const resolveDefaultProvider = useCallback((): string => {
    const preferred = preferredServerRef.current;
    if (preferred) {
      if (preferred === VIDKING_ID && vidkingFallbackUrl) return VIDKING_ID;
      if (preferred === MEGAPLAY_ID && hasMegaplay) return MEGAPLAY_ID;
      if (availableExtras.some((server) => server.id === preferred)) {
        return preferred;
      }
    }
    if (startWithVidking && vidkingFallbackUrl) return VIDKING_ID;
    return firstAvailableId;
  }, [
    availableExtras,
    firstAvailableId,
    hasMegaplay,
    startWithVidking,
    vidkingFallbackUrl
  ]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_KEY);
      if (stored === "sub" && hasSub) setLanguage("sub");
      if (stored === "dub" && hasDub) setLanguage("dub");
      const storedServer = window.localStorage.getItem(SERVER_KEY);
      if (storedServer) preferredServerRef.current = storedServer;
    } catch {
      // ignore
    }
  }, [hasSub, hasDub]);

  const megaplayLanguageUrls = useMemo(
    () => applyMegaplayLanguage(embedUrls, language),
    [embedUrls, language]
  );

  // URLs for whichever server is active, with the sub/dub path applied where
  // the provider supports it.
  const activeUrls = useMemo((): string[] => {
    if (activeProvider === VIDKING_ID) {
      return vidkingFallbackUrl ? [vidkingFallbackUrl] : [];
    }
    if (activeProvider === MEGAPLAY_ID) return megaplayLanguageUrls;
    if (activeExtra) {
      return activeExtra.supportsLanguageToggle
        ? applyMegaplayLanguage(activeExtra.urls, language)
        : activeExtra.urls;
    }
    return [];
  }, [activeProvider, activeExtra, language, megaplayLanguageUrls, vidkingFallbackUrl]);

  const activeSrc = activeUrls[sourceIndex] ?? activeUrls[0] ?? "";

  const clearStallTimer = useCallback((): void => {
    if (stallTimerRef.current != null) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const markPlaybackFailed = useCallback((): void => {
    setPlaybackFailed(true);
    if (language === "sub" && hasDub) setSuggestAlternateLanguage(true);
    if (language === "dub" && hasSub) setSuggestAlternateLanguage(true);
  }, [language, hasDub, hasSub]);

  const switchToVidkingFallback = useCallback((): boolean => {
    if (!vidkingFallbackUrl) return false;
    setActiveProvider(VIDKING_ID);
    setSourceIndex(0);
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    directProgressRef.current = false;
    onActiveSrcChange?.(vidkingFallbackUrl);
    return true;
  }, [onActiveSrcChange, vidkingFallbackUrl]);

  useEffect(() => {
    setSourceIndex(0);
    setActiveProvider(resolveDefaultProvider());
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
    directProgressRef.current = false;
    clearStallTimer();
  }, [clearStallTimer, megaplayLanguageUrls, resolveDefaultProvider]);

  useEffect(() => {
    probingRef.current = false;
  }, [sourceIndex, activeSrc, activeProvider]);

  // Keep the mini-player / watch history bound to whatever is actually playing,
  // regardless of how the source was chosen (manual switch or auto-fallback).
  useEffect(() => {
    if (activeSrc) onActiveSrcChange?.(activeSrc);
  }, [activeSrc, onActiveSrcChange]);

  const tryNextSource = useCallback((): void => {
    if (activeProvider === VIDKING_ID) {
      markPlaybackFailed();
      return;
    }

    setSourceIndex((current) => {
      const next = current + 1;
      if (next < activeUrls.length) return next;
      // MegaPlay exhausts to the Vidking fallback to preserve the original
      // anime fallback chain; other servers just surface the error panel.
      if (activeProvider === MEGAPLAY_ID && switchToVidkingFallback()) {
        return current;
      }
      markPlaybackFailed();
      return current;
    });
  }, [
    activeProvider,
    activeUrls.length,
    markPlaybackFailed,
    switchToVidkingFallback
  ]);

  const probeCurrentSource = useCallback(async (): Promise<void> => {
    if (
      activeProvider !== MEGAPLAY_ID ||
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
        // Any non-MegaPlay (direct iframe) server clears its stall watchdog as
        // soon as it reports progress; MegaPlay relies on the server probe.
        if (activeProvider !== MEGAPLAY_ID) {
          directProgressRef.current = true;
          clearStallTimer();
        }
        return;
      }

      if (parsed.kind === "error") tryNextSource();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeProvider, clearStallTimer, tryNextSource]);

  useEffect(() => {
    clearStallTimer();
    if (activeProvider === MEGAPLAY_ID || !activeSrc || playbackFailed) return;

    stallTimerRef.current = window.setTimeout(() => {
      if (!directProgressRef.current) markPlaybackFailed();
    }, DIRECT_STALL_MS);

    return clearStallTimer;
  }, [
    activeProvider,
    activeSrc,
    clearStallTimer,
    markPlaybackFailed,
    playbackFailed
  ]);

  const selectLanguage = (next: MegaplayLanguage): void => {
    if (!subDubApplicable) return;
    setLanguage(next);
    setSuggestAlternateLanguage(false);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const selectServer = (next: string): void => {
    if (next === activeProvider) return;
    if (next === VIDKING_ID && !vidkingFallbackUrl) return;
    if (next === MEGAPLAY_ID && !hasMegaplay) return;
    if (
      next !== VIDKING_ID &&
      next !== MEGAPLAY_ID &&
      !availableExtras.some((server) => server.id === next)
    ) {
      return;
    }
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
    directProgressRef.current = false;
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

  const activeLabel =
    activeProvider === VIDKING_ID
      ? "Vidking"
      : activeProvider === MEGAPLAY_ID
        ? "MegaPlay"
        : (activeExtra?.label ?? activeProvider);

  return (
    <div className="space-y-3">
      {!playbackFailed && activeSrc ? (
        <StreamingPlayer
          src={activeSrc}
          poster={poster}
          titleId={titleId}
          onEmbedLoad={() => {
            if (activeProvider === MEGAPLAY_ID) {
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
            This server could not load the episode. Try another server above, a
            different audio track, or another episode.
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
              : "Try another server, audio track, or episode."}
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
            {activeLabel}
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
              Set audio inside the {activeLabel} player controls
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
            variant={activeProvider === MEGAPLAY_ID ? "primary" : "outline"}
            disabled={!hasMegaplay}
            onClick={() => selectServer(MEGAPLAY_ID)}
            className={cn(!hasMegaplay && "opacity-50")}
            title={
              hasMegaplay
                ? "MegaPlay catalog stream (Sub/Dub tracks)"
                : "No MegaPlay match for this episode"
            }
          >
            MegaPlay
          </Button>
          {extraServers.map((server) => {
            const available = server.urls.length > 0;
            return (
              <Button
                key={server.id}
                type="button"
                size="sm"
                variant={activeProvider === server.id ? "primary" : "outline"}
                disabled={!available}
                onClick={() => selectServer(server.id)}
                className={cn(!available && "opacity-50")}
                title={
                  available
                    ? `${server.label} stream (Sub/Dub via path)`
                    : `No ${server.label} match for this episode`
                }
              >
                {server.label}
              </Button>
            );
          })}
          <Button
            type="button"
            size="sm"
            variant={activeProvider === VIDKING_ID ? "primary" : "outline"}
            disabled={!hasVidkingFallback}
            onClick={() => selectServer(VIDKING_ID)}
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
          MegaPlay and the other anime servers carry separate Sub and Dub
          tracks. Quality, captions, and any extra audio tracks can also be
          changed from the player&apos;s own settings (gear) menu.
        </p>
      </div>
    </div>
  );
};
