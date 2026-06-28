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
  applyAnimeLanguage,
  type AnimeLanguage
} from "@/lib/streaming/animeEmbed";

const LANGUAGE_KEY = "campusstream:anime-language";
const SERVER_KEY = "campusstream:preferred-provider";
const DIRECT_STALL_MS = 25_000;

const VIDKING_ID = "vidking";

type Props = {
  vidkingFallbackUrl?: string | null;
  startWithVidking?: boolean;
  defaultServerId?: string | null;
  servers?: AnimeExtraServer[];
  poster?: string | null;
  titleId: string;
  hasSub: boolean;
  hasDub: boolean;
  episodeLabel?: string | null;
  nextEpisode?: number | null;
  onActiveSrcChange?: (src: string) => void;
};

export const AnimePlayer = ({
  vidkingFallbackUrl = null,
  startWithVidking = false,
  defaultServerId = null,
  servers = [],
  poster,
  titleId,
  hasSub,
  hasDub,
  episodeLabel,
  nextEpisode = null,
  onActiveSrcChange
}: Props): JSX.Element => {
  const defaultLanguage: AnimeLanguage = hasSub ? "sub" : "dub";
  const [language, setLanguage] = useState<AnimeLanguage>(defaultLanguage);
  const [sourceIndex, setSourceIndex] = useState(0);

  const hasVidkingFallback = Boolean(vidkingFallbackUrl);

  const availableServers = useMemo(
    () => servers.filter((server) => server.urls.length > 0),
    [servers]
  );

  // Verified MAL-keyed server first, else Vidking when probed OK.
  const firstAvailableId = useMemo(
    (): string =>
      defaultServerId && availableServers.some((s) => s.id === defaultServerId)
        ? defaultServerId
        : (availableServers[0]?.id ?? VIDKING_ID),
    [availableServers, defaultServerId]
  );

  const [activeProvider, setActiveProvider] = useState<string>(() =>
    startWithVidking && vidkingFallbackUrl ? VIDKING_ID : firstAvailableId
  );
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [suggestAlternateLanguage, setSuggestAlternateLanguage] =
    useState(false);
  const directProgressRef = useRef(false);
  const stallTimerRef = useRef<number | null>(null);
  // The server the user last picked by hand. Drives the initial provider on
  // mount and survives episode navigation; null means "use the smart default".
  const preferredServerRef = useRef<string | null>(null);

  const activeServer = useMemo(
    () => availableServers.find((server) => server.id === activeProvider) ?? null,
    [availableServers, activeProvider]
  );

  const subDubApplicable = activeServer?.supportsLanguageToggle ?? false;

  /**
   * Pick the provider to start on. A manual preference wins when its source is
   * actually available; a stale value (e.g. the removed "megaplay") falls
   * through to the first available real server, then the Vidking fallback.
   */
  const resolveDefaultProvider = useCallback((): string => {
    const preferred = preferredServerRef.current;
    if (preferred) {
      if (preferred === VIDKING_ID && vidkingFallbackUrl) return VIDKING_ID;
      if (availableServers.some((server) => server.id === preferred)) {
        return preferred;
      }
    }
    if (startWithVidking && vidkingFallbackUrl) return VIDKING_ID;
    return firstAvailableId;
  }, [availableServers, firstAvailableId, startWithVidking, vidkingFallbackUrl]);

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

  // URLs for whichever server is active, with the sub/dub path applied where
  // the provider supports it.
  const activeUrls = useMemo((): string[] => {
    if (activeProvider === VIDKING_ID) {
      return vidkingFallbackUrl ? [vidkingFallbackUrl] : [];
    }
    if (activeServer) {
      return activeServer.supportsLanguageToggle
        ? applyAnimeLanguage(activeServer.urls, language)
        : activeServer.urls;
    }
    return [];
  }, [activeProvider, activeServer, language, vidkingFallbackUrl]);

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

  const tryNextSource = useCallback((): void => {
    if (activeProvider === VIDKING_ID) {
      markPlaybackFailed();
      return;
    }

    setSourceIndex((current) => {
      const next = current + 1;
      if (next < activeUrls.length) return next;
      markPlaybackFailed();
      return current;
    });
  }, [activeProvider, activeUrls.length, markPlaybackFailed]);

  useEffect(() => {
    setSourceIndex(0);
    setActiveProvider(resolveDefaultProvider());
    setPlaybackFailed(false);
    setSuggestAlternateLanguage(false);
    directProgressRef.current = false;
    clearStallTimer();
  }, [clearStallTimer, resolveDefaultProvider]);

  // Keep the mini-player / watch history bound to whatever is actually playing,
  // regardless of how the source was chosen (manual switch or auto-fallback).
  useEffect(() => {
    if (activeSrc) onActiveSrcChange?.(activeSrc);
  }, [activeSrc, onActiveSrcChange]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      const parsed = parseEmbedMessage(event.data);
      if (!parsed) return;

      if (parsed.kind === "progress" || parsed.kind === "complete") {
        // Any direct-iframe server clears its stall watchdog as soon as it
        // reports progress.
        directProgressRef.current = true;
        clearStallTimer();
        return;
      }

      if (parsed.kind === "error") tryNextSource();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [clearStallTimer, tryNextSource]);

  useEffect(() => {
    clearStallTimer();
    if (!activeSrc || playbackFailed) return;

    stallTimerRef.current = window.setTimeout(() => {
      if (!directProgressRef.current) markPlaybackFailed();
    }, DIRECT_STALL_MS);

    return clearStallTimer;
  }, [activeSrc, clearStallTimer, markPlaybackFailed, playbackFailed]);

  const selectLanguage = (next: AnimeLanguage): void => {
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
    if (
      next !== VIDKING_ID &&
      !availableServers.some((server) => server.id === next)
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
    directProgressRef.current = false;
  };

  const alternateLanguage: AnimeLanguage | null =
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
      : (activeServer?.label ?? activeProvider);

  return (
    <div className="space-y-3">
      {!playbackFailed && activeSrc ? (
        <StreamingPlayer src={activeSrc} poster={poster} titleId={titleId} />
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

        {(availableServers.length > 0 || hasVidkingFallback) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-xs tracking-[0.18em] text-fg-faint uppercase">
              Server
            </span>
            {availableServers.map((server) => (
              <Button
                key={server.id}
                type="button"
                size="sm"
                variant={activeProvider === server.id ? "primary" : "outline"}
                onClick={() => selectServer(server.id)}
                title={`${server.label} stream`}
              >
                {server.label}
              </Button>
            ))}
            {hasVidkingFallback && (
              <Button
                type="button"
                size="sm"
                variant={activeProvider === VIDKING_ID ? "primary" : "outline"}
                onClick={() => selectServer(VIDKING_ID)}
                title="TMDB-catalog stream (carries its own audio)"
              >
                Vidking
              </Button>
            )}
          </div>
        )}

        <p className="text-xs text-fg-faint">
          {availableServers.length > 0
            ? "MAL-keyed servers support Sub/Dub via the toggle above when available."
            : "Vidking maps this title to TMDB TV — use the player settings for audio and quality."}
        </p>
      </div>
    </div>
  );
};
