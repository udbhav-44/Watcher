import Image from "next/image";
import Link from "next/link";
import { CalendarRange, Play } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { detailHrefFor, watchHrefFor } from "@/lib/catalog/titleId";
import { getUpcomingEpisodesForProfile } from "@/lib/personalization/calendar";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export const dynamic = "force-dynamic";

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

const statusLabel = (status: string): string => {
  if (status === "today") return "Airs today";
  if (status === "this_week") return "This week";
  return "Upcoming";
};

export default async function CalendarPage(): Promise<JSX.Element> {
  const profileKey = getProfileKeyFromCookie();
  const upcoming = await getUpcomingEpisodesForProfile(profileKey);

  const groups = upcoming.reduce<Record<string, typeof upcoming>>(
    (acc, entry) => {
      const key = entry.airDate;
      acc[key] = acc[key] ?? [];
      acc[key].push(entry);
      return acc;
    },
    {}
  );
  const orderedDays = Object.keys(groups).sort();
  const todayKey = orderedDays.find(
    (day) => groups[day][0]?.status === "today"
  );
  const totalEpisodes = upcoming.length;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          Coming up
        </p>
        <h1 className="text-3xl font-semibold text-fg">Air calendar</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Upcoming episodes for series you&apos;re watching or saved. The next
          two weeks at a glance.
        </p>
        {totalEpisodes > 0 && (
          <p className="text-xs text-fg-faint tabular-nums">
            {totalEpisodes} episode{totalEpisodes === 1 ? "" : "s"} across{" "}
            {orderedDays.length} day{orderedDays.length === 1 ? "" : "s"}
            {todayKey ? "  ·  including today" : ""}
          </p>
        )}
      </div>

      {orderedDays.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="h-5 w-5" />}
          title="No upcoming episodes"
          description="Save a series or start watching one to populate this calendar with new episodes for the next two weeks."
          action={
            <Link
              href="/tv"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
            >
              Find a series to follow
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {orderedDays.map((day) => {
            const isToday = day === todayKey;
            return (
              <section key={day} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    className={
                      isToday
                        ? "text-lg font-medium text-accent"
                        : "text-lg font-medium text-fg"
                    }
                  >
                    {isToday ? "Today  ·  " : ""}
                    {formatDate(day)}
                  </h2>
                  <span className="text-xs text-fg-faint tabular-nums">
                    {groups[day].length} episode
                    {groups[day].length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {groups[day].map((entry) => (
                    <article
                      key={`${entry.titleId}-${entry.season}-${entry.episode}`}
                      className={
                        isToday
                          ? "grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-accent/40 bg-accent-soft p-4 shadow-card"
                          : "grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-border bg-surface-2 p-4 shadow-card transition hover:border-border-strong"
                      }
                    >
                      <div className="relative h-[108px] w-[72px] overflow-hidden rounded-md bg-surface-3">
                        {entry.posterUrl ? (
                          <Image
                            src={entry.posterUrl}
                            alt={entry.showName}
                            fill
                            sizes="72px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-surface-3" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col justify-between gap-2">
                        <div className="space-y-1">
                          <Link
                            href={detailHrefFor(entry.titleId)}
                            className="line-clamp-1 text-sm font-medium text-fg hover:underline"
                          >
                            {entry.showName}
                          </Link>
                          <p className="text-xs text-fg-muted tabular-nums">
                            S{entry.season}  ·  E{entry.episode}
                            {entry.episodeName
                              ? `  ·  ${entry.episodeName}`
                              : ""}
                          </p>
                          <p className="text-xs text-fg-faint">
                            {statusLabel(entry.status)}
                            {entry.isWatching ? "  ·  Continuing" : "  ·  Saved"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Link
                            href={`${watchHrefFor(entry.titleId)}?s=${entry.season}&e=${entry.episode}`}
                            className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent-soft px-3 py-1 font-medium text-accent transition hover:bg-accent/25"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Watch
                          </Link>
                          <Link
                            href={detailHrefFor(entry.titleId)}
                            className="rounded-full border border-border bg-fg/[0.04] px-3 py-1 text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
