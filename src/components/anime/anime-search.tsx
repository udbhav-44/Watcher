"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

type Props = {
  initialQuery?: string;
};

export const AnimeSearch = ({ initialQuery = "" }: Props): JSX.Element => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/anime");
      return;
    }
    router.push(`/anime?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative max-w-xl">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-faint"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search anime by title…"
        className="h-11 w-full rounded-full border border-border bg-base/80 py-2 pr-4 pl-10 text-sm text-fg outline-none transition placeholder:text-fg-faint focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        aria-label="Search anime"
      />
    </form>
  );
};
