import Link from "next/link";
import type { Route } from "next";

import { AnimeCard } from "@/components/anime/anime-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecentAnimeCards } from "@/lib/data/anime";

type Props = {
  searchParams: { page?: string };
};

export default async function AnimeIndexPage({
  searchParams
}: Props): Promise<JSX.Element> {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const { items, pagination } = await getRecentAnimeCards(page, 24);
  const totalPages = pagination?.total_pages ?? 1;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(120deg, rgb(143 183 255 / 0.18) 0%, transparent 45%, rgb(242 196 109 / 0.08) 100%)"
          }}
          aria-hidden
        />
        <div className="relative space-y-2 px-6 py-8 md:px-8">
          <p className="text-[10px] tracking-[0.22em] text-info uppercase">
            Anime
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            Latest episodes
          </h1>
          <p className="max-w-prose text-pretty text-sm text-fg-muted">
            Sub and dub where available — same watch experience as the rest of
            CampusStream.
          </p>
        </div>
      </header>

      {items.length > 0 ? (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))"
          }}
        >
          {items.map((entry) => (
            <AnimeCard key={entry.id} anime={entry} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Catalog unavailable"
          description="The anime feed may be temporarily down. Try again in a few minutes."
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={`/anime?page=${page - 1}` as Route}
              className="inline-flex h-9 items-center rounded-full border border-border px-4 text-xs text-fg-muted transition hover:border-border-strong hover:text-fg"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-xs text-fg-faint tabular-nums">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/anime?page=${page + 1}` as Route}
              className="inline-flex h-9 items-center rounded-full border border-border px-4 text-xs text-fg-muted transition hover:border-border-strong hover:text-fg"
            >
              Next
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
