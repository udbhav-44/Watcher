import {
  animeTitleIdFromAnikoto,
  anikotoIdFromTitleId
} from "@/lib/catalog/titleId";
import {
  fetchAnimeSeries,
  fetchRecentAnime,
  type AnikotoAnime,
  type AnikotoEpisode
} from "@/lib/data/anikoto";
import { languageAvailable } from "@/lib/streaming/megaplay";
import type { AnimeDetail, AnimeEpisodeSummary, MovieCard } from "@/lib/types";

const parseScore = (value: string | null | undefined): number | null => {
  if (!value) return null;
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

const toEpisodeSummary = (episode: AnikotoEpisode): AnimeEpisodeSummary => ({
  id: episode.id,
  number: episode.number,
  title: episode.title,
  jpTitle: episode.jp_title ?? null,
  episodeEmbedId: episode.episode_embed_id ?? null,
  hasSub: languageAvailable(episode, "sub"),
  hasDub: languageAvailable(episode, "dub")
});

export const toAnimeCardFromAnikoto = (anime: AnikotoAnime): MovieCard => {
  const titleId = animeTitleIdFromAnikoto(anime.id);
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

export const getAnimeDetailByTitleId = async (
  titleId: string
): Promise<AnimeDetail | null> => {
  const anikotoId = anikotoIdFromTitleId(titleId);
  if (!anikotoId) return null;
  const series = await fetchAnimeSeries(anikotoId);
  if (!series) return null;

  const card = toAnimeCardFromAnikoto(series.anime);
  const episodes = series.episodes
    .slice()
    .sort((a, b) => a.number - b.number)
    .map(toEpisodeSummary);

  return {
    ...card,
    mediaType: "anime",
    malId: series.anime.mal_id ?? null,
    aniId: series.anime.ani_id ?? null,
    status: series.anime.status ?? null,
    episodes
  };
};

export const getAnimeDetailByAnikotoId = async (
  anikotoId: number
): Promise<AnimeDetail | null> =>
  getAnimeDetailByTitleId(animeTitleIdFromAnikoto(anikotoId));
