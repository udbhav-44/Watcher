export type AnimeLanguage = "sub" | "dub";

/**
 * Rewrite the trailing `/sub` or `/dub` path segment on every URL to the
 * requested language. Anime embed providers (Vidsrc.cc, VidLink, …) carry
 * separate Sub and Dub tracks selected purely via the URL path.
 */
export const applyAnimeLanguage = (
  urls: string[],
  language: AnimeLanguage
): string[] =>
  urls.map((url) => url.replace(/\/(sub|dub)(?=$|\?)/, `/${language}`));

export const languageAvailable = (
  episode: {
    embed_url?: { sub?: string | null; dub?: string | null };
  },
  language: AnimeLanguage
): boolean => {
  const url = episode.embed_url?.[language];
  return Boolean(url);
};

const redundantEpisodeTitle = (number: number, title: string): boolean => {
  const normalized = title.trim();
  if (!normalized) return true;
  if (normalized === String(number)) return true;
  return new RegExp(`^ep(?:isode)?\\s*0*${number}$`, "i").test(normalized);
};

export const formatAnimeEpisodeLabel = (
  episodeNumber: number,
  title?: string | null
): string => {
  const prefix = `Episode ${episodeNumber}`;
  if (!title || redundantEpisodeTitle(episodeNumber, title)) return prefix;
  return `${prefix}  ·  ${title}`;
};
