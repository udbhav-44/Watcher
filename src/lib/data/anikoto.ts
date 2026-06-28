import "server-only";

import { memoryCache } from "@/lib/cache/memoryCache";

const ANIKOTO_BASE = "https://anikotoapi.site";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type AnikotoAnime = {
  id: number;
  title: string;
  alternative?: string | null;
  poster?: string | null;
  description?: string | null;
  score?: string | null;
  status?: string | null;
  episodes?: string | null;
  mal_id?: string | null;
  ani_id?: string | null;
  slug?: string | null;
  year?: number | null;
  duration?: string | null;
  terms_by_type?: {
    genre?: string[];
    type?: string[];
  };
};

export type AnikotoEpisode = {
  id: number;
  title: string;
  jp_title?: string | null;
  number: number;
  episode_embed_id?: string | null;
  embed_url?: {
    sub?: string | null;
    dub?: string | null;
  };
};

type RecentResponse = {
  ok?: boolean;
  data?: AnikotoAnime[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
};

type SeriesResponse = {
  ok?: boolean;
  data?: {
    anime: AnikotoAnime;
    episodes: AnikotoEpisode[];
  };
};

const fetchAnikoto = async <T>(path: string, cacheKey: string): Promise<T | null> => {
  const cached = memoryCache.get<T>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(`${ANIKOTO_BASE}${path}`, {
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as T;
    memoryCache.set(cacheKey, payload, CACHE_TTL_MS);
    return payload;
  } catch {
    return null;
  }
};

export const fetchRecentAnime = async (
  page = 1,
  perPage = 24
): Promise<{
  items: AnikotoAnime[];
  pagination: RecentResponse["pagination"];
}> => {
  const payload = await fetchAnikoto<RecentResponse>(
    `/recent-anime?page=${page}&per_page=${perPage}`,
    `anikoto:recent:${page}:${perPage}`
  );
  return {
    items: payload?.data ?? [],
    pagination: payload?.pagination
  };
};

export const fetchAnimeSeries = async (
  anikotoId: number
): Promise<{
  anime: AnikotoAnime;
  episodes: AnikotoEpisode[];
} | null> => {
  const payload = await fetchAnikoto<SeriesResponse>(
    `/series/${anikotoId}`,
    `anikoto:series:${anikotoId}`
  );
  if (!payload?.data?.anime) return null;
  return {
    anime: payload.data.anime,
    episodes: payload.data.episodes ?? []
  };
};

/**
 * Bridge MAL catalog entries to Anikoto episode embed ids by scanning the cached
 * recent feed (server-side only — no browser calls to Anikoto).
 */
export const findAnikotoSeriesByMalId = async (
  malId: number
): Promise<{
  anime: AnikotoAnime;
  episodes: AnikotoEpisode[];
} | null> => {
  const cacheKey = `anikoto:mal-bridge:${malId}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get<{
      anime: AnikotoAnime;
      episodes: AnikotoEpisode[];
    } | null>(cacheKey) ?? null;
  }

  const { items } = await fetchRecentAnime(1, 100);
  const match = items.find((entry) => String(entry.mal_id) === String(malId));
  if (!match) {
    memoryCache.set(cacheKey, null, CACHE_TTL_MS);
    return null;
  }

  const series = await fetchAnimeSeries(match.id);
  memoryCache.set(cacheKey, series, CACHE_TTL_MS);
  return series;
};
