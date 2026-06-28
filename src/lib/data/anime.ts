import "server-only";

import {
  animeTitleIdFromAnikoto,
  animeTitleIdFromMal,
  anikotoIdFromTitleId,
  malIdFromTitleId
} from "@/lib/catalog/titleId";
import {
  fetchAnimeSeries,
  fetchRecentAnime,
  findAnikotoSeriesByMalId,
  type AnikotoAnime,
  type AnikotoEpisode
} from "@/lib/data/anikoto";
import {
  aniListIdFromJikanExternals,
  fetchJikanAnime,
  fetchJikanExternalLinks,
  fetchJikanSeasonalNow,
  fetchJikanTopAnime,
  jikanPosterUrl,
  jikanSynonymTitle,
  jikanYear,
  searchJikanAnime,
  type JikanAnime
} from "@/lib/data/jikan";
import { languageAvailable } from "@/lib/streaming/animeEmbed";
import type { AnimeDetail, AnimeEpisodeSummary, MovieCard } from "@/lib/types";

const parseScore = (value: string | number | null | undefined): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDurationMinutes = (
  value: string | null | undefined
): number | null => {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const toEpisodeSummaryFromAnikoto = (
  episode: AnikotoEpisode
): AnimeEpisodeSummary => ({
  id: episode.id,
  number: episode.number,
  title: episode.title,
  jpTitle: episode.jp_title ?? null,
  episodeEmbedId: episode.episode_embed_id ?? null,
  hasSub: languageAvailable(episode, "sub"),
  hasDub: languageAvailable(episode, "dub")
});

const toEpisodeSummarySynthetic = (
  number: number,
  anikotoEpisode?: AnikotoEpisode | null
): AnimeEpisodeSummary => {
  if (anikotoEpisode) return toEpisodeSummaryFromAnikoto(anikotoEpisode);
  return {
    id: number,
    number,
    title: `Episode ${number}`,
    jpTitle: null,
    episodeEmbedId: null,
    hasSub: true,
    hasDub: true
  };
};

export const toAnimeCardFromJikan = (anime: JikanAnime): MovieCard => {
  const titleId = animeTitleIdFromMal(anime.mal_id);
  const genres = anime.genres?.map((genre) => genre.name) ?? [];
  return {
    id: titleId,
    titleId,
    mediaType: "anime",
    title: anime.title_english?.trim() || anime.title,
    synopsis: anime.synopsis ?? null,
    posterUrl: jikanPosterUrl(anime),
    backdropUrl: jikanPosterUrl(anime),
    releaseYear: jikanYear(anime),
    durationMinutes: parseDurationMinutes(anime.duration),
    voteAverage: parseScore(anime.score),
    numberOfEpisodes: anime.episodes ?? null,
    playableUrl: `/anime/${titleId}/watch`,
    genres
  };
};

export const toAnimeCardFromAnikoto = (anime: AnikotoAnime): MovieCard => {
  const malId = Number(anime.mal_id);
  const titleId =
    Number.isFinite(malId) && malId > 0
      ? animeTitleIdFromMal(malId)
      : animeTitleIdFromAnikoto(anime.id);
  const genres = anime.terms_by_type?.genre ?? [];
  return {
    id: titleId,
    titleId,
    mediaType: "anime",
    title: anime.title,
    synopsis: anime.description ?? null,
    posterUrl: anime.poster ?? null,
    backdropUrl: anime.poster ?? null,
    releaseYear: anime.year ?? null,
    durationMinutes: parseDurationMinutes(anime.duration),
    voteAverage: parseScore(anime.score),
    numberOfEpisodes: Number(anime.episodes) || null,
    playableUrl: `/anime/${titleId}/watch`,
    genres
  };
};

export const getSeasonalAnimeCards = async (limit = 24): Promise<MovieCard[]> => {
  const items = await fetchJikanSeasonalNow(limit);
  return items.map(toAnimeCardFromJikan);
};

export const getTopAnimeCards = async (limit = 24): Promise<MovieCard[]> => {
  const items = await fetchJikanTopAnime(limit);
  return items.map(toAnimeCardFromJikan);
};

export const getRecentAnimeCards = async (
  page = 1,
  perPage = 24
): Promise<{
  items: MovieCard[];
  pagination: Awaited<ReturnType<typeof fetchRecentAnime>>["pagination"];
}> => {
  const { items, pagination } = await fetchRecentAnime(page, perPage);
  return {
    items: items.map(toAnimeCardFromAnikoto),
    pagination
  };
};

export const searchAnimeCards = async (
  query: string,
  limit = 24
): Promise<MovieCard[]> => {
  const items = await searchJikanAnime(query, limit);
  return items.map(toAnimeCardFromJikan);
};

const buildEpisodesForMalAnime = async (
  malId: number,
  episodeCount: number,
  anikotoEpisodes: AnikotoEpisode[] = []
): Promise<AnimeEpisodeSummary[]> => {
  const byNumber = new Map(
    anikotoEpisodes.map((episode) => [episode.number, episode])
  );
  const count = Math.max(episodeCount, anikotoEpisodes.length, 1);
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return toEpisodeSummarySynthetic(number, byNumber.get(number));
  });
};

export const getAnimeDetailByMalId = async (
  malId: number
): Promise<AnimeDetail | null> => {
  const jikan = await fetchJikanAnime(malId);
  if (!jikan) return null;

  const externals = await fetchJikanExternalLinks(malId);
  const aniId = aniListIdFromJikanExternals(externals);

  const anikotoBridge = await findAnikotoSeriesByMalId(malId);
  const anikotoEpisodes = anikotoBridge?.episodes ?? [];
  const episodeCount = jikan.episodes ?? anikotoEpisodes.length ?? 0;
  const episodes = await buildEpisodesForMalAnime(
    malId,
    episodeCount,
    anikotoEpisodes
  );

  const card = toAnimeCardFromJikan(jikan);

  return {
    ...card,
    mediaType: "anime",
    numberOfEpisodes: episodes.length > 0 ? episodes.length : card.numberOfEpisodes,
    alternativeTitle: jikanSynonymTitle(jikan),
    malId: String(malId),
    aniId,
    status: jikan.status ?? null,
    episodes
  };
};

export const getAnimeDetailByAnikotoId = async (
  anikotoId: number
): Promise<AnimeDetail | null> => {
  const series = await fetchAnimeSeries(anikotoId);
  if (!series) return null;

  const malId = Number(series.anime.mal_id);
  if (Number.isFinite(malId) && malId > 0) {
    const malDetail = await getAnimeDetailByMalId(malId);
    if (malDetail) return malDetail;
  }

  const card = toAnimeCardFromAnikoto(series.anime);
  const episodes = series.episodes
    .slice()
    .sort((a, b) => a.number - b.number)
    .map(toEpisodeSummaryFromAnikoto);

  return {
    ...card,
    mediaType: "anime",
    numberOfEpisodes:
      episodes.length > 0 ? episodes.length : card.numberOfEpisodes,
    alternativeTitle: series.anime.alternative ?? null,
    malId: series.anime.mal_id ?? null,
    aniId: series.anime.ani_id ?? null,
    status: series.anime.status ?? null,
    episodes
  };
};

export const getAnimeDetailByTitleId = async (
  titleId: string
): Promise<AnimeDetail | null> => {
  const malId = malIdFromTitleId(titleId);
  if (malId) return getAnimeDetailByMalId(malId);

  const anikotoId = anikotoIdFromTitleId(titleId);
  if (anikotoId) return getAnimeDetailByAnikotoId(anikotoId);

  return null;
};
