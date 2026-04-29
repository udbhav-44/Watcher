"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WatchEvent = {
  id: string;
  movieId: string;
  progressPercent: number;
};

export const ContinueWatching = (): JSX.Element | null => {
  const [events, setEvents] = useState<WatchEvent[]>([]);

  useEffect(() => {
    const profileKey = window.localStorage.getItem("campus.profile") ?? "default";
    fetch(`/api/watch-events?profileKey=${profileKey}`)
      .then((res) => res.json())
      .then((data: { events?: WatchEvent[] }) => {
        setEvents((data.events ?? []).filter((event) => event.progressPercent > 5 && event.progressPercent < 95).slice(0, 6));
      })
      .catch(() => setEvents([]));
  }, []);

  if (!events.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Continue Watching</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/watch/${event.movieId}`}
            className="glass-panel rounded-2xl p-3 text-sm transition hover:bg-white/10"
          >
            <p>Movie {event.movieId.slice(0, 6)}</p>
            <p className="text-xs text-white/70">{Math.round(event.progressPercent)}% watched</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
