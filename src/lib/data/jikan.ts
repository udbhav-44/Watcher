import "server-only";

import { memoryCache } from "@/lib/cache/memoryCache";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — Jikan data is slow-moving
const MIN_INTERVAL_MS = 350; // ~3 req/s ceiling

let lastFetchAt = 0;

export type JikanAnime = {
  mal_id: number;
  url: string;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms?: string[];
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: {
    from?: string | null;
    to?: string | null;
  };
  score?: number | null;
  synopsis?: string | null;
  genres?: Array<{ name: string }>;
  year?: number | null;
  duration?: string | null;
};

type JikanListResponse<T> = {
  data?: T[];
  pagination?: {
    last_visible_page?: number;
    has_next_page?: boolean;
  };
};

type JikanSingleResponse<T> = {
  data?: T;
};

const throttle = async (): Promise<void> => {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed)
    );
  }
  lastFetchAt = Date.now();
};

const jikanFetch = async <T>(
  path: string,
  cacheKey: string,
  ttlMs = CACHE_TTL_MS
): Promise<T | null> => {
  const cached = memoryCache.get<T>(cacheKey);
  if (cached !== undefined) return cached;

  await throttle();

  try {
    const response = await fetch(`${JIKAN_BASE}${path}`, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as T;
    memoryCache.set(cacheKey, payload, ttlMs);
    return payload;
  } catch {
    return null;
  }
};

export const fetchJikanAnime = async (
  malId: number
): Promise<JikanAnime | null> => {
  const payload = await jikanFetch<JikanSingleResponse<JikanAnime>>(
    `/anime/${malId}`,
    `jikan:anime:${malId}`
  );
  return payload?.data ?? null;
};

export const searchJikanAnime = async (
  query: string,
  limit = 24
): Promise<JikanAnime[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const payload = await jikanFetch<JikanListResponse<JikanAnime>>(
    `/anime?q=${encodeURIComponent(trimmed)}&limit=${limit}&sfw`,
    `jikan:search:${trimmed.toLowerCase()}:${limit}`,
    15 * 60 * 1000
  );
  return payload?.data ?? [];
};

export const fetchJikanSeasonalNow = async (
  limit = 24
): Promise<JikanAnime[]> => {
  const payload = await jikanFetch<JikanListResponse<JikanAnime>>(
    `/seasons/now?limit=${limit}&sfw`,
    `jikan:seasons:now:${limit}`,
    30 * 60 * 1000
  );
  return payload?.data ?? [];
};

export const fetchJikanTopAnime = async (limit = 24): Promise<JikanAnime[]> => {
  const payload = await jikanFetch<JikanListResponse<JikanAnime>>(
    `/top/anime?limit=${limit}&sfw`,
    `jikan:top:${limit}`,
    60 * 60 * 1000
  );
  return payload?.data ?? [];
};

export const fetchJikanExternalLinks = async (
  malId: number
): Promise<Array<{ name: string; url: string }>> => {
  const payload = await jikanFetch<
    JikanSingleResponse<Array<{ name: string; url: string }>>
  >(`/anime/${malId}/external`, `jikan:external:${malId}`, CACHE_TTL_MS);
  return payload?.data ?? [];
};

export const aniListIdFromJikanExternals = (
  externals: Array<{ name: string; url: string }>
): string | null => {
  const link = externals.find((entry) =>
    /anilist/i.test(entry.name)
  );
  if (!link) return null;
  const match = link.url.match(/(\d+)/);
  return match?.[1] ?? null;
};

export const jikanPosterUrl = (anime: JikanAnime): string | null =>
  anime.images?.jpg?.large_image_url ??
  anime.images?.jpg?.image_url ??
  null;

export const jikanYear = (anime: JikanAnime): number | null => {
  if (anime.aired?.from) {
    const year = Number(anime.aired.from.slice(0, 4));
    if (Number.isFinite(year)) return year;
  }
  return anime.year ?? null;
};

export const jikanSynonymTitle = (anime: JikanAnime): string | null => {
  const english = anime.title_english?.trim();
  if (english && english !== anime.title) return english;
  const synonym = anime.title_synonyms?.[0]?.trim();
  return synonym ?? null;
};
