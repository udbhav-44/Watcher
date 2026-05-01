"use client";

import { useEffect } from "react";

type Props = {
  query: string;
};

export const RecordSearch = ({ query }: Props): null => {
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    void fetch("/api/search-history", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmed })
    });
  }, [query]);

  return null;
};
