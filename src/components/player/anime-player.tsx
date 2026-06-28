"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button, buttonVariants } from "@/components/ui/button";
import { parseEmbedMessage } from "@/lib/player/embedEvents";
import type { AnimeExtraServer } from "@/lib/streaming/animeServers";

const SERVER_KEY = "campusstream:preferred-provider";

type Props = {
  defaultServerId?: string | null;
  servers?: AnimeExtraServer[];
  poster?: string | null;
  titleId: string;
  episodeLabel?: string | null;
  nextEpisode?: number | null;
  onActiveSrcChange?: (src: string) => void;
};

const hostFromUrl = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const originMatchesHost = (origin: string, host: string): boolean => {
  try {
    const originHost = new URL(origin).hostname.toLowerCase();
    return originHost === host || originHost.endsWith(`.${host}`);
  } catch {
    return false;
  }
};

export const AnimePlayer = ({
  defaultServerId = null,
  servers = [],
  poster,
  titleId,
  episodeLabel,
  nextEpisode = null,
  onActiveSrcChange
}: Props): JSX.Element => {
  const availableServers = useMemo(
    () => servers.filter((server) => server.urls.length > 0),
    [servers]
  );

  const firstAvailableId = useMemo(
    (): string | null =>
      defaultServerId && availableServers.some((s) => s.id === defaultServerId)
        ? defaultServerId
        : (availableServers[0]?.id ?? null),
    [availableServers, defaultServerId]
  );

  const preferredServerRef = useRef<string | null>(null);
  const failedServersRef = useRef<Set<string>>(new Set());

  const resolveDefaultProvider = useCallback((): string | null => {
    const preferred = preferredServerRef.current;
    if (
      preferred &&
      availableServers.some((server) => server.id === preferred)
    ) {
      return preferred;
    }
    return firstAvailableId;
  }, [availableServers, firstAvailableId]);

  const [activeProvider, setActiveProvider] = useState<string | null>(() =>
    firstAvailableId
  );
  const [embedWarning, setEmbedWarning] = useState<string | null>(null);

  const activeServer = useMemo(
    () => availableServers.find((server) => server.id === activeProvider) ?? null,
    [availableServers, activeProvider]
  );

  const activeSrc = activeServer?.urls[0] ?? "";
  const activeSrcHost = useMemo(() => hostFromUrl(activeSrc), [activeSrc]);

  useEffect(() => {
    try {
      const storedServer = window.localStorage.getItem(SERVER_KEY);
      if (storedServer) preferredServerRef.current = storedServer;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    failedServersRef.current = new Set();
    setActiveProvider(resolveDefaultProvider());
    setEmbedWarning(null);
  }, [resolveDefaultProvider, titleId, episodeLabel]);

  useEffect(() => {
    if (activeSrc) onActiveSrcChange?.(activeSrc);
  }, [activeSrc, onActiveSrcChange]);

  const selectServer = useCallback(
    (next: string): void => {
      if (next === activeProvider) return;
      if (!availableServers.some((server) => server.id === next)) return;

      preferredServerRef.current = next;
      try {
        window.localStorage.setItem(SERVER_KEY, next);
      } catch {
        // ignore
      }
      setActiveProvider(next);
      setEmbedWarning(null);
    },
    [activeProvider, availableServers]
  );

  const tryNextServer = useCallback((): void => {
    if (!activeProvider) return;
    failedServersRef.current.add(activeProvider);

    const nextServer = availableServers.find(
      (server) => !failedServersRef.current.has(server.id)
    );
    if (nextServer) {
      setEmbedWarning(
        `${activeServer?.label ?? "This server"} stopped — trying ${nextServer.label}.`
      );
      selectServer(nextServer.id);
      return;
    }

    setEmbedWarning(
      "This server reported a playback error. Pick another server below."
    );
  }, [activeProvider, activeServer?.label, availableServers, selectServer]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (!activeSrcHost || !originMatchesHost(event.origin, activeSrcHost)) {
        return;
      }

      const parsed = parseEmbedMessage(event.data);
      if (!parsed || parsed.kind !== "error") return;

      tryNextServer();
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeSrcHost, tryNextServer]);

  const nextEpisodeHref =
    nextEpisode != null
      ? (`/anime/${titleId}/watch?e=${nextEpisode}` as Route)
      : null;

  if (availableServers.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-black/80 px-6 text-center">
        <p className="text-sm font-medium text-fg">
          No streaming source found for this title.
        </p>
        <p className="text-xs text-fg-muted">
          We could not map this anime to a TMDB catalog entry. Try searching for
          it under Movies or TV, or pick another show.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeSrc ? (
        <StreamingPlayer
          key={activeSrc}
          src={activeSrc}
          poster={poster}
          titleId={titleId}
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-black/80 px-6 text-center">
          <p className="text-sm font-medium text-fg">
            No stream URL for this server.
          </p>
        </div>
      )}

      {embedWarning && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
          <p className="text-sm text-fg">{embedWarning}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableServers.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const currentIndex = availableServers.findIndex(
                    (server) => server.id === activeProvider
                  );
                  const next =
                    availableServers[
                      (currentIndex + 1) % availableServers.length
                    ];
                  if (next) selectServer(next.id);
                }}
              >
                Try next server
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
            {activeServer?.label ?? "—"}
            {episodeLabel ? (
              <span className="text-fg-muted">  ·  {episodeLabel}</span>
            ) : null}
          </p>
        </div>

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
              onClick={() => {
                failedServersRef.current.delete(server.id);
                selectServer(server.id);
              }}
              title={`${server.label} stream`}
            >
              {server.label}
            </Button>
          ))}
        </div>

        <p className="text-xs text-fg-faint">
          VidFast is the default for anime — Vidking often stops mid-episode.
          Audio, subtitles, and quality are in each player&apos;s settings menu
          (⚙). Subtitle timing is set by the stream provider.
        </p>
      </div>
    </div>
  );
};
