import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { watchHrefFor } from "@/lib/catalog/titleId";
import type { ContinueWatchingItem } from "@/lib/personalization/continueWatching";

type Props = {
  items: ContinueWatchingItem[];
};

const reasonLabel = (reason: ContinueWatchingItem["reason"]): string | null => {
  if (reason === "in_progress") return "Resume";
  if (reason === "next_episode") return "Next up";
  return null;
};

const resumeHref = (item: ContinueWatchingItem): string => {
  const base = watchHrefFor(item.titleId);
  if (item.mediaType === "tv" && item.season && item.episode) {
    return `${base}?s=${item.season}&e=${item.episode}`;
  }
  if (item.mediaType === "anime" && item.episode) {
    return `${base}?e=${item.episode}`;
  }
  return base;
};

export const ContinueWatchingRail = ({ items }: Props): JSX.Element | null => {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="rail-continue-watching">
      <h2
        id="rail-continue-watching"
        className="text-lg font-medium tracking-tight text-fg md:text-xl"
      >
        Continue watching
      </h2>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {items.map((item) => {
          const artwork =
            item.episodeStillUrl ??
            item.movie?.backdropUrl ??
            item.movie?.posterUrl;
          const title =
            item.movie?.title ?? `Title ${item.titleId.slice(0, 6)}`;
          const progress = Math.min(100, Math.max(0, item.progressPercent));
          const remaining =
            item.movie?.durationMinutes != null && item.mediaType === "movie"
              ? Math.max(
                  1,
                  Math.round(
                    item.movie.durationMinutes * (1 - progress / 100)
                  )
                )
              : null;
          const isTv = item.mediaType === "tv" && item.season && item.episode;
          const isAnime = item.mediaType === "anime" && item.episode;
          const episodeLabel = isTv
            ? `S${item.season}  ·  E${item.episode}`
            : isAnime
              ? `Episode ${item.episode}`
              : null;
          const badge = reasonLabel(item.reason);
          const href = resumeHref(item) as Parameters<typeof Link>[0]["href"];
          return (
            <Link
              key={`${item.titleId}-${item.season ?? ""}-${item.episode ?? ""}`}
              href={href}
              className="group relative w-[260px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-surface-3">
                {artwork ? (
                  <Image
                    src={artwork}
                    alt={title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                    sizes="260px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-fg-faint">
                    Artwork unavailable
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                {badge && (
                  <p className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] tracking-[0.14em] text-accent uppercase">
                    {badge}
                  </p>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-fg/10">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${progress}%` }}
                    aria-hidden
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fg text-fg-on-accent shadow-lift">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-medium text-fg">
                  {title}
                </p>
                <p className="line-clamp-1 text-xs text-fg-faint tabular-nums">
                  {episodeLabel ? `${episodeLabel}  ·  ` : ""}
                  {item.episodeName && (isTv || isAnime)
                    ? `${item.episodeName}  ·  `
                    : ""}
                  {progress > 1 ? `${Math.round(progress)}% watched` : "Up next"}
                  {remaining && !episodeLabel
                    ? `  ·  ${remaining} min left`
                    : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
