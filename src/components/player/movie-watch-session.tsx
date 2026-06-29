"use client";

import { EmbedWatchRecorder } from "@/components/player/embed-watch-recorder";

type Props = {
  titleId: string;
};

/** Records iframe embed progress for movie watch pages. */
export const MovieWatchSession = ({ titleId }: Props): JSX.Element => {
  return (
    <EmbedWatchRecorder titleId={titleId} mediaType="movie" />
  );
};
