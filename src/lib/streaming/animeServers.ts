import { tvTitleIdFromTmdb } from "@/lib/catalog/titleId";
import { probeAnimeEmbedUrl } from "@/lib/streaming/animeProbe";
import {
  resolveProviderUrlsFromIdentifier,
  type ResolvedProvider
} from "@/lib/streaming/resolveProviders";
import {
  parseAnimeTitleForVidking,
  resolveTmdbTvIdForAnime
} from "@/lib/streaming/vidkingAnime";

/**
 * A verified anime server surfaced in the watch-page switcher.
 * TMDB-keyed providers (same resolver as the TV tab) — only Vidking is
 * server-probed; others are iframe-only (Cloudflare-safe).
 */
export type AnimeExtraServer = {
  id: string;
  label: string;
  urls: string[];
  supportsLanguageToggle: boolean;
  adQuality: ResolvedProvider["adQuality"];
};

type BuildOptions = {
  title: string;
  alternativeTitle?: string | null;
  year?: number | null;
  malId?: string | null;
  aniId?: string | null;
  episodeNumber: number;
};

type BuildResult = {
  servers: AnimeExtraServer[];
  defaultServerId: string | null;
};

/**
 * Resolve anime playback through the same TMDB → embed pipeline that works
 * when users find the show via TV search. MAL-keyed providers (VidLink, etc.)
 * are intentionally excluded — they probe OK server-side but fail in-browser.
 */
export const buildAnimeExtraServers = async (
  options: BuildOptions
): Promise<BuildResult> => {
  const { seasonNumber } = parseAnimeTitleForVidking(
    options.title,
    options.alternativeTitle
  );

  const tmdbTvId = await resolveTmdbTvIdForAnime({
    title: options.title,
    alternativeTitle: options.alternativeTitle,
    year: options.year,
    malId: options.malId,
    aniId: options.aniId
  });

  if (!tmdbTvId) {
    return { servers: [], defaultServerId: null };
  }

  const providers = await resolveProviderUrlsFromIdentifier(
    tvTitleIdFromTmdb(Number(tmdbTvId)),
    { season: seasonNumber, episode: options.episodeNumber }
  );

  const servers: AnimeExtraServer[] = [];

  for (const provider of providers) {
    if (provider.id === "vidking") {
      const ok = await probeAnimeEmbedUrl(provider.url);
      if (!ok) continue;
    }

    servers.push({
      id: provider.id,
      label: provider.label,
      urls: [provider.url],
      supportsLanguageToggle: false,
      adQuality: provider.adQuality
    });
  }

  return {
    servers,
    defaultServerId: servers[0]?.id ?? null
  };
};
