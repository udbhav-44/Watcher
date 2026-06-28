import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { detailHrefFor, watchHrefFor } from "@/lib/catalog/titleId";
import type { UpNextEntry } from "@/lib/personalization/seriesProgress";

type Props = {
  entries: UpNextEntry[];
};

const reasonLabel = (reason: UpNextEntry["reason"]): string => {
  if (reason === "in_progress") return "Resume";
  if (reason === "next_episode") return "Next up";
  return "Start watching";
};

export const UpNextRail = ({ entries }: Props): JSX.Element | null => {
  if (entries.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="up-next-heading">
      <h2
        id="up-next-heading"
        className="text-lg font-medium tracking-tight text-fg md:text-xl"
      >
        Up next on TV
      </h2>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {entries.map((entry) => {
          const watchHref =
            `${watchHrefFor(entry.show.titleId)}?s=${entry.season}&e=${entry.episode}` as Route;
          return (
            <div
              key={`${entry.show.titleId}-${entry.season}-${entry.episode}`}
              className="min-w-[280px] overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card"
            >
              <Link href={watchHref} className="block">
                <div className="relative aspect-video w-full bg-surface-3">
                  {entry.episodeStillUrl ? (
                    <Image
                      src={entry.episodeStillUrl}
                      alt={`${entry.show.title} S${entry.season}E${entry.episode}`}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : entry.show.backdropUrl ? (
                    <Image
                      src={entry.show.backdropUrl}
                      alt={entry.show.title}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface-3" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 text-fg">
                    <p className="text-xs tracking-[0.18em] text-accent uppercase">
                      {reasonLabel(entry.reason)}
                    </p>
                    <p className="text-sm font-medium">{entry.show.title}</p>
                    <p className="text-xs text-fg-muted tabular-nums">
                      S{entry.season}  ·  E{entry.episode}
                      {entry.episodeName ? `  ·  ${entry.episodeName}` : ""}
                    </p>
                  </div>
                  {entry.progressPercent > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${Math.min(100, entry.progressPercent)}%`
                        }}
                      />
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-fg-faint">
                <Link
                  href={detailHrefFor(entry.show.titleId)}
                  className="transition hover:text-fg"
                >
                  Details
                </Link>
                <span className="tabular-nums">
                  {entry.completionPercent}% complete
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
