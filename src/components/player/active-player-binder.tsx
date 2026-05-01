"use client";

import { useEffect } from "react";

import { setActivePlayer, closePlayer } from "@/lib/player/playerStore";

type Props = {
  titleId: string;
  title: string;
  src: string;
  poster?: string | null;
  mediaType: "movie" | "tv";
  season?: number | null;
  episode?: number | null;
  episodeName?: string | null;
};

export const ActivePlayerBinder = ({
  titleId,
  title,
  src,
  poster,
  mediaType,
  season,
  episode,
  episodeName
}: Props): null => {
  useEffect(() => {
    setActivePlayer({
      titleId,
      title,
      src,
      poster: poster ?? null,
      mediaType,
      season: season ?? null,
      episode: episode ?? null,
      episodeName: episodeName ?? null
    });
    return () => {
      // Keep the player active when navigating to a different non-watch route;
      // the host minimizes automatically. Explicit close happens via the UI.
    };
  }, [titleId, title, src, poster, mediaType, season, episode, episodeName]);

  useEffect(() => {
    return () => {
      // When user explicitly leaves all watch pages, allow GC by clearing.
      // We rely on the next watch page to re-set the active player.
      // Do nothing here so embeds keep playing while minimized.
    };
  }, []);

  // Expose a hook for explicit cleanup if needed.
  useEffect(() => {
    const onPageHide = (event: PageTransitionEvent): void => {
      if (event.persisted) return;
      closePlayer();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  return null;
};
