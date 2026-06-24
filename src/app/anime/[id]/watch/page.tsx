import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ActivePlayerBinder } from "@/components/player/active-player-binder";
import { AnimeWatchSession } from "@/components/player/anime-watch-session";
import { MegaplayPlayer } from "@/components/player/megaplay-player";
import { isAnimeTitleId } from "@/lib/catalog/titleId";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { buildMegaplayEmbedUrl } from "@/lib/streaming/megaplay";

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

  const embedUrl =
    currentEpisode
      ? buildMegaplayEmbedUrl({
          language: currentEpisode.hasSub ? "sub" : "dub",
          episodeNumber: currentEpisode.number,
          episodeEmbedId: currentEpisode.episodeEmbedId,
          malId: anime.malId,
          aniId: anime.aniId
        })
      : null;

  if (!embedUrl) return notFound();

  const episodeLabel = `Episode ${episodeNumber}${
    currentEpisode?.title ? `  ·  ${currentEpisode.title}` : ""
  }`;

  return (
    <div className="space-y-6">
      <ActivePlayerBinder
        titleId={anime.titleId}
        title={anime.title}
        src={embedUrl}
        poster={anime.backdropUrl ?? null}
        mediaType="anime"
        episode={episodeNumber}
        episodeName={currentEpisode?.title ?? null}
      />

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/anime/${anime.titleId}` as Route}
          className="inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to series
        </Link>
        {anime.numberOfEpisodes && (
          <span className="text-xs text-fg-faint tabular-nums">
            {anime.numberOfEpisodes} episodes
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <MegaplayPlayer
            src={embedUrl}
            poster={anime.backdropUrl}
            titleId={anime.titleId}
            hasSub={currentEpisode?.hasSub ?? false}
            hasDub={currentEpisode?.hasDub ?? false}
            episodeLabel={episodeLabel}
          />
          <div className="space-y-1">
            <h1 className="text-balance text-3xl font-semibold text-fg md:text-4xl">
              {anime.title}
            </h1>
            <p className="text-sm text-fg-muted tabular-nums">{episodeLabel}</p>
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
                {anime.episodes.length}
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
