import type { Route } from "next";
import { z } from "zod";

export type MediaType = "movie" | "tv";

export const titleIdPattern = /^(tt\d+|tmdb-tv-\d+|tmdb-\d+)$/i;

export const titleIdSchema = z.string().regex(titleIdPattern, "Invalid title id");

export const isTvTitleId = (titleId: string): boolean =>
  titleId.toLowerCase().startsWith("tmdb-tv-");

export const mediaTypeFromTitleId = (titleId: string): MediaType =>
  isTvTitleId(titleId) ? "tv" : "movie";

export const tmdbIdFromTitleId = (titleId: string): number | null => {
  const lower = titleId.toLowerCase();
  if (lower.startsWith("tmdb-tv-")) {
    const value = Number(lower.replace("tmdb-tv-", ""));
    return Number.isFinite(value) ? value : null;
  }
  if (lower.startsWith("tmdb-")) {
    const value = Number(lower.replace("tmdb-", ""));
    return Number.isFinite(value) ? value : null;
  }
  return null;
};

export const tvTitleIdFromTmdb = (tmdbId: number): string => `tmdb-tv-${tmdbId}`;
export const movieTitleIdFromTmdb = (tmdbId: number): string => `tmdb-${tmdbId}`;

export const detailHrefFor = (titleId: string): Route =>
  (isTvTitleId(titleId)
    ? `/tv/${titleId}`
    : `/title/${titleId}`) as Route;

export const watchHrefFor = (titleId: string): Route =>
  (isTvTitleId(titleId)
    ? `/tv/${titleId}/watch`
    : `/watch/${titleId}`) as Route;
