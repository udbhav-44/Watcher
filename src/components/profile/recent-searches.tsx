"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

type RecentSearch = {
  id: string;
  query: string;
  createdAt: string;
};

export const RecentSearches = (): JSX.Element | null => {
  const [searches, setSearches] = useState<RecentSearch[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch("/api/search-history", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) {
        if (!cancelled) setSearches([]);
        return;
      }
      const data = (await response.json()) as { searches?: RecentSearch[] };
      if (!cancelled) setSearches(data.searches ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearAll = async (): Promise<void> => {
    setSearches([]);
    await fetch("/api/search-history", {
      method: "DELETE",
      credentials: "same-origin"
    });
  };

  if (!searches || searches.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Recent searches</h2>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/60 transition hover:bg-white/[0.08]"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.slice(0, 12).map((entry) => (
          <Link
            key={entry.id}
            href={`/search?q=${encodeURIComponent(entry.query)}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-sm text-white/75 transition hover:bg-white/[0.08]"
          >
            <Search className="h-3 w-3" />
            {entry.query}
          </Link>
        ))}
      </div>
    </section>
  );
};
