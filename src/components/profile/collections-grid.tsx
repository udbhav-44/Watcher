"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FolderPlus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Collection = {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  itemCount: number;
};

export const CollectionsGrid = (): JSX.Element => {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch("/api/collections", {
        credentials: "same-origin"
      });
      if (!response.ok) {
        if (!cancelled) setCollections([]);
        return;
      }
      const data = (await response.json()) as { collections?: Collection[] };
      if (!cancelled) setCollections(data.collections ?? []);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    const response = await fetch("/api/collections", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed })
    });
    setCreating(false);
    if (!response.ok) {
      toast.error("Could not create collection");
      return;
    }
    const data = (await response.json()) as { collection: Collection };
    setCollections((prev) => [...(prev ?? []), data.collection]);
    setName("");
    toast.success(`Created "${data.collection.name}"`);
  };

  const remove = async (slug: string, label: string): Promise<void> => {
    const response = await fetch(`/api/collections/${slug}`, {
      method: "DELETE",
      credentials: "same-origin"
    });
    if (!response.ok) {
      toast.error("Could not delete collection");
      return;
    }
    setCollections((prev) =>
      (prev ?? []).filter((collection) => collection.slug !== slug)
    );
    toast.info(`Deleted "${label}"`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface-2 p-4 shadow-card">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs tracking-[0.16em] text-fg-faint uppercase">
              New collection
            </p>
            <p className="text-sm text-fg-muted">
              Group titles together (e.g. Weekend Picks, Awards Season).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void create();
              }
            }}
            placeholder="Collection name"
            className="md:w-72"
            aria-label="Collection name"
          />
          <Button
            type="button"
            onClick={create}
            disabled={!name.trim() || creating}
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {collections === null ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-lg border border-border bg-surface-2 p-4"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="No collections yet"
          description="Create a collection above to start grouping titles by theme, mood, or rewatchability."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4 shadow-card transition hover:border-border-strong"
            >
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/me/collections/${collection.slug}`}
                  className="line-clamp-1 text-lg font-semibold text-fg hover:underline"
                >
                  {collection.name}
                </Link>
                {collection.isDefault && (
                  <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] tracking-wider text-accent uppercase">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-fg-faint tabular-nums">
                {collection.itemCount} title
                {collection.itemCount === 1 ? "" : "s"}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <Link
                  href={`/me/collections/${collection.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-fg/[0.06] px-3 py-1 text-xs font-medium text-fg transition hover:bg-fg/[0.12]"
                >
                  Open
                  <ArrowRight className="h-3 w-3" />
                </Link>
                {!collection.isDefault && (
                  <button
                    type="button"
                    onClick={() => remove(collection.slug, collection.name)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-2 py-1 text-xs text-fg-faint transition hover:border-danger/40 hover:bg-danger/15 hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
