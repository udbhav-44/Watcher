"use client";

import { useEffect, useState } from "react";

import { EmbedWatchRecorder } from "@/components/player/embed-watch-recorder";
import { NextEpisodeOverlay } from "@/components/player/next-episode-overlay";

type Props = {
  titleId: string;
  season: number;
  episode: number;
  nextSeason: number | null;
  nextEpisode: number | null;
  nextEpisodeName: string | null;
  nextEpisodeStillUrl: string | null;
};

export const TvWatchSession = ({
  titleId,
  season,
  episode,
  nextSeason,
  nextEpisode,
  nextEpisodeName,
  nextEpisodeStillUrl
}: Props): JSX.Element => {
  const [episodeEnded, setEpisodeEnded] = useState(false);

  useEffect(() => {
    setEpisodeEnded(false);
  }, [titleId, season, episode]);

  return (
    <>
      <EmbedWatchRecorder
        titleId={titleId}
        mediaType="tv"
        season={season}
        episode={episode}
        onEpisodeEnded={() => setEpisodeEnded(true)}
      />
      <NextEpisodeOverlay
        titleId={titleId}
        currentSeason={season}
        currentEpisode={episode}
        nextSeason={nextSeason}
        nextEpisode={nextEpisode}
        nextEpisodeName={nextEpisodeName}
        nextEpisodeStillUrl={nextEpisodeStillUrl}
        episodeEnded={episodeEnded}
      />
    </>
  );
};
