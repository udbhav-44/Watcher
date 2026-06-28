import { tvTitleIdFromTmdb } from "@/lib/catalog/titleId";
import type { EmbedProviderId } from "@/lib/streaming/providers";
import {
  resolveProviderUrlsFromIdentifier,
  type ResolvedProvider
} from "@/lib/streaming/resolveProviders";
import {
  parseAnimeTitleForVidking,
  resolveTmdbTvIdForAnime
} from "@/lib/streaming/vidkingAnime";

/** Anime defaults — VidFast first; Vidking often stops mid-episode in-browser. */
const ANIME_PROVIDER_ORDER: EmbedProviderId[] = [
  "vidfast",
  "vidrock",
  "vidcore",
  "vidking",
  "vidsrc-cc"
];

/**
 * A verified anime server surfaced in the watch-page switcher.
 * TMDB-keyed providers (same resolver as the TV tab), reordered for anime.
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

  const byId = new Map(providers.map((entry) => [entry.id, entry]));
  const ordered = ANIME_PROVIDER_ORDER.map((id) => byId.get(id)).filter(
    (entry): entry is ResolvedProvider => entry != null
  );

  const servers: AnimeExtraServer[] = ordered.map((provider) => ({
    id: provider.id,
    label: provider.label,
    urls: [provider.url],
    supportsLanguageToggle: false,
    adQuality: provider.adQuality
  }));

  return {
    servers,
    defaultServerId: servers[0]?.id ?? null
  };
};
