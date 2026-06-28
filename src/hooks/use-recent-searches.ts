"use client";

import { useCallback, useEffect, useState } from "react";

export type RecentSearch = {
  id: string;
  query: string;
  createdAt: string;
};

export const useRecentSearches = (): {
  searches: RecentSearch[] | null;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
} => {
  const [searches, setSearches] = useState<RecentSearch[] | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const response = await fetch("/api/search-history", {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (!response.ok) {
      setSearches([]);
      return;
    }
    const data = (await response.json()) as { searches?: RecentSearch[] };
    setSearches(data.searches ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const clearAll = async (): Promise<void> => {
    setSearches([]);
    await fetch("/api/search-history", {
      method: "DELETE",
      credentials: "same-origin"
    });
  };

  return { searches, clearAll, refresh };
};
