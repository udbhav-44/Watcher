"use client";

import { useEffect, useState } from "react";
import { Bookmark, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Collection = {
  id: string;
  name: string;
  slug: string;
  isDefault?: boolean;
};

type CollectionStatus = {
  inSlugs: string[];
};

type Reaction = "LIKE" | "FIRE" | "WOW";

type Props = {
  titleId: string;
  title?: string;
  mediaType?: "movie" | "tv";
};

export const TitleActions = ({
  titleId,
  title,
  mediaType = "movie"
}: Props): JSX.Element => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [status, setStatus] = useState<CollectionStatus>({ inSlugs: [] });
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const [collectionsRes, statusRes, reactionsRes] = await Promise.all([
        fetch("/api/collections", { credentials: "same-origin" }),
        fetch(
          `/api/collections/membership?titleId=${encodeURIComponent(titleId)}`,
          { credentials: "same-origin" }
        ),
        fetch(`/api/reactions?titleId=${encodeURIComponent(titleId)}`, {
          credentials: "same-origin"
        })
      ]);

      if (!cancelled && collectionsRes.ok) {
        const data = (await collectionsRes.json()) as {
          collections?: Collection[];
        };
        setCollections(data.collections ?? []);
      }
      if (!cancelled && statusRes.ok) {
        const data = (await statusRes.json()) as CollectionStatus;
        setStatus(data);
      }
      if (!cancelled && reactionsRes.ok) {
        const data = (await reactionsRes.json()) as {
          reaction?: { type: Reaction } | null;
        };
        setReaction(data.reaction?.type ?? null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  const inDefault = status.inSlugs.includes("watchlist");

  const toggleWatchlist = async (): Promise<void> => {
    if (inDefault) {
      const response = await fetch(
        `/api/watchlist?titleId=${encodeURIComponent(titleId)}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      if (response.ok) {
        setStatus((prev) => ({
          inSlugs: prev.inSlugs.filter((slug) => slug !== "watchlist")
        }));
        toast.info(
          title ? `Removed “${title}” from Watchlist` : "Removed from Watchlist"
        );
      } else {
        toast.error("Could not update watchlist");
      }
      return;
    }

    const response = await fetch("/api/watchlist", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    });
    if (response.ok) {
      setStatus((prev) => ({
        inSlugs: prev.inSlugs.includes("watchlist")
          ? prev.inSlugs
          : [...prev.inSlugs, "watchlist"]
      }));
      toast.success(
        title ? `Added “${title}” to Watchlist` : "Added to Watchlist"
      );
    } else {
      toast.error("Could not update watchlist");
    }
  };

  const toggleCollection = async (slug: string): Promise<void> => {
    const isMember = status.inSlugs.includes(slug);
    const url = `/api/collections/${slug}/items`;
    const response = await fetch(url, {
      method: isMember ? "DELETE" : "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    });
    if (!response.ok) {
      toast.error("Could not update collection");
      return;
    }
    setStatus((prev) => ({
      inSlugs: isMember
        ? prev.inSlugs.filter((current) => current !== slug)
        : [...prev.inSlugs, slug]
    }));
    const collection = collections.find((entry) => entry.slug === slug);
    toast.success(
      isMember
        ? `Removed from ${collection?.name ?? slug}`
        : `Saved to ${collection?.name ?? slug}`
    );
  };

  const createCollection = async (): Promise<void> => {
    const trimmed = newName.trim();
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
    setCollections((prev) => [...prev, data.collection]);
    setNewName("");
    await toggleCollection(data.collection.slug);
  };

  const setMovieReaction = async (next: Reaction): Promise<void> => {
    const previous = reaction;
    setReaction(next);
    const response = await fetch("/api/reactions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId, type: next })
    });
    if (!response.ok) {
      setReaction(previous);
      toast.error("Could not save reaction");
      return;
    }
    toast.success(
      next === "LIKE" ? "Liked" : next === "FIRE" ? "Fire reaction" : "Wow reaction"
    );
  };

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={inDefault ? "subtle" : "outline"}
        size="lg"
        onClick={toggleWatchlist}
      >
        <Bookmark className="mr-2 h-4 w-4" />
        {inDefault ? "Saved" : "Save"}
      </Button>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          Save to...
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
        {open && (
          <div
            role="menu"
            className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-white/15 bg-[#0d0d0d]/95 p-2 shadow-xl backdrop-blur"
          >
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {collections.length === 0 && (
                <p className="px-2 py-2 text-xs text-white/56">
                  No collections yet. Create one below.
                </p>
              )}
              {collections.map((collection) => {
                const checked = status.inSlugs.includes(collection.slug);
                return (
                  <button
                    key={collection.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => toggleCollection(collection.slug)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                      checked
                        ? "bg-white/[0.08] text-white"
                        : "text-white/70 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="line-clamp-1">{collection.name}</span>
                    <span
                      className={`text-xs ${
                        checked ? "text-[#f2c46d]" : "text-white/40"
                      }`}
                    >
                      {checked ? "Saved" : "Save"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="New collection"
                className="h-8 flex-1 rounded-md border border-white/15 bg-black/30 px-2 text-xs text-white placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70 focus-visible:outline-none"
                aria-label="New collection name"
              />
              <button
                type="button"
                onClick={createCollection}
                disabled={!newName.trim() || creating}
                className="inline-flex items-center gap-1 rounded-md bg-[#f2c46d]/90 px-2 py-1 text-xs font-semibold text-black transition hover:bg-[#f2c46d] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={reaction === "LIKE" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMovieReaction("LIKE")}
        >
          Like
        </Button>
        <Button
          type="button"
          variant={reaction === "FIRE" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMovieReaction("FIRE")}
        >
          Fire
        </Button>
        <Button
          type="button"
          variant={reaction === "WOW" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setMovieReaction("WOW")}
        >
          Wow
        </Button>
      </div>
      <span className="sr-only">Media type: {mediaType}</span>
    </div>
  );
};
