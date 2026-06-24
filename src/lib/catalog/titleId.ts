import type { Route } from "next";
import { z } from "zod";

export type MediaType = "movie" | "tv" | "anime";

export const titleIdPattern =
  /^(tt\d+|tmdb-tv-\d+|tmdb-\d+|anikoto-\d+)$/i;

export const titleIdSchema = z.string().regex(titleIdPattern, "Invalid title id");

export const isTvTitleId = (titleId: string): boolean =>
  titleId.toLowerCase().startsWith("tmdb-tv-");

export const isAnimeTitleId = (titleId: string): boolean =>
  titleId.toLowerCase().startsWith("anikoto-");

export const mediaTypeFromTitleId = (titleId: string): MediaType => {
  if (isTvTitleId(titleId)) return "tv";
  if (isAnimeTitleId(titleId)) return "anime";
  return "movie";
};

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

export const anikotoIdFromTitleId = (titleId: string): number | null => {
  const lower = titleId.toLowerCase();
  if (!lower.startsWith("anikoto-")) return null;
  const value = Number(lower.replace("anikoto-", ""));
  return Number.isFinite(value) ? value : null;
};

export const tvTitleIdFromTmdb = (tmdbId: number): string => `tmdb-tv-${tmdbId}`;
export const movieTitleIdFromTmdb = (tmdbId: number): string => `tmdb-${tmdbId}`;
export const animeTitleIdFromAnikoto = (anikotoId: number): string =>
  `anikoto-${anikotoId}`;

export const detailHrefFor = (titleId: string): Route => {
  if (isAnimeTitleId(titleId)) {
    return `/anime/${titleId}` as Route;
  }
  return (isTvTitleId(titleId)
    ? `/tv/${titleId}`
    : `/title/${titleId}`) as Route;
};

export const watchHrefFor = (titleId: string): Route => {
  if (isAnimeTitleId(titleId)) {
    return `/anime/${titleId}/watch` as Route;
  }
  return (isTvTitleId(titleId)
    ? `/tv/${titleId}/watch`
    : `/watch/${titleId}`) as Route;
};
