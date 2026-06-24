import { env } from "@/lib/config/env";
import { tmdbFetch } from "@/lib/data/tmdb";

export type VidkingAnimeFallback = {
  url: string;
  tmdbTvId: string;
};

type TmdbTvSearchResponse = {
  results?: Array<{
    id: number;
    name: string;
    first_air_date?: string;
  }>;
};

const VIDKING_BASE = env.NEXT_PUBLIC_VIDKING_BASE.replace(/\/$/, "");

export const buildVidkingAnimeEmbedUrl = (
  tmdbTvId: string,
  episodeNumber: number
): string =>
  `${VIDKING_BASE}/embed/tv/${tmdbTvId}/1/${episodeNumber}?autoPlay=true&nextEpisode=true&episodeSelector=true`;

const searchTmdbTvId = async (
  query: string,
  year?: number | null
): Promise<string | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params: Record<string, string> = { query: trimmed };
  if (year) params.first_air_date_year = String(year);

  const data = await tmdbFetch<TmdbTvSearchResponse>("/search/tv", params);
  const first = data?.results?.[0];
  return first ? String(first.id) : null;
};

/**
 * Map an anime catalog entry to a TMDB TV id via title search. Vidking only
 * accepts TMDB ids in `/embed/tv/{id}/{season}/{episode}` — not MAL/AniList.
 */
export const resolveTmdbTvIdForAnime = async (options: {
  title: string;
  alternativeTitle?: string | null;
  year?: number | null;
}): Promise<string | null> => {
  const { title, alternativeTitle, year } = options;

  let id = await searchTmdbTvId(title, year);
  if (id) return id;

  if (year) {
    id = await searchTmdbTvId(title);
    if (id) return id;
  }

  if (alternativeTitle && alternativeTitle.trim() !== title.trim()) {
    id = await searchTmdbTvId(alternativeTitle, year);
    if (id) return id;
    if (year) {
      id = await searchTmdbTvId(alternativeTitle);
      if (id) return id;
    }
  }

  return null;
};

export const resolveVidkingAnimeFallback = async (options: {
  title: string;
  alternativeTitle?: string | null;
  year?: number | null;
  episodeNumber: number;
}): Promise<VidkingAnimeFallback | null> => {
  const tmdbTvId = await resolveTmdbTvIdForAnime(options);
  if (!tmdbTvId) return null;

  return {
    tmdbTvId,
    url: buildVidkingAnimeEmbedUrl(tmdbTvId, options.episodeNumber)
  };
};
