import type { ProviderAdQuality } from "@/lib/streaming/providers";

/**
 * An extra anime "server" surfaced alongside MegaPlay and the Vidking fallback.
 *
 * These providers take MAL / AniList / the catalog `episode_embed_id` directly,
 * so they need no TMDB round-trip. They sit behind Cloudflare and reject
 * server-side fetches (see docs/streaming-providers-research.md), so they are
 * direct-iframe-only: we never probe them, we just offer them as manual choices
 * and let the client-side stall detector handle a dead embed.
 *
 * `urls` are built with a `/sub` segment by default; the player rewrites that to
 * `/dub` via `applyMegaplayLanguage` when the user toggles audio.
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
  episodeEmbedId?: string | null;
  malId?: string | null;
  aniId?: string | null;
};

/**
 * Build the list of extra anime servers we can offer for an episode. Servers
 * whose id system can't be resolved are simply omitted (the UI greys them out).
 */
export const buildAnimeExtraServers = (
  options: BuildOptions
): AnimeExtraServer[] => {
  const { episodeNumber, episodeEmbedId, malId, aniId } = options;
  const servers: AnimeExtraServer[] = [];

  // SupaPlay — MegaPlay sibling, identical catalog path + sub/dub toggle.
  if (episodeEmbedId) {
    servers.push({
      id: "supaplay",
      label: "SupaPlay",
      urls: [`https://supaplay.fun/stream/s-2/${episodeEmbedId}/sub`],
      supportsLanguageToggle: true,
      adQuality: "medium"
    });
  }

  // Vidsrc.cc anime — AniList or MAL keyed, sub/dub via path.
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
