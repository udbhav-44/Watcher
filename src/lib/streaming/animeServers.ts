import type { ProviderAdQuality } from "@/lib/streaming/providers";
import { probeAnimeEmbedUrl } from "@/lib/streaming/animeProbe";

/**
 * A verified anime server surfaced in the watch-page switcher.
 * Only providers that pass `probeAnimeEmbedUrl` are included — nothing dead or
 * unresponsive is wired into the UI.
 */
export type AnimeExtraServer = {
  id: string;
  label: string;
  urls: string[];
  supportsLanguageToggle: boolean;
  adQuality: ProviderAdQuality;
};

type BuildOptions = {
  episodeNumber: number;
  malId?: string | null;
  aniId?: string | null;
};

type BuildResult = {
  servers: AnimeExtraServer[];
  defaultServerId: string | null;
};

/**
 * Live-test MAL-keyed iframe providers for a specific episode.
 * As of 2026-06-28 testing, SupaPlay (404), Vidsrc.cc (timeout/CF), and
 * VidLink (error page) are omitted entirely when they fail the probe.
 */
export const buildAnimeExtraServers = async (
  options: BuildOptions
): Promise<BuildResult> => {
  const { episodeNumber, malId, aniId } = options;
  const servers: AnimeExtraServer[] = [];

  const vidsrcId = aniId ?? malId;
  if (vidsrcId) {
    const url = `https://vidsrc.cc/v2/embed/anime/${vidsrcId}/${episodeNumber}/sub`;
    if (await probeAnimeEmbedUrl(url)) {
      servers.push({
        id: "vidsrc-cc",
        label: "Vidsrc.cc",
        urls: [url],
        supportsLanguageToggle: true,
        adQuality: "medium"
      });
    }
  }

  if (malId) {
    const url = `https://vidlink.pro/anime/${malId}/${episodeNumber}/sub?fallback=true`;
    if (await probeAnimeEmbedUrl(url)) {
      servers.push({
        id: "vidlink",
        label: "VidLink",
        urls: [url],
        supportsLanguageToggle: true,
        adQuality: "medium"
      });
    }
  }

  return {
    servers,
    defaultServerId: servers[0]?.id ?? null
  };
};
