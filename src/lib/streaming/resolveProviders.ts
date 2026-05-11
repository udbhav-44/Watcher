import { env } from "@/lib/config/env";
import { isTvTitleId } from "@/lib/catalog/titleId";

import {
  embedProviders,
  type EmbedProvider,
  type EmbedProviderId
} from "./providers";

export type ResolvedProvider = {
  id: EmbedProviderId;
  label: string;
  url: string;
};

const knownTmdbByImdb: Record<string, string> = {
  tt1375666: "27205",
  tt0816692: "157336",
  tt16431404: "1318447"
};

const parseTmdbSlug = (identifier: string): string | null => {
  const lower = identifier.toLowerCase();
  if (lower.startsWith("tmdb-tv-")) {
    const value = lower.replace("tmdb-tv-", "");
    return /^\d+$/.test(value) ? value : null;
  }
  if (lower.startsWith("tmdb-")) {
    const value = lower.replace("tmdb-", "");
    return /^\d+$/.test(value) ? value : null;
  }
  return null;
};

const fetchTmdbIdByImdb = async (
  imdbTitleId: string
): Promise<string | null> => {
  if (!env.TMDB_API_KEY) return null;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbTitleId}?api_key=${env.TMDB_API_KEY}&external_source=imdb_id`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      movie_results?: Array<{ id: number }>;
      tv_results?: Array<{ id: number }>;
    };
    const id = data.movie_results?.[0]?.id ?? data.tv_results?.[0]?.id;
    return typeof id === "number" ? String(id) : null;
  } catch {
    return null;
  }
};

const resolveTmdbId = async (identifier: string): Promise<string | null> => {
  const fromSlug = parseTmdbSlug(identifier);
  if (fromSlug) return fromSlug;
  if (/^\d+$/.test(identifier)) return identifier;
  const lower = identifier.toLowerCase();
  if (knownTmdbByImdb[lower]) return knownTmdbByImdb[lower];
  return fetchTmdbIdByImdb(lower);
};

const buildForProvider = (
  provider: EmbedProvider,
  tmdbId: string,
  options: { tv: boolean; season: number; episode: number }
): ResolvedProvider | null => {
  const url = options.tv
    ? provider.tvUrl(tmdbId, options.season, options.episode)
    : provider.movieUrl(tmdbId);
  if (!url) return null;
  return { id: provider.id, label: provider.label, url };
};

/**
 * Resolve every embed provider that can stream this title. Returns an
 * empty array when the identifier can't be mapped to a TMDb id (e.g. an
 * unmapped IMDb id with no TMDB_API_KEY available).
 */
export const resolveProviderUrlsFromIdentifier = async (
  identifier: string,
  options: { season?: number; episode?: number } = {}
): Promise<ResolvedProvider[]> => {
  const tmdbId = await resolveTmdbId(identifier);
  if (!tmdbId) return [];
  const tv = isTvTitleId(identifier);
  const season = options.season ?? 1;
  const episode = options.episode ?? 1;
  return embedProviders
    .map((provider) => buildForProvider(provider, tmdbId, { tv, season, episode }))
    .filter((entry): entry is ResolvedProvider => entry !== null);
};
