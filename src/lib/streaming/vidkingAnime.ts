import { tvTitleIdFromTmdb } from "@/lib/catalog/titleId";
import { tmdbFetch } from "@/lib/data/tmdb";
import { resolveProviderUrlsFromIdentifier } from "@/lib/streaming/resolveProviders";

export type VidkingAnimeFallback = {
  url: string;
  tmdbTvId: string;
  seasonNumber: number;
};

type TmdbTvSearchResponse = {
  results?: Array<{
    id: number;
    name: string;
    first_air_date?: string;
  }>;
};

type TmdbFindResponse = {
  tv_results?: Array<{ id: number; name: string }>;
};

const ROMAN_NUMERAL_VALUES: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12
};

const parseRomanNumeral = (value: string): number | null => {
  const upper = value.trim().toUpperCase();
  return ROMAN_NUMERAL_VALUES[upper] ?? null;
};

const stripSeasonSuffix = (title: string): string =>
  title
    .replace(
      /\s*(?:season|part|cour)\s*(?:\d+|[ivxlcdm]+)(?:\s*(?:season|part|cour))?/gi,
      ""
    )
    .replace(/\s*\d+(?:st|nd|rd|th)\s+season/gi, "")
    .replace(/\s+\d{1,2}$/i, "")
    .replace(/\s+[ivxlcdm]{1,4}$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const parseSeasonFromTitle = (title: string): number | null => {
  const trimmed = title.trim();
  if (!trimmed) return null;

  const patterns: RegExp[] = [
    /\b(?:season|part|cour)\s*(\d+)\b/i,
    /\b(?:season|part|cour)\s*([ivxlcdm]+)\b/i,
    /\b(\d+)(?:st|nd|rd|th)\s+season\b/i,
    /\s(\d{1,2})$/,
    /\s([ivxlcdm]{1,4})$/i
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (!match?.[1]) continue;
    const parsed =
      /^\d+$/.test(match[1]) ? Number(match[1]) : parseRomanNumeral(match[1]);
    if (parsed && parsed > 0) return parsed;
  }

  return null;
};

export const parseAnimeTitleForVidking = (
  title: string,
  alternativeTitle?: string | null
): { baseTitle: string; seasonNumber: number } => {
  const primary = title.trim();
  const seasonFromTitle = parseSeasonFromTitle(primary);
  const seasonFromAlt = alternativeTitle
    ? parseSeasonFromTitle(alternativeTitle)
    : null;
  const seasonNumber = seasonFromTitle ?? seasonFromAlt ?? 1;

  const baseFromTitle = stripSeasonSuffix(primary);
  const baseFromAlt = alternativeTitle
    ? stripSeasonSuffix(alternativeTitle.trim())
    : "";
  const baseTitle = baseFromTitle || baseFromAlt || primary;

  return { baseTitle, seasonNumber };
};

const uniqueQueries = (queries: string[]): string[] => {
  const seen = new Set<string>();
  return queries
    .map((query) => query.trim())
    .filter((query) => {
      if (!query) return false;
      const key = query.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildSearchQueries = (
  title: string,
  alternativeTitle?: string | null
): string[] => {
  const { baseTitle } = parseAnimeTitleForVidking(title, alternativeTitle);
  return uniqueQueries([
    baseTitle,
    title.trim(),
    alternativeTitle?.trim() ?? "",
    alternativeTitle ? stripSeasonSuffix(alternativeTitle.trim()) : ""
  ]);
};

/**
 * Build the Vidking embed URL through the SAME resolver the TV watch page
 * uses (`resolveProviderUrlsFromIdentifier`). This guarantees the anime
 * fallback URL is byte-identical to what a user gets by finding the show
 * under the TV tab — the path the user confirmed already plays. Returns
 * `null` if the resolver can't map the id to a provider URL.
 */
const buildVidkingAnimeEmbedUrl = async (
  tmdbTvId: string,
  seasonNumber: number,
  episodeNumber: number
): Promise<string | null> => {
  const providers = await resolveProviderUrlsFromIdentifier(
    tvTitleIdFromTmdb(Number(tmdbTvId)),
    { season: seasonNumber, episode: episodeNumber }
  );
  const vidking = providers.find((entry) => entry.id === "vidking");
  return vidking?.url ?? null;
};

const searchTmdbTvId = async (
  query: string,
  year?: number | null
): Promise<string | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params: Record<string, string> = { query: trimmed };
  if (year) params.first_air_date_year = String(year);

  const data = await tmdbFetch<TmdbTvSearchResponse>("/search/tv", params);
  const first = data?.results?.[0];
  return first ? String(first.id) : null;
};

const findTmdbTvIdByExternalId = async (
  externalId: string,
  source: "mal_id" | "anilist_id"
): Promise<string | null> => {
  const trimmed = externalId.trim();
  if (!trimmed) return null;

  const data = await tmdbFetch<TmdbFindResponse>(
    `/find/${encodeURIComponent(trimmed)}`,
    { external_source: source }
  );
  const first = data?.tv_results?.[0];
  return first ? String(first.id) : null;
};

/**
 * Map an anime catalog entry to a TMDB TV id. Vidking only accepts TMDB ids in
 * `/embed/tv/{id}/{season}/{episode}` — not MAL/AniList directly.
 */
export const resolveTmdbTvIdForAnime = async (options: {
  title: string;
  alternativeTitle?: string | null;
  year?: number | null;
  malId?: string | null;
  aniId?: string | null;
}): Promise<string | null> => {
  const { title, alternativeTitle, year, malId, aniId } = options;
  const queries = buildSearchQueries(title, alternativeTitle);

  if (malId) {
    const id = await findTmdbTvIdByExternalId(malId, "mal_id");
    if (id) return id;
  }

  if (aniId) {
    const id = await findTmdbTvIdByExternalId(aniId, "anilist_id");
    if (id) return id;
  }

  for (const query of queries) {
    let id = await searchTmdbTvId(query, year);
    if (id) return id;

    if (year) {
      id = await searchTmdbTvId(query);
      if (id) return id;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[vidkingAnime] TMDB TV id not found", {
      title,
      alternativeTitle,
      year,
      malId,
      aniId,
      queries
    });
  }

  return null;
};

export const resolveVidkingAnimeFallback = async (options: {
  title: string;
  alternativeTitle?: string | null;
  year?: number | null;
  malId?: string | null;
  aniId?: string | null;
  episodeNumber: number;
}): Promise<VidkingAnimeFallback | null> => {
  const { seasonNumber } = parseAnimeTitleForVidking(
    options.title,
    options.alternativeTitle
  );
  const tmdbTvId = await resolveTmdbTvIdForAnime(options);
  if (!tmdbTvId) return null;

  const url = await buildVidkingAnimeEmbedUrl(
    tmdbTvId,
    seasonNumber,
    options.episodeNumber
  );
  if (!url) return null;

  return {
    tmdbTvId,
    seasonNumber,
    url
  };
};
