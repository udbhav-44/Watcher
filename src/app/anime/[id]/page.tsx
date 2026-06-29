import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";

import { isAnimeTitleId } from "@/lib/catalog/titleId";
import { getAnimeDetailByTitleId } from "@/lib/data/anime";
import { WatchedToggle } from "@/components/movies/watched-toggle";

type Props = {
  params: { id: string };
};

export default async function AnimeDetailPage({
  params
}: Props): Promise<JSX.Element> {
  if (!isAnimeTitleId(params.id)) return notFound();

  const anime = await getAnimeDetailByTitleId(params.id);
  if (!anime) return notFound();

  const heroMeta = [
    anime.releaseYear,
    anime.status,
    anime.numberOfEpisodes ? `${anime.numberOfEpisodes} episodes` : null,
    anime.durationMinutes ? `${anime.durationMinutes} min` : null
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
        {anime.backdropUrl ? (
          <div className="relative aspect-[21/9] w-full">
            <Image
              src={anime.backdropUrl}
              alt={anime.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base via-base/60 to-transparent" />
          </div>
        ) : null}
        <div className="relative space-y-4 p-6 md:p-8">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.22em] text-accent uppercase">
              Anime
            </p>
            <h1 className="text-balance text-3xl font-semibold text-fg md:text-4xl">
              {anime.title}
            </h1>
            {heroMeta && (
              <p className="text-sm text-fg-muted tabular-nums">{heroMeta}</p>
            )}
          </div>
          {anime.synopsis && (
            <p className="max-w-prose text-pretty text-sm leading-7 text-fg-muted">
              {anime.synopsis}
            </p>
          )}
          {anime.genres.length > 0 && (
            <p className="text-xs text-accent/80">
              {anime.genres.join("  ·  ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/anime/${anime.titleId}/watch` as Route}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch now
            </Link>
            <WatchedToggle titleId={anime.titleId} title={anime.title} />
          </div>
        </div>
      </div>

      {anime.episodes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium text-fg">Episodes</h2>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {anime.episodes.map((episode) => (
              <li key={episode.id}>
                <Link
                  href={
                    `/anime/${anime.titleId}/watch?e=${episode.number}` as Route
                  }
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 transition hover:border-border-strong hover:bg-fg/[0.04]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fg/[0.06] text-sm font-medium text-fg tabular-nums">
                    {episode.number}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-fg">
                      {episode.title}
                    </p>
                    <p className="text-xs text-fg-faint">
                      {episode.hasSub ? "Sub" : ""}
                      {episode.hasSub && episode.hasDub ? "  ·  " : ""}
                      {episode.hasDub ? "Dub" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
