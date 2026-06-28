"use client";

import { useEffect, useRef, useState } from "react";

export type SearchSuggestion = {
  titleId: string;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  posterUrl: string | null;
};

const DEBOUNCE_MS = 220;

export const useSearchSuggestions = (
  query: string
): { suggestions: SearchSuggestion[]; loading: boolean } => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const response = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { credentials: "same-origin" }
        );
        if (requestId !== requestIdRef.current) return;
        if (!response.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await response.json()) as { results: SearchSuggestion[] };
        setSuggestions(data.results ?? []);
      } catch {
        if (requestId === requestIdRef.current) setSuggestions([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { suggestions, loading };
};
