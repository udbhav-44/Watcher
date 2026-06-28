"use client";

import { useCallback, useState } from "react";

import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { AnimePlayer } from "@/components/player/anime-player";
import type { AnimeExtraServer } from "@/lib/streaming/animeServers";

type Props = {
  titleId: string;
  title: string;
  initialSrc: string;
  poster?: string | null;
  episode: number;
  episodeName?: string | null;
  vidkingFallbackUrl?: string | null;
  startWithVidking?: boolean;
  defaultServerId?: string | null;
  servers?: AnimeExtraServer[];
  hasSub: boolean;
  hasDub: boolean;
  episodeLabel?: string | null;
  nextEpisode?: number | null;
};

export const AnimePlayerSection = ({
  titleId,
  title,
  initialSrc,
  poster,
  episode,
  episodeName,
  vidkingFallbackUrl,
  startWithVidking = false,
  defaultServerId = null,
  servers = [],
  hasSub,
  hasDub,
  episodeLabel,
  nextEpisode
}: Props): JSX.Element => {
  const [activeSrc, setActiveSrc] = useState(initialSrc);
  const onActiveSrcChange = useCallback((src: string) => {
    setActiveSrc(src);
  }, []);

  return (
    <>
      <ActivePlayerBinder
        titleId={titleId}
        title={title}
        src={activeSrc}
        poster={poster ?? null}
        mediaType="anime"
        episode={episode}
        episodeName={episodeName ?? null}
      />
      <AnimePlayer
        vidkingFallbackUrl={vidkingFallbackUrl}
        startWithVidking={startWithVidking}
        defaultServerId={defaultServerId}
        servers={servers}
        poster={poster}
        titleId={titleId}
        hasSub={hasSub}
        hasDub={hasDub}
        episodeLabel={episodeLabel}
        nextEpisode={nextEpisode}
        onActiveSrcChange={onActiveSrcChange}
      />
    </>
  );
};
