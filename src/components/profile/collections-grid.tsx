"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    toast.success(`Created “${data.collection.name}”`);
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
    toast.info(`Deleted “${label}”`);
  };

  if (collections === null) {
    return (
      <Card>
        <p className="text-sm text-white/68">Loading collections...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-white/56 uppercase">
            New collection
          </p>
          <p className="text-sm text-white/68">
            Group titles together (e.g. Weekend Picks, Awards Season).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Collection name"
            className="md:w-72"
            aria-label="Collection name"
          />
          <Button
            type="button"
            onClick={create}
            disabled={!name.trim() || creating}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card key={collection.id} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/me/collections/${collection.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {collection.name}
              </Link>
              {collection.isDefault && (
                <span className="rounded-full border border-[#f2c46d]/40 bg-[#f2c46d]/15 px-2 py-0.5 text-[10px] tracking-wider text-[#f2c46d] uppercase">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-white/56">
              {collection.itemCount} title
              {collection.itemCount === 1 ? "" : "s"}
            </p>
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/me/collections/${collection.slug}`}
                className="text-xs text-[#f2c46d] hover:underline"
              >
                Open
              </Link>
              {!collection.isDefault && (
                <button
                  type="button"
                  onClick={() => remove(collection.slug, collection.name)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-white/60 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
