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
          <p className="text-xs text-white/70">Loading player...</p>
        )}
        <iframe
          src={src}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          className="aspect-video w-full rounded-lg border border-white/10 bg-black"
          title="Campus stream player"
          onLoad={() => {
            setIframeLoading(false);
            setErrorMessage(null);
          }}
        />
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Open in new tab <ExternalLink className="h-4 w-4" />
        </a>
        {errorMessage && (
          <p className="text-xs text-amber-200/90">{errorMessage}</p>
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
        className="aspect-video w-full rounded-lg border border-white/10 bg-black"
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
      <div className="glass-panel flex flex-wrap items-center gap-3 rounded-xl p-3 text-sm text-white/80">
        <label className="flex items-center gap-2">
          Speed
          <select
            value={playbackRate}
            onChange={(event) => setPlaybackRate(event.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm"
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
            className="h-8 flex-1 rounded-md border border-white/15 bg-black/30 px-2 text-xs"
          />
        </label>
        {pipSupported && (
          <button
            type="button"
            onClick={togglePip}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/75 transition hover:bg-white/[0.08]"
          >
            <PictureInPicture2 className="h-3.5 w-3.5" />
            {pipActive ? "Exit PiP" : "Picture in picture"}
          </button>
        )}
      </div>
      {errorMessage && (
        <p className="text-xs text-amber-200/90">{errorMessage}</p>
      )}
    </div>
  );
};
