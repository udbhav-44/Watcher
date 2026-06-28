"use client";

import Link from "next/link";
import { Clock, Search, X } from "lucide-react";

import { useRecentSearches } from "@/hooks/use-recent-searches";

export const RecentSearches = (): JSX.Element | null => {
  const { searches, clearAll } = useRecentSearches();

  if (!searches || searches.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Recent searches">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-fg-faint uppercase">
          <Clock className="h-3 w-3" />
          Recent searches
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-fg-faint transition hover:text-fg"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.slice(0, 8).map((entry) => (
          <Link
            key={entry.id}
            href={`/search?q=${encodeURIComponent(entry.query)}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-fg/[0.04] px-3 py-1.5 text-sm text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
          >
            <Search className="h-3 w-3 shrink-0" />
            {entry.query}
          </Link>
        ))}
      </div>
    </section>
  );
};
