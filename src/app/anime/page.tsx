import Link from "next/link";
import type { Route } from "next";

import { AnimeCard } from "@/components/anime/anime-card";
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
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          Catalog
        </p>
        <h1 className="text-3xl font-semibold text-fg">Anime</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Recent releases from Anikoto, streamed via MegaPlay. Sub and dub where
          available.
        </p>
      </div>

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
        <p className="text-sm text-fg-muted">
          Could not load anime catalog. The Anikoto API may be temporarily
          unavailable.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link
              href={`/anime?page=${page - 1}` as Route}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs text-fg-muted transition hover:border-border-strong hover:text-fg"
            >
              Previous
            </Link>
          ) : null}
          <span className="text-xs text-fg-faint tabular-nums">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/anime?page=${page + 1}` as Route}
              className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs text-fg-muted transition hover:border-border-strong hover:text-fg"
            >
              Next
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
