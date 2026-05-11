"use client";

import Hls from "hls.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, PictureInPicture2 } from "lucide-react";

import { useToast } from "@/components/ui/toast";

type Props = {
  src: string;
  poster?: string | null;
  titleId?: string;
};

const VOLUME_KEY = "campusstream:volume";

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

export const StreamingPlayer = ({
  src,
  poster,
  titleId
}: Props): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchTickerRef = useRef<number | null>(null);
  const isDirectMedia = /\.(m3u8|mp4|webm|ogg)(\?.*)?$/i.test(src);
  const [playbackRate, setPlaybackRate] = useState("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(!isDirectMedia);
  const [subtitleUrl, setSubtitleUrl] = useState("");
  const [pipSupported, setPipSupported] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const trackId = useMemo(() => `track-${titleId ?? "default"}`, [titleId]);
  const toast = useToast();

  useEffect(() => {
    setPipSupported(
      typeof document !== "undefined" &&
        Boolean((document as Document).pictureInPictureEnabled)
    );
  }, []);

  useEffect(() => {
    if (!isDirectMedia) return;

    const video = videoRef.current;
    if (!video) return;

    const storedVolume = window.localStorage.getItem(VOLUME_KEY);
    if (storedVolume) {
      const parsed = Number(storedVolume);
      if (Number.isFinite(parsed)) {
        video.volume = Math.min(1, Math.max(0, parsed));
      }
    }

    const onVolumeChange = (): void => {
      window.localStorage.setItem(VOLUME_KEY, String(video.volume));
    };
    video.addEventListener("volumechange", onVolumeChange);

    const onEnterPip = (): void => setPipActive(true);
    const onLeavePip = (): void => setPipActive(false);
    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);

    const hydrateResumePoint = async (): Promise<void> => {
      if (!titleId) return;
      const response = await fetch("/api/watch-events");
      if (!response.ok) return;
      const data = (await response.json()) as {
        events?: Array<{ titleId: string; secondsWatched: number }>;
      };
      const entry = (data.events ?? []).find(
        (event) => event.titleId === titleId
      );
      if (entry && entry.secondsWatched > 10) {
        video.currentTime = entry.secondsWatched;
        toast.info(`Resumed at ${formatTime(entry.secondsWatched)}`);
      }
    };

    void hydrateResumePoint();

    if (Hls.isSupported() && src.endsWith(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, () =>
        setErrorMessage("Playback stream error. Try another server.")
      );
      return () => {
        video.removeEventListener("volumechange", onVolumeChange);
        video.removeEventListener("enterpictureinpicture", onEnterPip);
        video.removeEventListener("leavepictureinpicture", onLeavePip);
        hls.destroy();
      };
    }

    video.src = src;
    const onError = (): void =>
      setErrorMessage("Video failed to load. Try the alternate server.");
    video.addEventListener("error", onError);

    watchTickerRef.current = window.setInterval(() => {
      if (!titleId || video.paused || video.ended) return;
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : 0;
      const progressPercent = duration
        ? (video.currentTime / duration) * 100
        : 0;
      void fetch("/api/watch-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleId,
          secondsWatched: Math.floor(video.currentTime),
          progressPercent,
          completed: progressPercent > 95
        })
      });
    }, 15000);

    return () => {
      video.removeEventListener("error", onError);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
      if (watchTickerRef.current) {
        window.clearInterval(watchTickerRef.current);
        watchTickerRef.current = null;
      }
    };
  }, [isDirectMedia, titleId, src, toast]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = Number(playbackRate);
  }, [playbackRate]);

  useEffect(
    () => () => {
      if (watchTickerRef.current) window.clearInterval(watchTickerRef.current);
    },
    []
  );

  useEffect(() => {
    if (isDirectMedia) return;
    setIframeLoading(true);
    setErrorMessage(null);
    const timer = window.setTimeout(() => {
      setIframeLoading(false);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [isDirectMedia, src]);

  const togglePip = async (): Promise<void> => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (pipActive) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      toast.error("Picture-in-picture not available right now");
    }
  };

  if (!isDirectMedia) {
    return (
      <div className="space-y-3">
        {iframeLoading && (
          <p className="text-xs text-fg-muted">Loading player...</p>
        )}
        <iframe
          src={src}
          /*
           * No `sandbox` attribute on purpose. Every free aggregator we
           * support runs anti-sandbox detection scripts and shows an
           * "Iframe Sandbox Detected" page if any sandbox attribute is
           * present — there is no token combination that satisfies them
           * AND blocks parent-tab navigation. Ad-redirect mitigation
           * therefore lives elsewhere:
           *   - referrerPolicy keeps the embed from knowing exactly which
           *     campus page sent the request.
           *   - The provider list is ordered by empirical ad quality and
           *     the chip UI nudges users toward greener servers first.
           *   - The UI explicitly recommends uBlock Origin as the proper
           *     fix for residual pop-ups.
           */
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="no-referrer"
          loading="lazy"
          className="aspect-video w-full rounded-lg border border-border bg-black"
          title="Campus stream player"
          onLoad={() => {
            setIframeLoading(false);
            setErrorMessage(null);
          }}
        />
        {errorMessage && (
          <p className="text-xs text-warning">{errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster ?? undefined}
        className="aspect-video w-full rounded-lg border border-border bg-black"
      >
        {subtitleUrl && (
          <track
            id={trackId}
            label="English"
            kind="subtitles"
            srcLang="en"
            src={subtitleUrl}
            default
          />
        )}
      </video>
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm text-fg-muted">
        <label className="flex items-center gap-2">
          Speed
          <select
            value={playbackRate}
            onChange={(event) => setPlaybackRate(event.target.value)}
            className="rounded-md border border-border bg-black/30 px-2 py-1 text-sm text-fg focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>
        </label>
        <label className="flex min-w-[280px] items-center gap-2">
          Subtitle URL
          <input
            value={subtitleUrl}
            onChange={(event) => setSubtitleUrl(event.target.value)}
            placeholder="https://.../captions.vtt"
            className="h-8 flex-1 rounded-md border border-border bg-black/30 px-2 text-xs text-fg placeholder:text-fg-faint focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          />
        </label>
        {pipSupported && (
          <button
            type="button"
            onClick={togglePip}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
          >
            <PictureInPicture2 className="h-3.5 w-3.5" />
            {pipActive ? "Exit PiP" : "Picture in picture"}
          </button>
        )}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-fg"
        >
          Open in new tab
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {errorMessage && <p className="text-xs text-warning">{errorMessage}</p>}
    </div>
  );
};
