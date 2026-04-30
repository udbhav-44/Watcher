"use client";

import { useMemo, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button } from "@/components/ui/button";

type Provider = "playimdb" | "vidking";

type Props = {
  titleId: string;
  poster?: string | null;
  playImdbUrl: string;
  vidkingUrl: string | null;
};

export const ServerTogglePlayer = ({
  titleId,
  poster,
  playImdbUrl,
  vidkingUrl
}: Props): JSX.Element => {
  const [provider, setProvider] = useState<Provider>(
    vidkingUrl ? "vidking" : "playimdb"
  );

  const activeUrl = useMemo(() => {
    if (provider === "playimdb") return playImdbUrl;
    return vidkingUrl ?? playImdbUrl;
  }, [playImdbUrl, provider, vidkingUrl]);

  return (
    <div className="space-y-3">
      <div className="glass-panel flex items-center justify-between rounded-lg p-3">
        <div>
          <p className="text-xs tracking-[0.15em] text-white/56 uppercase">
            Server
          </p>
          <p className="text-sm font-medium text-white/90">
            {provider === "playimdb" ? "PlayIMDb" : "Vidking"} - {titleId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={provider === "playimdb" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setProvider("playimdb")}
          >
            PlayIMDb
          </Button>
          <Button
            variant={provider === "vidking" ? "primary" : "ghost"}
            size="sm"
            disabled={!vidkingUrl}
            onClick={() => setProvider("vidking")}
          >
            Vidking
          </Button>
        </div>
      </div>
      {!vidkingUrl && (
        <p className="text-xs text-amber-200/80">
          Vidking needs IMDb-to-TMDB mapping. Add `TMDB_API_KEY` in `.env.local`
          to auto-resolve unsupported titles.
        </p>
      )}
      <p className="text-xs text-white/55">
        Switch servers if playback stalls.
      </p>
      <StreamingPlayer src={activeUrl} poster={poster} titleId={titleId} />
    </div>
  );
};
