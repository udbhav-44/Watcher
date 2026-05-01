import { env } from "@/lib/config/env";
import { isTvTitleId } from "@/lib/catalog/titleId";

const knownTmdbByImdb: Record<string, string> = {
  tt1375666: "27205",
  tt0816692: "157336",
  tt16431404: "1318447"
};

const buildVidkingMovieUrl = (tmdbId: string): string =>
  `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${tmdbId}`;

const buildVidkingTvUrl = (
  tmdbId: string,
  season: number,
  episode: number
): string =>
  `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;

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

const fetchTmdbMovieIdByImdb = async (
  imdbTitleId: string
): Promise<string | null> => {
  if (!env.TMDB_API_KEY) return null;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbTitleId}?api_key=${env.TMDB_API_KEY}&external_source=imdb_id`,
      { cache: "no-store" }
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

export const resolveVidkingUrlFromIdentifier = async (
  identifier: string,
  options: { season?: number; episode?: number } = {}
): Promise<string | null> => {
  const tv = isTvTitleId(identifier);
  const season = options.season ?? 1;
  const episode = options.episode ?? 1;

  const fromTmdbSlug = parseTmdbSlug(identifier);
  if (fromTmdbSlug) {
    return tv
      ? buildVidkingTvUrl(fromTmdbSlug, season, episode)
      : buildVidkingMovieUrl(fromTmdbSlug);
  }

  if (/^\d+$/.test(identifier)) {
    return tv
      ? buildVidkingTvUrl(identifier, season, episode)
      : buildVidkingMovieUrl(identifier);
  }

  const cleanTitleId = identifier.toLowerCase();
  const mapped = knownTmdbByImdb[cleanTitleId];
  if (mapped) {
    return tv
      ? buildVidkingTvUrl(mapped, season, episode)
      : buildVidkingMovieUrl(mapped);
  }

  const tmdbId = await fetchTmdbMovieIdByImdb(cleanTitleId);
  if (!tmdbId) return null;

  return tv
    ? buildVidkingTvUrl(tmdbId, season, episode)
    : buildVidkingMovieUrl(tmdbId);
};
