"use client";

import { useCallback, useState } from "react";

import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { MegaplayPlayer } from "@/components/player/megaplay-player";

type Props = {
  titleId: string;
  title: string;
  initialSrc: string;
  poster?: string | null;
  episode: number;
  episodeName?: string | null;
  embedUrls: string[];
  vidkingFallbackUrl?: string | null;
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
  embedUrls,
  vidkingFallbackUrl,
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
      <MegaplayPlayer
        embedUrls={embedUrls}
        vidkingFallbackUrl={vidkingFallbackUrl}
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
