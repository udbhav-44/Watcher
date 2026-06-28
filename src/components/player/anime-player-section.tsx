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
  defaultServerId?: string | null;
  servers?: AnimeExtraServer[];
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
  defaultServerId = null,
  servers = [],
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
        defaultServerId={defaultServerId}
        servers={servers}
        poster={poster}
        titleId={titleId}
        episodeLabel={episodeLabel}
        nextEpisode={nextEpisode}
        onActiveSrcChange={onActiveSrcChange}
      />
    </>
  );
};
