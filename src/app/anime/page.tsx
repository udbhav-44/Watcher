import Link from "next/link";
import type { Route } from "next";

import { AnimeCard } from "@/components/anime/anime-card";
import { AnimeSearch } from "@/components/anime/anime-search";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getRecentAnimeCards,
  getSeasonalAnimeCards,
  getTopAnimeCards,
  searchAnimeCards
} from "@/lib/data/anime";

type Props = {
  searchParams: { page?: string; q?: string };
};

const AnimeRail = ({
  title,
  subtitle,
  items
}: {
  title: string;
  subtitle?: string;
  items: Awaited<ReturnType<typeof getSeasonalAnimeCards>>;
}): JSX.Element | null => {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-medium text-fg">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-fg-muted">{subtitle}</p>
        ) : null}
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
      >
        {items.map((entry) => (
          <AnimeCard key={entry.id} anime={entry} />
        ))}
      </div>
    </section>
  );
};

export default async function AnimeIndexPage({
  searchParams
}: Props): Promise<JSX.Element> {
  const query = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  if (query) {
    const results = await searchAnimeCards(query, 36);
    return (
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.22em] text-info uppercase">
              Anime search
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              &ldquo;{query}&rdquo;
            </h1>
            <p className="text-sm text-fg-muted tabular-nums">
              {results.length}{" "}
              {results.length === 1 ? "result" : "results"} from MyAnimeList
            </p>
          </div>
          <AnimeSearch initialQuery={query} />
        </header>

        {results.length > 0 ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))"
            }}
          >
            {results.map((entry) => (
              <AnimeCard key={entry.id} anime={entry} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No anime found for "${query}"`}
            description="Try another title or check the spelling."
          />
        )}
      </div>
    );
  }

  const [seasonal, top, recent] = await Promise.all([
    getSeasonalAnimeCards(24),
    getTopAnimeCards(24),
    getRecentAnimeCards(page, 24)
  ]);
  const totalPages = recent.pagination?.total_pages ?? 1;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(120deg, rgb(143 183 255 / 0.18) 0%, transparent 45%, rgb(242 196 109 / 0.08) 100%)"
          }}
          aria-hidden
        />
        <div className="relative space-y-4 px-6 py-8 md:px-8">
          <div className="space-y-2">
            <p className="text-[10px] tracking-[0.22em] text-info uppercase">
              Anime
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              Browse &amp; watch
            </h1>
            <p className="max-w-prose text-pretty text-sm text-fg-muted">
              Catalog powered by MyAnimeList (Jikan). Sub and dub where your
              chosen server supports it.
            </p>
          </div>
          <AnimeSearch />
        </div>
      </header>

      <AnimeRail
        title="Airing this season"
        subtitle="Current seasonal anime from MyAnimeList"
        items={seasonal}
      />

      <AnimeRail
        title="Top anime"
        subtitle="Highest rated on MyAnimeList"
        items={top}
      />

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-medium text-fg">Recently updated</h2>
          <p className="text-sm text-fg-muted">
            Fresh episode drops (Anikoto feed, server-cached)
          </p>
        </div>

        {recent.items.length > 0 ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))"
            }}
          >
            {recent.items.map((entry) => (
              <AnimeCard key={entry.id} anime={entry} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Recently updated feed unavailable"
            description="The Anikoto feed may be temporarily down. Browse seasonal or top anime above."
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
      </section>
    </div>
  );
}
