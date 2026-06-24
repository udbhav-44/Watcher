import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { AnimePlayerSection } from "@/components/player/anime-player-section";
import { AnimeWatchSession } from "@/components/player/anime-watch-session";
import { isAnimeTitleId } from "@/lib/catalog/titleId";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { buildAnimeExtraServers } from "@/lib/streaming/animeServers";
import {
  formatAnimeEpisodeLabel,
  resolveMegaplayEmbedUrls
} from "@/lib/streaming/megaplay";
import { resolveVidkingAnimeFallback } from "@/lib/streaming/vidkingAnime";

type Props = {
  params: { id: string };
  searchParams: { e?: string };
};

const safeEpisode = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function AnimeWatchPage({
  params,
  searchParams
}: Props): Promise<JSX.Element> {
  if (!isAnimeTitleId(params.id)) return notFound();

  const anime = await getAnimeDetailByTitleId(params.id);
  if (!anime) return notFound();

  const requestedEpisode = safeEpisode(searchParams.e, 1);
  const episodeAvailable = anime.episodes.some(
    (entry) => entry.number === requestedEpisode
  );
  const episodeNumber = episodeAvailable
    ? requestedEpisode
    : anime.episodes[0]?.number ?? 1;

  const currentEpisode = anime.episodes.find(
    (entry) => entry.number === episodeNumber
  );
  const currentIndex = anime.episodes.findIndex(
    (entry) => entry.number === episodeNumber
  );
  const nextEpisodeEntry =
    currentIndex >= 0 ? anime.episodes[currentIndex + 1] : null;

  const [megaplayResult, vidkingFallback] = currentEpisode
    ? await Promise.all([
        resolveMegaplayEmbedUrls({
          language: currentEpisode.hasSub ? "sub" : "dub",
          episodeNumber: currentEpisode.number,
          episodeEmbedId: currentEpisode.episodeEmbedId,
          malId: anime.malId,
          aniId: anime.aniId
        }),
        resolveVidkingAnimeFallback({
          title: anime.title,
          alternativeTitle: anime.alternativeTitle,
          year: anime.releaseYear,
          malId: anime.malId,
          aniId: anime.aniId,
          episodeNumber: currentEpisode.number
        })
      ])
    : [{ urls: [], hasWorking: false }, null];

  const embedUrls = megaplayResult.urls;

  const extraServers = currentEpisode
    ? buildAnimeExtraServers({
        episodeNumber: currentEpisode.number,
        episodeEmbedId: currentEpisode.episodeEmbedId,
        malId: anime.malId,
        aniId: anime.aniId
      })
    : [];
  const firstExtraUrl = extraServers.find((server) => server.urls.length > 0)
    ?.urls[0];

  if (embedUrls.length === 0 && !vidkingFallback && !firstExtraUrl) {
    return notFound();
  }

  const startWithVidking = !megaplayResult.hasWorking && Boolean(vidkingFallback);
  const embedUrl = startWithVidking
    ? (vidkingFallback?.url ?? "")
    : (embedUrls[0] ?? firstExtraUrl ?? vidkingFallback?.url ?? "");
  const episodeLabel = formatAnimeEpisodeLabel(
    episodeNumber,
    currentEpisode?.title
  );
  const episodeCount = anime.episodes.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <AnimePlayerSection
            titleId={anime.titleId}
            title={anime.title}
            initialSrc={embedUrl}
            poster={anime.backdropUrl}
            episode={episodeNumber}
            episodeName={currentEpisode?.title ?? null}
            embedUrls={embedUrls}
            vidkingFallbackUrl={vidkingFallback?.url ?? null}
            startWithVidking={startWithVidking}
            extraServers={extraServers}
            hasSub={currentEpisode?.hasSub ?? false}
            hasDub={currentEpisode?.hasDub ?? false}
            episodeLabel={episodeLabel}
            nextEpisode={nextEpisodeEntry?.number ?? null}
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] tracking-[0.2em] text-info uppercase">
                Anime
              </p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                {anime.title}
              </h1>
              <p className="text-sm text-fg-muted tabular-nums">{episodeLabel}</p>
            </div>
            <Link
              href={`/anime/${anime.titleId}` as Route}
              className="shrink-0 text-xs text-fg-faint transition hover:text-fg"
            >
              Series
            </Link>
          </div>
          <AnimeWatchSession
            titleId={anime.titleId}
            episode={episodeNumber}
            nextEpisode={nextEpisodeEntry?.number ?? null}
            nextEpisodeName={nextEpisodeEntry?.title ?? null}
            nextEpisodeStillUrl={anime.posterUrl ?? null}
          />
        </div>

        {anime.episodes.length > 0 && (
          <aside className="rounded-lg border border-border bg-surface-2/95 shadow-card">
            <div className="flex items-baseline justify-between gap-2 border-b border-border px-4 py-3">
              <p className="text-xs tracking-[0.18em] text-accent uppercase">
                Episodes
              </p>
              <p className="text-xs text-fg-faint tabular-nums">
                {episodeCount}
              </p>
            </div>
            <ol className="max-h-[640px] space-y-1 overflow-y-auto p-2">
              {anime.episodes.map((entry) => {
                const active = entry.number === episodeNumber;
                return (
                  <li key={entry.id}>
                    <Link
                      href={
                        `/anime/${anime.titleId}/watch?e=${entry.number}` as Route
                      }
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "block rounded-md border border-accent/50 bg-accent-soft px-3 py-2"
                          : "block rounded-md px-3 py-2 transition hover:bg-fg/[0.04]"
                      }
                    >
                      <p className="line-clamp-1 text-sm font-medium text-fg">
                        <span className="text-fg-faint tabular-nums">
                          {entry.number}.
                        </span>{" "}
                        {entry.title}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
