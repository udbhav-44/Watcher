export type MegaplayLanguage = "sub" | "dub";

type EmbedMode = "catalog" | "mal" | "anilist";

export type MegaplayEmbedStrategy = EmbedMode;

export type MegaplayEmbedCandidate = {
  url: string;
  strategy: MegaplayEmbedStrategy;
};

type BuildOptions = {
  language: MegaplayLanguage;
  episodeNumber: number;
  episodeEmbedId?: string | null;
  malId?: string | null;
  aniId?: string | null;
};

const MEGAPLAY_BASE = "https://megaplay.buzz";

const MEGAPLAY_ERROR_MARKERS = [
  "Error - MegaPlay",
  "We can't find the file you are looking for",
  'class="error-code"'
] as const;

const buildUrl = (mode: EmbedMode, parts: string[]): string =>
  `${MEGAPLAY_BASE}/stream/${parts.join("/")}`;

const applyLanguage = (url: string, language: MegaplayLanguage): string =>
  url.replace(/\/(sub|dub)$/, `/${language}`);

/**
 * Build every MegaPlay embed URL we can derive for an episode, in priority order.
 */
export const buildMegaplayEmbedCandidates = (
  options: BuildOptions
): MegaplayEmbedCandidate[] => {
  const { language, episodeNumber, episodeEmbedId, malId, aniId } = options;
  const candidates: MegaplayEmbedCandidate[] = [];

  if (episodeEmbedId) {
    candidates.push({
      url: buildUrl("catalog", ["s-2", episodeEmbedId, language]),
      strategy: "catalog"
    });
  }
  if (malId) {
    candidates.push({
      url: buildUrl("mal", [malId, String(episodeNumber), language]),
      strategy: "mal"
    });
  }
  if (aniId) {
    candidates.push({
      url: buildUrl("anilist", [aniId, String(episodeNumber), language]),
      strategy: "anilist"
    });
  }

  return candidates;
};

/**
 * Resolve a MegaPlay embed URL using catalog id first, then MAL, then AniList.
 */
export const buildMegaplayEmbedUrl = (options: BuildOptions): string | null =>
  buildMegaplayEmbedCandidates(options)[0]?.url ?? null;

export const applyMegaplayLanguage = (
  urls: string[],
  language: MegaplayLanguage
): string[] => urls.map((url) => applyLanguage(url, language));

export const isMegaplayErrorPage = (html: string): boolean =>
  MEGAPLAY_ERROR_MARKERS.some((marker) => html.includes(marker));

export const probeMegaplayUrl = async (url: string): Promise<boolean> => {
  if (!url.startsWith(`${MEGAPLAY_BASE}/`)) return false;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
      cache: "no-store"
    });
    if (!response.ok) return false;
    const html = await response.text();
    return !isMegaplayErrorPage(html);
  } catch {
    return false;
  }
};

export type MegaplayResolveResult = {
  /** Working URLs first, then probed failures for client-side retries. */
  urls: string[];
  hasWorking: boolean;
};

/**
 * Probe candidate URLs server-side and return working ones first, with failed
 * strategies kept as client-side fallbacks.
 */
export const resolveMegaplayEmbedUrls = async (
  options: BuildOptions
): Promise<MegaplayResolveResult> => {
  const candidates = buildMegaplayEmbedCandidates(options);
  if (candidates.length === 0) return { urls: [], hasWorking: false };

  const probed = await Promise.all(
    candidates.map(async (candidate) => ({
      url: candidate.url,
      ok: await probeMegaplayUrl(candidate.url)
    }))
  );

  const working = probed.filter((entry) => entry.ok).map((entry) => entry.url);
  const failed = probed.filter((entry) => !entry.ok).map((entry) => entry.url);
  return {
    urls: [...working, ...failed],
    hasWorking: working.length > 0
  };
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
