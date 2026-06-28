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
 *   2. Whitelist its hostname in `providerHosts.ts` and CSP `frame-src`.
 *   3. Live-test the embed URL before wiring (see docs/anime-provider-test-matrix.md).
 *
 * PlayIMDb is intentionally split out as an external-only fallback because
 * it doesn't support cross-origin embedding and doesn't expose an
 * episode-level URL pattern.
 */

import { env } from "@/lib/config/env";

export type EmbedProviderId =
  | "vidking"
  | "vidfast"
  | "vidrock"
  | "vidcore"
  | "vidsrc-cc";

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
 * Ordered by reliability (live-tested 2026-06-28). VidLink removed — passes
 * server-side HTML probe but streams fail or desync in real browsers.
 */
export const embedProviders: EmbedProvider[] = [
  {
    id: "vidking",
    label: "Vidking",
    movieUrl: (id) => `${VIDKING_BASE}/embed/movie/${id}`,
    tvUrl: (id, s, e) => `${VIDKING_BASE}/embed/tv/${id}/${s}/${e}`,
    adQuality: "low"
  },
  {
    id: "vidfast",
    label: "VidFast",
    movieUrl: (id) => `https://vidfast.pro/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
    adQuality: "low"
  },
  {
    id: "vidrock",
    label: "VidRock",
    movieUrl: (id) => `https://vidrock.net/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidrock.net/embed/tv/${id}/${s}/${e}`,
    adQuality: "low"
  },
  {
    id: "vidcore",
    label: "VidCore",
    movieUrl: (id) => `https://vidcore.org/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidcore.org/embed/tv/${id}/${s}/${e}`,
    adQuality: "medium"
  },
  {
    id: "vidsrc-cc",
    label: "Vidsrc.cc",
    movieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tvUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    adQuality: "medium"
  }
];

export const embedProviderById = (id: EmbedProviderId): EmbedProvider | null =>
  embedProviders.find((entry) => entry.id === id) ?? null;
