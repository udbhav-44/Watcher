"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

import {
  closePlayer,
  setMinimized,
  setPlayerPaused,
  setPlayerVolume,
  usePlayerState
} from "@/lib/player/playerStore";
import { watchHrefFor } from "@/lib/catalog/titleId";

const STORAGE_KEY = "mini-player-frame";
const MIN_WIDTH = 280;
const MAX_WIDTH = 960;
const DEFAULT_WIDTH = 420;
const APPROX_CHROME_HEIGHT = 88;
const MARGIN = 12;

type Frame = { x: number; y: number; w: number };
type InteractionMode = "drag" | "resize";

const isWatchPath = (pathname: string | null, titleId: string): boolean => {
  if (!pathname) return false;
  return (
    pathname === `/watch/${titleId}` ||
    pathname === `/tv/${titleId}/watch` ||
    pathname.startsWith(`/tv/${titleId}/watch`) ||
    pathname === `/anime/${titleId}/watch` ||
    pathname.startsWith(`/anime/${titleId}/watch`)
  );
};

const heightFromWidth = (w: number): number =>
  Math.round((w * 9) / 16) + APPROX_CHROME_HEIGHT;

const clampFrame = (
  frame: Frame,
  viewport: { w: number; h: number }
): Frame => {
  const isMobile = viewport.w < 768;
  const maxW = isMobile ? viewport.w - MARGIN * 2 : MAX_WIDTH;
  const minW = isMobile ? Math.min(viewport.w - MARGIN * 2, MIN_WIDTH) : MIN_WIDTH;
  const w = Math.max(minW, Math.min(maxW, frame.w));
  const h = heightFromWidth(w);
  return {
    w,
    x: Math.max(0, Math.min(Math.max(0, viewport.w - w), frame.x)),
    y: Math.max(0, Math.min(Math.max(0, viewport.h - h), frame.y))
  };
};

const loadFrame = (): Frame | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Frame>;
    if (
      typeof parsed.x !== "number" ||
      typeof parsed.y !== "number" ||
      typeof parsed.w !== "number"
    )
      return null;
    return { x: parsed.x, y: parsed.y, w: parsed.w };
  } catch {
    return null;
  }
};

const defaultFrame = (): Frame => {
  const isMobile = window.innerWidth < 768;
  const w = isMobile
    ? Math.min(window.innerWidth - MARGIN * 2, DEFAULT_WIDTH)
    : DEFAULT_WIDTH;
  const h = heightFromWidth(w);
  return {
    w,
    x: isMobile ? MARGIN : Math.max(MARGIN, window.innerWidth - w - MARGIN),
    y: isMobile
      ? Math.max(MARGIN, window.innerHeight - h - MARGIN - 64)
      : Math.max(MARGIN, window.innerHeight - h - MARGIN)
  };
};

