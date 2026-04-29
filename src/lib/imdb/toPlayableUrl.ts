import { env } from "@/lib/config/env";

export const toPlayableUrl = (titleId: string, source?: string): string => {
  const cleanTitleId = titleId.toLowerCase();
  if (!source) return `${env.NEXT_PUBLIC_PLAY_HOST}/title/${cleanTitleId}/`;

  try {
    const srcUrl = new URL(source);
    srcUrl.hostname = "www.playimdb.com";
    return srcUrl.toString();
  } catch {
    return `${env.NEXT_PUBLIC_PLAY_HOST}/title/${cleanTitleId}/`;
  }
};
