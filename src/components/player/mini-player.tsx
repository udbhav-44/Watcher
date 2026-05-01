"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, X } from "lucide-react";

import {
  closePlayer,
  setMinimized,
  usePlayerState
} from "@/lib/player/playerStore";
import { watchHrefFor } from "@/lib/catalog/titleId";

const isWatchPath = (pathname: string | null, titleId: string): boolean => {
  if (!pathname) return false;
  return (
    pathname === `/watch/${titleId}` ||
    pathname === `/tv/${titleId}/watch` ||
    pathname.startsWith(`/tv/${titleId}/watch`)
  );
};

export const MiniPlayerHost = (): JSX.Element | null => {
  const { active, minimized } = usePlayerState();
  const pathname = usePathname();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (isWatchPath(pathname, active.titleId)) {
      setMinimized(false);
      return;
    }
    setMinimized(true);
  }, [active, pathname]);

  if (!active || !minimized) return null;

  const watchHref = `${watchHrefFor(active.titleId)}${
    active.mediaType === "tv" && active.season && active.episode
      ? `?s=${active.season}&e=${active.episode}`
      : ""
  }`;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] overflow-hidden rounded-xl border border-white/15 bg-[#0d0d0d]/95 shadow-2xl backdrop-blur">
      <div className="relative aspect-video w-full bg-black">
        {!paused && (
          <iframe
            key={`${active.titleId}-${active.season ?? ""}-${active.episode ?? ""}`}
            src={active.src}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="origin"
            className="h-full w-full border-0 bg-black"
            title={`${active.title} mini player`}
          />
        )}
        {paused && (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/60">
            Paused
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-white/80">
        <Link
          href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
          className="line-clamp-1 hover:underline"
        >
          {active.title}
          {active.mediaType === "tv" && active.season && active.episode
            ? ` · S${active.season}E${active.episode}`
            : ""}
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded-full p-1 text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label={paused ? "Resume mini-player" : "Pause mini-player"}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <Link
            href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
            className="rounded-full p-1 text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Open full player"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-full p-1 text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Hide mini-player"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => closePlayer()}
            className="rounded-full p-1 text-white/65 transition hover:bg-white/10 hover:text-white"
            aria-label="Close mini-player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
