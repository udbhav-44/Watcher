/**
 * Registry of free streaming embed providers.
 *
 * Each provider exposes URL builders for movies (TMDb id) and TV episodes
 * (TMDb id + season + episode). Providers are listed in default priority
 * order — the player tries the first one with a non-null URL, and the
 * user can switch via the server picker if it stalls or has no sources.
 *
 * When adding a new provider:
 *   1. Add its entry below.
 *   2. Whitelist its hostname in `providerHosts.ts`.
 *   3. Verify Vidking-style /embed semantics: the iframe must be embeddable
 *      cross-origin (no X-Frame-Options: DENY).
 *
 * PlayIMDb is intentionally split out as an external-only fallback because
 * it doesn't support cross-origin embedding and doesn't expose an
 * episode-level URL pattern.
 */

import { env } from "@/lib/config/env";

export type EmbedProviderId =
  | "vidking"
  | "vidsrc-cc"
  | "embedsu"
  | "multiembed"
  | "vidsrc-to";

export type ProviderAdQuality = "low" | "medium" | "heavy";

export type EmbedProvider = {
  id: EmbedProviderId;
  label: string;
  /** Build a movie embed URL for the given TMDb id. */
  movieUrl: (tmdbId: string) => string;
  /** Build a TV episode embed URL. */
  tvUrl: (tmdbId: string, season: number, episode: number) => string;
  /**
   * Empirical ad behavior. Used to rank providers by default and to show a
   * quality dot in the UI. None of these are ad-free — uBlock Origin in
   * the browser is the recommended companion.
   */
  adQuality: ProviderAdQuality;
};

const VIDKING_BASE = env.NEXT_PUBLIC_VIDKING_BASE.replace(/\/$/, "");

/**
 * Ordered by ad-quality first, then by historical reliability. The watch
 * pages always present this order; the user's last manual choice is
 * persisted client-side and overrides the default.
 */
export const embedProviders: EmbedProvider[] = [
  {
    id: "vidsrc-cc",
    label: "VidSrc",
    movieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    adQuality: "low"
  },
  {
    id: "embedsu",
    label: "Embed.su",
    movieUrl: (id) => `https://embed.su/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
    adQuality: "low"
  },
  {
    id: "vidking",
    label: "Vidking",
    movieUrl: (id) => `${VIDKING_BASE}/embed/movie/${id}`,
    tvUrl: (id, s, e) => `${VIDKING_BASE}/embed/tv/${id}/${s}/${e}`,
    adQuality: "medium"
  },
  {
    id: "vidsrc-to",
    label: "VidSrc.to",
    movieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    adQuality: "medium"
  },
  {
    id: "multiembed",
    label: "MultiEmbed",
    movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tvUrl: (id, s, e) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    adQuality: "heavy"
  }
];

export const embedProviderById = (id: EmbedProviderId): EmbedProvider | null =>
  embedProviders.find((entry) => entry.id === id) ?? null;
