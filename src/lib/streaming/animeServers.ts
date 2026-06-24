import type { ProviderAdQuality } from "@/lib/streaming/providers";

/**
 * An anime "server" surfaced in the watch-page switcher (Vidsrc.cc, VidLink),
 * alongside the Vidking TMDB fallback.
 *
 * These providers take MAL / AniList ids directly, so they need no TMDB
 * round-trip. They sit behind Cloudflare and reject server-side fetches (see
 * docs/streaming-providers-research.md), so they are direct-iframe-only: we
 * never probe them, we just offer them as manual choices and let the
 * client-side stall detector handle a dead embed.
 *
 * `urls` are built with a `/sub` segment by default; the player rewrites that to
 * `/dub` via `applyAnimeLanguage` when the user toggles audio.
 */
export type AnimeExtraServer = {
  id: string;
  label: string;
  /** Candidate embed URLs in priority order (default to the `sub` track). */
  urls: string[];
  /** Whether `sub`/`dub` can be toggled via the URL path. */
  supportsLanguageToggle: boolean;
  adQuality: ProviderAdQuality;
};

type BuildOptions = {
  episodeNumber: number;
  malId?: string | null;
  aniId?: string | null;
};

/**
 * Build the list of anime servers we can offer for an episode, in default
 * priority order (Vidsrc.cc first, then VidLink). Servers whose id system can't
 * be resolved are simply omitted (the UI greys them out).
 *
 * MegaPlay and its SupaPlay clone were removed: both 410/404 on every episode
 * (the `s-2/{episode_embed_id}` catalog path is dead), so they no longer appear
 * as servers.
 */
export const buildAnimeExtraServers = (
  options: BuildOptions
): AnimeExtraServer[] => {
  const { episodeNumber, malId, aniId } = options;
  const servers: AnimeExtraServer[] = [];

  // Vidsrc.cc anime — AniList or MAL keyed, sub/dub via path. New default.
  const vidsrcId = aniId ?? malId;
  if (vidsrcId) {
    servers.push({
      id: "vidsrc-cc",
      label: "Vidsrc.cc",
      urls: [
        `https://vidsrc.cc/v2/embed/anime/${vidsrcId}/${episodeNumber}/sub`
      ],
      supportsLanguageToggle: true,
      adQuality: "medium"
    });
  }

  // VidLink anime — MAL keyed, sub/dub via path, with fallback auto-swap.
  if (malId) {
    servers.push({
      id: "vidlink",
      label: "VidLink",
      urls: [
        `https://vidlink.pro/anime/${malId}/${episodeNumber}/sub?fallback=true`
      ],
      supportsLanguageToggle: true,
      adQuality: "medium"
    });
  }

  return servers;
};
