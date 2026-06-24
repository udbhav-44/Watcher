export type MegaplayLanguage = "sub" | "dub";

type EmbedMode = "catalog" | "mal" | "anilist";

type BuildOptions = {
  language: MegaplayLanguage;
  episodeNumber: number;
  episodeEmbedId?: string | null;
  malId?: string | null;
  aniId?: string | null;
};

const MEGAPLAY_BASE = "https://megaplay.buzz";

const buildUrl = (mode: EmbedMode, parts: string[]): string =>
  `${MEGAPLAY_BASE}/stream/${parts.join("/")}`;

/**
 * Resolve a MegaPlay embed URL using catalog id first, then MAL, then AniList.
 */
export const buildMegaplayEmbedUrl = (options: BuildOptions): string | null => {
  const { language, episodeNumber, episodeEmbedId, malId, aniId } = options;

  if (episodeEmbedId) {
    return buildUrl("catalog", [`s-2`, episodeEmbedId, language]);
  }
  if (malId) {
    return buildUrl("mal", [malId, String(episodeNumber), language]);
  }
  if (aniId) {
    return buildUrl("anilist", [aniId, String(episodeNumber), language]);
  }
  return null;
};

export const languageAvailable = (
  episode: {
    embed_url?: { sub?: string | null; dub?: string | null };
  },
  language: MegaplayLanguage
): boolean => {
  const url = episode.embed_url?.[language];
  return Boolean(url);
};
