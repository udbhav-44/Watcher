"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Props = {
  titleId: string;
  title?: string;
};

export const WatchedToggle = ({ titleId, title }: Props): JSX.Element => {
  const [watched, setWatched] = useState<boolean | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(
          `/api/watched?titleId=${encodeURIComponent(titleId)}`,
          { credentials: "same-origin" }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { watched?: { titleId: string } | null };
        if (!cancelled) setWatched(data.watched != null);
      } catch {
        if (!cancelled) setWatched(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  const toggle = async (): Promise<void> => {
    if (watched) {
      const response = await fetch(
        `/api/watched?titleId=${encodeURIComponent(titleId)}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      if (response.ok) {
        setWatched(false);
        toast.info(
          title ? `Removed “${title}” from Watched` : "Removed from Watched"
        );
      } else {
        toast.error("Could not update watched status");
      }
      return;
    }

    const response = await fetch("/api/watched", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    });
    if (response.ok) {
      setWatched(true);
      toast.success(
        title ? `Marked “${title}” as watched` : "Marked as watched"
      );
    } else {
      toast.error("Could not update watched status");
    }
  };

  if (watched === null) {
    return (
      <Button type="button" variant="ghost" size="lg" disabled aria-busy="true">
        <Eye className="h-4 w-4 opacity-40" />
        Watched
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={watched ? "subtle" : "outline"}
      size="lg"
      onClick={toggle}
      aria-pressed={watched}
    >
      {watched ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      {watched ? "Watched" : "Mark watched"}
    </Button>
  );
};
