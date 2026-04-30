"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WatchEvent = {
  id: string;
  titleId: string;
  progressPercent: number;
};

type MovieLabel = {
  titleId: string;
  title: string;
};

export const ContinueWatching = (): JSX.Element | null => {
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const [labels, setLabels] = useState<Record<string, MovieLabel>>({});

  useEffect(() => {
    fetch("/api/watch-events")
      .then((res) => res.json())
      .then((data: { events?: WatchEvent[] }) => {
        const filtered = (data.events ?? [])
          .filter(
            (event) => event.progressPercent > 5 && event.progressPercent < 95
          )
          .slice(0, 6);
        setEvents(filtered);
        void Promise.all(
          filtered.map(async (event) => {
            const response = await fetch(`/api/movies/${event.titleId}`);
            if (!response.ok) return null;
            const payload = (await response.json()) as { movie?: MovieLabel };
            return payload.movie ?? null;
          })
        ).then((movies) => {
          const nextLabels = movies.reduce<Record<string, MovieLabel>>(
            (acc, item) => {
              if (item) acc[item.titleId] = item;
              return acc;
            },
            {}
          );
          setLabels(nextLabels);
        });
      })
      .catch(() => setEvents([]));
  }, []);

  if (!events.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">Continue watching</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/watch/${event.titleId}`}
            className="surface-panel min-w-[180px] rounded-lg p-3 text-sm transition hover:bg-white/[0.06]"
          >
            <p>
              {labels[event.titleId]?.title ??
                `Movie ${event.titleId.slice(0, 6)}`}
            </p>
            <p className="text-xs text-white/56">
              {Math.round(event.progressPercent)}% watched
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
