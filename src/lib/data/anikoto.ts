const ANIKOTO_BASE = "https://anikotoapi.site";

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

const fetchAnikoto = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${ANIKOTO_BASE}${path}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
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
    `/recent-anime?page=${page}&per_page=${perPage}`
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
  const payload = await fetchAnikoto<SeriesResponse>(`/series/${anikotoId}`);
  if (!payload?.data?.anime) return null;
  return {
    anime: payload.data.anime,
    episodes: payload.data.episodes ?? []
  };
};
