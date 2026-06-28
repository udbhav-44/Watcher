"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react";
import { ArrowRight, Film, Loader2, Search, Tv, X } from "lucide-react";

import {
  useSearchSuggestions,
  type SearchSuggestion
} from "@/hooks/use-search-suggestions";
import { detailHrefFor } from "@/lib/catalog/titleId";
import { cn } from "@/lib/utils";

type Variant = "page" | "command";

type Props = {
  initialQuery?: string;
  variant?: Variant;
  autoFocus?: boolean;
  inputId?: string;
  onEscape?: () => void;
  onNavigate?: () => void;
  className?: string;
};

const HighlightMatch = ({
  text,
  query
}: {
  text: string;
  query: string;
}): JSX.Element => {
  const normalized = query.trim().toLowerCase();
  const idx = normalized ? text.toLowerCase().indexOf(normalized) : -1;
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-accent-soft text-accent">
        {text.slice(idx, idx + normalized.length)}
      </mark>
      {text.slice(idx + normalized.length)}
    </>
  );
};

export const SearchField = ({
  initialQuery = "",
  variant = "page",
  autoFocus = false,
  inputId,
  onEscape,
  onNavigate,
  className
}: Props): JSX.Element => {
  const fallbackId = useId();
  const fieldId = inputId ?? fallbackId;
  const listboxId = `${fieldId}-suggestions`;
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { suggestions, loading } = useSearchSuggestions(query);
  const isCommand = variant === "command";
  const trimmed = query.trim();
  const showPanel = open && (loading || trimmed.length > 0);
  const showViewAll = trimmed.length > 0;

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions, query]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const navigateToSearch = useCallback(
    (value: string): void => {
      const next = value.trim();
      if (!next) return;
      onNavigate?.();
      router.push(`/search?q=${encodeURIComponent(next)}`);
    },
    [onNavigate, router]
  );

  const navigateToSuggestion = useCallback(
    (entry: SearchSuggestion): void => {
      onNavigate?.();
      router.push(detailHrefFor(entry.titleId));
    },
    [onNavigate, router]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      navigateToSuggestion(suggestions[activeIndex]);
      return;
    }
    navigateToSearch(query);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      onEscape?.();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!showPanel) setOpen(true);
      setActiveIndex((prev) =>
        suggestions.length === 0 ? -1 : Math.min(prev + 1, suggestions.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? -1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      navigateToSuggestion(suggestions[activeIndex]);
    }
  };

  const clearQuery = (): void => {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <form
        action="/search"
        onSubmit={handleSubmit}
        className={cn(
          "surface-panel flex items-center gap-2 border transition duration-200 ease-out-soft focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/30",
          isCommand
            ? "rounded-xl px-4 py-3 shadow-card"
            : "rounded-full px-4 py-2.5"
        )}
        role="search"
      >
        {loading ? (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-fg-faint"
            aria-hidden
          />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-fg-faint" aria-hidden />
        )}
        <input
          ref={inputRef}
          id={fieldId}
          name="q"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 180)}
          onKeyDown={handleKeyDown}
          placeholder={
            isCommand
              ? "Search movies, TV shows, genres..."
              : "Search titles, actors, genres..."
          }
          aria-label="Search catalog"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={showPanel ? listboxId : undefined}
          aria-expanded={showPanel}
          autoComplete="off"
          autoFocus={autoFocus}
          className={cn(
            "flex-1 bg-transparent text-fg outline-none placeholder:text-fg-faint",
            isCommand ? "text-base" : "text-sm"
          )}
        />
        {trimmed && (
          <button
            type="button"
            onClick={clearQuery}
            className="rounded-full p-1 text-fg-faint transition hover:bg-fg/[0.08] hover:text-fg"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!isCommand && (
          <button
            type="submit"
            className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-fg-on-accent transition hover:bg-accent-hover"
          >
            Search
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] left-0 right-0 z-40 overflow-hidden rounded-xl border border-border bg-overlay shadow-lift backdrop-blur-xl",
            isCommand ? "max-h-[min(420px,50vh)]" : "max-h-[320px]"
          )}
        >
          <div className="max-h-[inherit] overflow-y-auto overscroll-contain">
            {loading && suggestions.length === 0 ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <div className="h-12 w-9 rounded bg-fg/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-fg/[0.06]" />
                      <div className="h-2 w-1/4 rounded bg-fg/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((entry, index) => {
                const active = index === activeIndex;
                return (
                  <Link
                    key={entry.titleId}
                    href={detailHrefFor(entry.titleId)}
                    prefetch
                    role="option"
                    aria-selected={active}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 text-sm transition last:border-b-0",
                      active
                        ? "bg-accent-soft text-fg"
                        : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg"
                    )}
                  >
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2">
                      {entry.posterUrl ? (
                        <Image
                          src={entry.posterUrl}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-fg-faint">
                          {entry.mediaType === "tv" ? (
                            <Tv className="h-4 w-4" />
                          ) : (
                            <Film className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium">
                        <HighlightMatch text={entry.title} query={trimmed} />
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-fg-faint">
                        <span>{entry.mediaType === "tv" ? "TV" : "Movie"}</span>
                        {entry.year && (
                          <>
                            <span aria-hidden>·</span>
                            <span>{entry.year}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition",
                        active ? "text-accent" : "text-fg-faint opacity-0"
                      )}
                    />
                  </Link>
                );
              })
            ) : trimmed ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-fg-muted">No quick matches</p>
                <p className="mt-1 text-xs text-fg-faint">
                  Press Enter to search the full catalog
                </p>
              </div>
            ) : null}
          </div>

          {showViewAll && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => navigateToSearch(query)}
              className="flex w-full items-center justify-between border-t border-border bg-surface/80 px-4 py-2.5 text-left text-sm text-fg-muted transition hover:bg-fg/[0.04] hover:text-fg"
            >
              <span>
                View all results for{" "}
                <span className="font-medium text-fg">&ldquo;{trimmed}&rdquo;</span>
              </span>
              <ArrowRight className="h-4 w-4 text-fg-faint" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
