"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import { Maximize2, Minimize2, Pause, Play, X } from "lucide-react";

import {
  closePlayer,
  setMinimized,
  usePlayerState
} from "@/lib/player/playerStore";
import { watchHrefFor } from "@/lib/catalog/titleId";

const STORAGE_KEY = "mini-player-frame";
const MIN_WIDTH = 240;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 320;
const APPROX_CHROME_HEIGHT = 52; // drag strip + title bar combined
const MARGIN = 16;

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
  const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, frame.w));
  const h = heightFromWidth(w);
  return {
    w,
    x: Math.max(0, Math.min(Math.max(0, viewport.w - w), frame.x)),
    y: Math.max(0, Math.min(Math.max(0, viewport.h - h), frame.y))
  };
};

const loadFrame = (): Frame | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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
  const w = DEFAULT_WIDTH;
  const h = heightFromWidth(w);
  return {
    w,
    x: Math.max(MARGIN, window.innerWidth - w - MARGIN),
    y: Math.max(MARGIN, window.innerHeight - h - MARGIN)
  };
};

export const MiniPlayerHost = (): JSX.Element | null => {
  const { active, minimized } = usePlayerState();
  const pathname = usePathname();
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [interacting, setInteracting] = useState<InteractionMode | null>(null);
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
      return;
    }
    setMinimized(true);
  }, [active, pathname]);

  // Initialize frame on mount (client-only, avoids hydration mismatch).
  useEffect(() => {
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
  }, []);

  const persist = useCallback((next: Frame): void => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // sessionStorage may be unavailable (private modes); ignore.
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
        // Resize from bottom-right corner: width follows the diagonal.
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

  if (!active || !minimized || !frame) return null;

  const watchHref = `${watchHrefFor(active.titleId)}${
    active.mediaType === "tv" && active.season && active.episode
      ? `?s=${active.season}&e=${active.episode}`
      : active.mediaType === "anime" && active.episode
        ? `?e=${active.episode}`
        : ""
  }`;

  return (
    <div
      className="fixed z-40 select-none overflow-hidden rounded-xl border border-border bg-overlay shadow-lift backdrop-blur"
      style={{ left: frame.x, top: frame.y, width: frame.w }}
    >
      {/* Drag handle: thin strip on top with a centered grab bar */}
      <div
        role="presentation"
        onPointerDown={startInteraction("drag")}
        className={`flex h-3 w-full items-center justify-center ${
          interacting === "drag" ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label="Drag to move mini-player"
      >
        <div className="h-0.5 w-8 rounded-full bg-fg/25" />
      </div>
      <div className="relative aspect-video w-full bg-black">
        {!paused && (
          <iframe
            key={`${active.titleId}-${active.season ?? ""}-${active.episode ?? ""}`}
            src={active.src}
            /* See StreamingPlayer for why this iframe is intentionally not sandboxed. */
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
            className="h-full w-full border-0 bg-black"
            title={`${active.title} mini player`}
          />
        )}
        {paused && (
          <div className="flex h-full w-full items-center justify-center text-sm text-fg-muted">
            Paused
          </div>
        )}
        {/* Block iframe from swallowing pointer events while user is dragging or resizing */}
        {interacting && <div className="absolute inset-0 cursor-grabbing" />}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-fg-muted">
        <Link
          href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
          className="line-clamp-1 text-fg hover:underline"
        >
          {active.title}
          {active.mediaType === "tv" && active.season && active.episode
            ? `  ·  S${active.season}E${active.episode}`
            : active.mediaType === "anime" && active.episode
              ? `  ·  Ep ${active.episode}`
              : ""}
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="rounded-full p-1 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
            aria-label={paused ? "Resume mini-player" : "Pause mini-player"}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
          <Link
            href={watchHref as `/watch/${string}` | `/tv/${string}/watch`}
            className="rounded-full p-1 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
            aria-label="Open full player"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="rounded-full p-1 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
            aria-label="Hide mini-player"
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => closePlayer()}
            className="rounded-full p-1 text-fg-muted transition hover:bg-fg/10 hover:text-fg"
            aria-label="Close mini-player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Resize handle: bottom-right diagonal grip */}
      <div
        role="presentation"
        onPointerDown={startInteraction("resize")}
        aria-label="Resize mini-player"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        style={{
          background:
            "linear-gradient(135deg, transparent 55%, rgba(255,255,255,0.28) 55%)"
        }}
      />
    </div>
  );
};
