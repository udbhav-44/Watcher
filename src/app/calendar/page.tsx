import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Air calendar</h1>
        <p className="text-sm text-white/62">
          Upcoming episodes for series you&apos;re watching or saved.
        </p>
      </div>

      {orderedDays.length === 0 ? (
        <Card>
          <p className="text-sm text-white/68">
            No upcoming episodes for the next two weeks. Add a series to your
            collections or rate one to populate your calendar.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {orderedDays.map((day) => (
            <section key={day} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{formatDate(day)}</h2>
                <span className="text-xs text-white/45">
                  {groups[day].length} episode
                  {groups[day].length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {groups[day].map((entry) => (
                  <Card
                    key={`${entry.titleId}-${entry.season}-${entry.episode}`}
                    className="grid grid-cols-[64px_1fr] gap-3"
                  >
                    <div className="relative h-[96px] w-[64px] overflow-hidden rounded-md bg-white/5">
                      {entry.posterUrl ? (
                        <Image
                          src={entry.posterUrl}
                          alt={entry.showName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#1a1a1a]" />
                      )}
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <Link
                          href={detailHrefFor(entry.titleId)}
                          className="text-sm font-medium hover:underline"
                        >
                          {entry.showName}
                        </Link>
                        <p className="text-xs text-white/56">
                          S{entry.season} • E{entry.episode}
                          {entry.episodeName ? ` · ${entry.episodeName}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {entry.status === "today"
                            ? "Airs today"
                            : entry.status === "this_week"
                              ? "This week"
                              : "Upcoming"}
                          {entry.isWatching ? " · Continuing" : " · Saved"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Link
                          href={`${watchHrefFor(entry.titleId)}?s=${entry.season}&e=${entry.episode}`}
                          className="rounded-full border border-[#f2c46d]/40 bg-[#f2c46d]/15 px-3 py-1 text-[#f2c46d] hover:bg-[#f2c46d]/25"
                        >
                          Watch
                        </Link>
                        <Link
                          href={detailHrefFor(entry.titleId)}
                          className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-white/60 hover:bg-white/[0.08]"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
