"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Clock, Search, X } from "lucide-react";

import { SearchField } from "@/components/search/search-field";
import { useSearchCommand } from "@/components/search/search-provider";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { cn } from "@/lib/utils";

export const SearchCommand = (): JSX.Element => {
  const { open, closeSearch } = useSearchCommand();
  const { searches, clearAll } = useRecentSearches();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[min(16vh,120px)]">
          <motion.button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-base/75 backdrop-blur-sm"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeSearch}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search catalog"
            className="relative z-10 w-full max-w-2xl"
            initial={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }
            }
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-sm font-medium text-fg-muted">Search CampusStream</p>
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-full p-1.5 text-fg-faint transition hover:bg-fg/[0.08] hover:text-fg"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <SearchField
              variant="command"
              autoFocus
              onEscape={closeSearch}
              onNavigate={closeSearch}
            />

            {searches && searches.length > 0 && (
              <section className="mt-4 rounded-xl border border-border bg-surface/60 p-3 backdrop-blur">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] text-fg-faint uppercase">
                    <Clock className="h-3 w-3" />
                    Recent
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-fg-faint transition hover:text-fg"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searches.slice(0, 6).map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/search?q=${encodeURIComponent(entry.query)}`}
                      onClick={closeSearch}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border border-border bg-fg/[0.04]",
                        "px-3 py-1.5 text-sm text-fg-muted transition",
                        "hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
                      )}
                    >
                      <Search className="h-3 w-3 shrink-0" />
                      {entry.query}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-fg-faint">
              <span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  ↑↓
                </kbd>{" "}
                navigate
              </span>
              <span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  ↵
                </kbd>{" "}
                open
              </span>
              <span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono">
                  esc
                </kbd>{" "}
                close
              </span>
              <Link
                href="/search"
                onClick={closeSearch}
                className="ml-auto text-fg-muted transition hover:text-accent"
              >
                Advanced search →
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
