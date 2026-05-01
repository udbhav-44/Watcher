"use client";

import { useEffect, useState } from "react";
import { Bookmark, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Marker = {
  endSeconds: number;
};

type Props = {
  titleId: string;
  season?: number | null;
  episode?: number | null;
  kind?: "intro" | "recap" | "credits";
};

export const SkipIntroControls = ({
  titleId,
  season,
  episode,
  kind = "intro"
}: Props): JSX.Element => {
  const [marker, setMarker] = useState<Marker | null>(null);
  const [draft, setDraft] = useState<string>("90");
  const [open, setOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("titleId", titleId);
    params.set("kind", kind);
    if (season != null) params.set("season", String(season));
    if (episode != null) params.set("episode", String(episode));

    const load = async (): Promise<void> => {
      const response = await fetch(`/api/skip-markers?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) return;
      const data = (await response.json()) as { markers?: Marker[] };
      if (!cancelled && data.markers && data.markers.length > 0) {
        setMarker(data.markers[0]);
        setDraft(String(data.markers[0].endSeconds));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [titleId, season, episode, kind]);

  const save = async (): Promise<void> => {
    const seconds = Number(draft);
    if (!Number.isFinite(seconds) || seconds < 1) {
      toast.error("Enter seconds (e.g. 90)");
      return;
    }
    const response = await fetch("/api/skip-markers", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleId,
        season: season ?? undefined,
        episode: episode ?? undefined,
        kind,
        endSeconds: seconds
      })
    });
    if (!response.ok) {
      toast.error("Could not save marker");
      return;
    }
    setMarker({ endSeconds: seconds });
    setOpen(false);
    toast.success(`Skip ${kind} saved at ${seconds}s`);
  };

  const clear = async (): Promise<void> => {
    const params = new URLSearchParams();
    params.set("titleId", titleId);
    params.set("kind", kind);
    if (season != null) params.set("season", String(season));
    if (episode != null) params.set("episode", String(episode));
    const response = await fetch(`/api/skip-markers?${params.toString()}`, {
      method: "DELETE",
      credentials: "same-origin"
    });
    if (!response.ok) {
      toast.error("Could not clear marker");
      return;
    }
    setMarker(null);
    setDraft("90");
    toast.info("Skip marker cleared");
  };

  return (
    <div className="surface-panel flex flex-wrap items-center gap-3 rounded-lg p-3 text-sm text-white/75">
      <Bookmark className="h-4 w-4 text-[#f2c46d]" />
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <span className="text-xs tracking-[0.16em] text-white/56 uppercase">
          Skip {kind}
        </span>
        {marker ? (
          <span className="text-xs text-white/60">
            Saved at {marker.endSeconds}s. Embed players can&apos;t auto-skip,
            but use the player controls to seek when you see the next-episode
            UI.
          </span>
        ) : (
          <span className="text-xs text-white/60">
            Save a marker (e.g. 90s) so future episodes know where the intro
            ends.
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {open ? (
          <>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-8 w-20 rounded-md border border-white/15 bg-black/30 px-2 text-xs"
              aria-label="Intro end seconds"
            />
            <Button type="button" size="sm" onClick={save}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
            >
              {marker ? `Edit (${marker.endSeconds}s)` : "Add marker"}
            </Button>
            {marker && (
              <Button type="button" size="sm" variant="ghost" onClick={clear}>
                Clear
              </Button>
            )}
            <a
              href="https://www.youtube.com/results?search_query=skip+intro"
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs text-white/40 sm:inline-flex sm:items-center"
            >
              Tip
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </>
        )}
      </div>
    </div>
  );
};
