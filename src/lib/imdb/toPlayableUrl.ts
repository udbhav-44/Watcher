import { env } from "@/lib/config/env";
import { isTvTitleId } from "@/lib/catalog/titleId";

export type StreamProvider = "playimdb" | "vidking";

type Options = {
  season?: number;
  episode?: number;
};

export const toPlayableUrl = (
  titleId: string,
  source?: string,
  provider: StreamProvider = "playimdb",
  options: Options = {}
): string => {
  const cleanTitleId = titleId.toLowerCase();
  const tv = isTvTitleId(cleanTitleId);

  if (provider === "vidking") {
    if (tv) {
      const tmdbId = cleanTitleId.replace("tmdb-tv-", "");
      const season = options.season ?? 1;
      const episode = options.episode ?? 1;
      return `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;
    }
    const tmdbLikeId = cleanTitleId.startsWith("tmdb-")
      ? cleanTitleId.replace("tmdb-", "")
      : cleanTitleId;
    return `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${tmdbLikeId}`;
  }

  // PlayIMDb does not have an episode-level URL pattern, so series links route to the series page.
  if (tv) {
    const baseId = cleanTitleId.replace(/^tmdb-tv-/, "");
    return `${env.NEXT_PUBLIC_PLAY_HOST}/title/${baseId}/`;
  }

  if (!source) return `${env.NEXT_PUBLIC_PLAY_HOST}/title/${cleanTitleId}/`;

  try {
    const srcUrl = new URL(source);
    srcUrl.hostname = "www.playimdb.com";
    return srcUrl.toString();
  } catch {
    return `${env.NEXT_PUBLIC_PLAY_HOST}/title/${cleanTitleId}/`;
  }
};
