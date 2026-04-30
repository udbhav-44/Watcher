import { env } from "@/lib/config/env";

const knownTmdbByImdb: Record<string, string> = {
  tt1375666: "27205",
  tt0816692: "157336",
  tt16431404: "1318447"
};

const buildVidkingMovieUrl = (tmdbId: string): string =>
  `${env.NEXT_PUBLIC_VIDKING_BASE}/embed/movie/${tmdbId}`;

const parseTmdbSlug = (identifier: string): string | null => {
  if (!identifier.startsWith("tmdb-")) return null;
  const value = identifier.replace("tmdb-", "");
  return /^\d+$/.test(value) ? value : null;
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
    };
    const id = data.movie_results?.[0]?.id;
    return typeof id === "number" ? String(id) : null;
  } catch {
    return null;
  }
};

export const resolveVidkingUrlFromIdentifier = async (
  identifier: string
): Promise<string | null> => {
  const fromTmdbSlug = parseTmdbSlug(identifier);
  if (fromTmdbSlug) return buildVidkingMovieUrl(fromTmdbSlug);

  if (/^\d+$/.test(identifier)) return buildVidkingMovieUrl(identifier);

  const cleanTitleId = identifier.toLowerCase();
  const mapped = knownTmdbByImdb[cleanTitleId];
  if (mapped) return buildVidkingMovieUrl(mapped);

  const tmdbId = await fetchTmdbMovieIdByImdb(cleanTitleId);
  if (!tmdbId) return null;

  return buildVidkingMovieUrl(tmdbId);
};
