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

type Props = {
  embedUrls: string[];
  poster?: string | null;
  titleId: string;
  hasSub: boolean;
  hasDub: boolean;
  episodeLabel?: string | null;
  nextEpisode?: number | null;
};

export const MegaplayPlayer = ({
  embedUrls,
  poster,
  titleId,
  hasSub,
  hasDub,
  episodeLabel,
  nextEpisode = null
}: Props): JSX.Element => {
  const defaultLanguage: MegaplayLanguage = hasSub ? "sub" : "dub";
  const [language, setLanguage] = useState<MegaplayLanguage>(defaultLanguage);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [allSourcesFailed, setAllSourcesFailed] = useState(false);
  const [suggestAlternateLanguage, setSuggestAlternateLanguage] =
    useState(false);
  const probingRef = useRef(false);

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

  const activeSrc = languageUrls[sourceIndex] ?? languageUrls[0] ?? "";

  useEffect(() => {
    setSourceIndex(0);
    setAllSourcesFailed(false);
    setSuggestAlternateLanguage(false);
    probingRef.current = false;
  }, [languageUrls]);

  useEffect(() => {
    probingRef.current = false;
  }, [sourceIndex, activeSrc]);

  const tryNextSource = useCallback((): void => {
    setSourceIndex((current) => {
      const next = current + 1;
      if (next < languageUrls.length) return next;
      setAllSourcesFailed(true);
      if (language === "sub" && hasDub) setSuggestAlternateLanguage(true);
      if (language === "dub" && hasSub) setSuggestAlternateLanguage(true);
      return current;
    });
  }, [language, languageUrls.length, hasDub, hasSub]);

  const probeCurrentSource = useCallback(async (): Promise<void> => {
    if (!activeSrc || probingRef.current || allSourcesFailed) return;
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
  }, [activeSrc, allSourcesFailed, tryNextSource]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      const parsed = parseEmbedMessage(event.data);
      if (parsed?.kind === "error") tryNextSource();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tryNextSource]);

  const selectLanguage = (next: MegaplayLanguage): void => {
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

  return (
    <div className="space-y-3">
      {!allSourcesFailed && activeSrc ? (
        <StreamingPlayer
          src={activeSrc}
          poster={poster}
          titleId={titleId}
          onEmbedLoad={() => {
            void probeCurrentSource();
          }}
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-black/80 px-6 text-center">
          <p className="text-sm font-medium text-fg">
            Playback unavailable for this{" "}
            {language === "sub" ? "subtitled" : "dubbed"} stream.
          </p>
          <p className="text-xs text-fg-muted">
            MegaPlay could not resolve this episode after trying catalog, MAL,
            and AniList sources.
          </p>
        </div>
      )}

      {allSourcesFailed && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-fg">
            {suggestAlternateLanguage && alternateLanguage
              ? `This episode may be available in ${
                  alternateLanguage === "dub" ? "dub" : "sub"
                } instead.`
              : "Try another audio track, episode, or come back later."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestAlternateLanguage && alternateLanguage && (
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
            Audio
          </p>
          <p className="text-sm font-medium text-fg">
            MegaPlay
            {episodeLabel ? (
              <span className="text-fg-muted">  ·  {episodeLabel}</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === "sub" ? "primary" : "outline"}
            disabled={!hasSub}
            onClick={() => selectLanguage("sub")}
            className={cn(!hasSub && "opacity-50")}
          >
            Sub
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "dub" ? "primary" : "outline"}
            disabled={!hasDub}
            onClick={() => selectLanguage("dub")}
            className={cn(!hasDub && "opacity-50")}
          >
            Dub
          </Button>
        </div>
      </div>
    </div>
  );
};
