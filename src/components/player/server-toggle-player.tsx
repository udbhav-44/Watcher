"use client";

import { useEffect, useMemo, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button } from "@/components/ui/button";

type Provider = "playimdb" | "vidking";

type Props = {
  titleId: string;
  poster?: string | null;
  playImdbUrl: string;
  vidkingUrl: string | null;
  mediaType?: "movie" | "tv";
  episodeLabel?: string | null;
};

export const ServerTogglePlayer = ({
  titleId,
  poster,
  playImdbUrl,
  vidkingUrl,
  mediaType = "movie",
  episodeLabel
}: Props): JSX.Element => {
  const isTv = mediaType === "tv";
  const [provider, setProvider] = useState<Provider>(
    vidkingUrl ? "vidking" : "playimdb"
  );

  useEffect(() => {
    setProvider(vidkingUrl ? "vidking" : "playimdb");
  }, [vidkingUrl]);

  const activeUrl = useMemo(() => {
    if (provider === "playimdb") return playImdbUrl;
    return vidkingUrl ?? playImdbUrl;
  }, [playImdbUrl, provider, vidkingUrl]);

  return (
    <div className="space-y-3">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
        <div className="space-y-0.5">
          <p className="text-xs tracking-[0.15em] text-white/56 uppercase">
            Server
          </p>
          <p className="text-sm font-medium text-white/90">
            {provider === "playimdb" ? "PlayIMDb" : "Vidking"}
            {episodeLabel ? ` • ${episodeLabel}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={provider === "playimdb" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setProvider("playimdb")}
          >
            PlayIMDb
          </Button>
          <Button
            type="button"
            variant={provider === "vidking" ? "primary" : "ghost"}
            size="sm"
            disabled={!vidkingUrl}
            onClick={() => setProvider("vidking")}
          >
            Vidking
          </Button>
        </div>
      </div>
      {isTv && provider === "playimdb" && (
        <p className="text-xs text-amber-200/80">
          PlayIMDb opens the series page. Use Vidking for direct episode
          playback.
        </p>
      )}
      {!vidkingUrl && (
        <p className="text-xs text-amber-200/80">
          Vidking embed unavailable for this title.
        </p>
      )}
      <p className="text-xs text-white/55">
        Switch servers if playback stalls.
      </p>
      <StreamingPlayer src={activeUrl} poster={poster} titleId={titleId} />
    </div>
  );
};
