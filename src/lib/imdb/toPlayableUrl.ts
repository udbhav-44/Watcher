import { env } from "@/lib/config/env";

export type StreamProvider = "playimdb" | "vidking";

export const toPlayableUrl = (titleId: string, source?: string, provider: StreamProvider = "playimdb"): string => {
  const cleanTitleId = titleId.toLowerCase();
  if (provider === "vidking") {
    const tmdbLikeId = cleanTitleId.startsWith("tmdb-") ? cleanTitleId.replace("tmdb-", "") : cleanTitleId;
    return `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${tmdbLikeId}`;
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
