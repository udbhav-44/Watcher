"use client";

import { useEffect, useState } from "react";

import { EmbedWatchRecorder } from "@/components/player/embed-watch-recorder";
import { NextEpisodeOverlay } from "@/components/player/next-episode-overlay";

type Props = {
  titleId: string;
  episode: number;
  nextEpisode: number | null;
  nextEpisodeName: string | null;
  nextEpisodeStillUrl: string | null;
};

export const AnimeWatchSession = ({
  titleId,
  episode,
  nextEpisode,
  nextEpisodeName,
  nextEpisodeStillUrl
}: Props): JSX.Element => {
  const [episodeEnded, setEpisodeEnded] = useState(false);

  useEffect(() => {
    setEpisodeEnded(false);
  }, [titleId, episode]);

  const nextHref =
    nextEpisode != null
      ? `/anime/${titleId}/watch?e=${nextEpisode}`
      : null;

  return (
    <>
      <EmbedWatchRecorder
        titleId={titleId}
        mediaType="anime"
        episode={episode}
        onEpisodeEnded={() => setEpisodeEnded(true)}
      />
      <NextEpisodeOverlay
        titleId={titleId}
        currentSeason={1}
        currentEpisode={episode}
        nextSeason={nextEpisode != null ? 1 : null}
        nextEpisode={nextEpisode}
        nextEpisodeName={nextEpisodeName}
        nextEpisodeStillUrl={nextEpisodeStillUrl}
        episodeEnded={episodeEnded}
        nextHref={nextHref}
      />
    </>
  );
};