/** Best-effort embed control via postMessage — may be ignored cross-origin. */
const postToEmbed = (
  iframe: HTMLIFrameElement | null,
  payload: Record<string, unknown>
): void => {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(payload, "*");
    iframe.contentWindow.postMessage({ type: "PLAYER_EVENT", ...payload }, "*");
  } catch {
    // cross-origin
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const MiniPlayerHost = (): JSX.Element | null => {
  const { active, minimized, playback, paused, volume } = usePlayerState();
  const pathname = usePathname();
  const [frame, setFrame] = useState<Frame | null>(null);
  const [interacting, setInteracting] = useState<InteractionMode | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const interactionRef = useRef<{
    mode: InteractionMode;
    startX: number;
    startY: number;
    startFrame: Frame;
  } | null>(null);

  useEffect(() => {
    if (!active) return;
    if (isWatchPath(pathname, active.titleId)) {
      setMinimized(false);
      setPlayerPaused(false);
      return;
    }
    setMinimized(true);
  }, [active, pathname]);

  useEffect(() => {
    if (!active || !minimized) return;
    const initial = loadFrame() ?? defaultFrame();
    setFrame(
      clampFrame(initial, { w: window.innerWidth, h: window.innerHeight })
    );
    const onResize = (): void => {
      setFrame((prev) =>
        prev
          ? clampFrame(prev, { w: window.innerWidth, h: window.innerHeight })
          : prev
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, minimized]);

  const persist = useCallback((next: Frame): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const startInteraction = useCallback(
    (mode: InteractionMode) =>
      (event: ReactPointerEvent<HTMLElement>): void => {
        if (!frame) return;
        if (event.button !== 0 && event.pointerType === "mouse") return;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        interactionRef.current = {
          mode,
          startX: event.clientX,
          startY: event.clientY,
          startFrame: frame
        };
        setInteracting(mode);
      },
    [frame]
  );

  useEffect(() => {
    if (!interacting) return;
    const handleMove = (event: PointerEvent): void => {
      const info = interactionRef.current;
      if (!info) return;
      const dx = event.clientX - info.startX;
      const dy = event.clientY - info.startY;
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      if (info.mode === "drag") {
        setFrame(
          clampFrame(
            {
              ...info.startFrame,
              x: info.startFrame.x + dx,
              y: info.startFrame.y + dy
            },
            viewport
          )
        );
      } else {
        const widened = info.startFrame.w + Math.max(dx, dy);
        setFrame(clampFrame({ ...info.startFrame, w: widened }, viewport));
      }
    };
    const handleEnd = (): void => {
      interactionRef.current = null;
      setInteracting(null);
      setFrame((current) => {
        if (current) persist(current);
        return current;
      });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [interacting, persist]);

  const togglePause = (): void => {
    const next = !paused;
    setPlayerPaused(next);
    postToEmbed(iframeRef.current, {
      event: next ? "pause" : "play",
      type: next ? "pause" : "play"
    });
  };

  const skipBack = (): void => {
    const current = playback?.currentTime ?? 0;
    const target = Math.max(0, current - 10);
    postToEmbed(iframeRef.current, {
      event: "seek",
      type: "seek",
      currentTime: target,
      time: target
    });
  };

  const toggleMute = (): void => {
    const next = volume > 0 ? 0 : 1;
    setPlayerVolume(next);
    postToEmbed(iframeRef.current, {
      event: "volume",
      type: "volume",
      volume: next,
      muted: next === 0
    });
  };

  const seekTo = (percent: number): void => {
    const duration = playback?.duration ?? 0;
    if (duration <= 0) return;
    const target = (percent / 100) * duration;
    postToEmbed(iframeRef.current, {
      event: "seek",
      type: "seek",
      currentTime: target,
      time: target
    });
  };

  if (!active || !minimized || !frame) return null;

  const watchHref = `${watchHrefFor(active.titleId)}${
    active.mediaType === "tv" && active.season && active.episode
      ? `?s=${active.season}&e=${active.episode}`
      : active.mediaType === "anime" && active.episode
        ? `?e=${active.episode}`
        : ""
  }`;

  const progress = playback?.progressPercent ?? 0;
  const poster = active.poster;
  const showPosterOverlay = paused && poster;

  return (
    <div
      className="fixed z-40 select-none overflow-hidden rounded-xl border border-border bg-overlay shadow-lift backdrop-blur touch-none sm:touch-auto"
      style={{ left: frame.x, top: frame.y, width: frame.w }}
    >
      <div
        role="presentation"
        onPointerDown={startInteraction("drag")}
        className={`flex h-4 w-full items-center justify-center ${
          interacting === "drag" ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Drag to move mini-player"
      >
        <div className="h-1 w-10 rounded-full bg-fg/25" />
      </div>
      <div className="relative aspect-video w-full bg-black">
        <iframe
          ref={iframeRef}
          key={`${active.titleId}-${active.season ?? ""}-${active.episode ?? ""}`}
          src={active.src}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="no-referrer"
          className={`h-full w-full border-0 bg-black ${showPosterOverlay ? "invisible" : ""}`}
          title={`${active.title} mini player`}
        />
        {showPosterOverlay && (
          <div className="absolute inset-0">
            <Image
              src={poster}
              alt={active.title}
              fill
              className="object-cover"
              sizes={`${frame.w}px`}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Pause className="h-10 w-10 text-fg/80" />
            </div>
          </div>
        )}
        {interacting && <div className="absolute inset-0 cursor-grabbing" />}
      </div>

      <div className="space-y-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={progress}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-fg/15 accent-accent"
            aria-label="Playback progress"
            title="Seek may not work in cross-origin embeds"
          />
          {playback && playback.duration > 0 && (
            <span className="shrink-0 text-[10px] text-fg-faint tabular-nums">
              {formatTime(playback.currentTime)} / {formatTime(playback.duration)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
          <Link
            href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
            className="line-clamp-1 min-w-0 flex-1 text-fg hover:underline"
          >
            {active.title}
            {active.mediaType === "tv" && active.season && active.episode
              ? `  ·  S${active.season}E${active.episode}`
              : active.mediaType === "anime" && active.episode
                ? `  ·  Ep ${active.episode}`
                : ""}
          </Link>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={skipBack}
              className="rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
              aria-label="Skip back 10 seconds"
              title="Skip back 10s (provider-dependent)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
              aria-label={paused ? "Resume mini-player" : "Pause mini-player"}
            >
              {paused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
              aria-label={volume > 0 ? "Mute" : "Unmute"}
              title="Volume control is provider-dependent"
            >
              {volume > 0 ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>
            <Link
              href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
              className="rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
              aria-label="Open full player"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMinimized(false)}
              className="hidden rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg sm:inline-flex"
              aria-label="Hide mini-player"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => closePlayer()}
              className="rounded-full p-1.5 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
              aria-label="Close mini-player"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        role="presentation"
        onPointerDown={startInteraction("resize")}
        aria-label="Resize mini-player"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-nwse-resize"
        style={{
          background:
            "linear-gradient(135deg, transparent 55%, rgba(255,255,255,0.28) 55%)"
        }}
      />
    </div>
  );
};
