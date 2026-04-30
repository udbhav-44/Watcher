"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  titleId: string;
};

export const TitleActions = ({ titleId }: Props): JSX.Element => {
  const [saved, setSaved] = useState(false);
  const [reaction, setReaction] = useState<"LIKE" | "FIRE" | "WOW" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const addToWatchlist = async (): Promise<void> => {
    setSaved(true);
    const response = await fetch("/api/watchlist", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId })
    });
    if (response.ok) {
      setError(null);
      return;
    }
    setSaved(false);
    setError("Could not update watchlist. Please try again.");
  };

  const setMovieReaction = async (
    type: "LIKE" | "FIRE" | "WOW"
  ): Promise<void> => {
    setReaction(type);
    const response = await fetch("/api/reactions", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId, type })
    });
    if (response.ok) {
      setError(null);
      return;
    }
    setReaction(null);
    setError("Could not save reaction. Please try again.");
  };

  return (
    <div className="relative z-10 flex flex-wrap gap-3">
      <Button
        type="button"
        variant={saved ? "subtle" : "outline"}
        size="lg"
        onClick={addToWatchlist}
      >
        {saved ? "Saved" : "Add to watchlist"}
      </Button>
      <Button
        type="button"
        variant={reaction === "LIKE" ? "primary" : "ghost"}
        size="lg"
        onClick={() => setMovieReaction("LIKE")}
      >
        Like
      </Button>
      <Button
        type="button"
        variant={reaction === "FIRE" ? "primary" : "ghost"}
        size="lg"
        onClick={() => setMovieReaction("FIRE")}
      >
        Fire
      </Button>
      <Button
        type="button"
        variant={reaction === "WOW" ? "primary" : "ghost"}
        size="lg"
        onClick={() => setMovieReaction("WOW")}
      >
        Wow
      </Button>
      {error && <p className="w-full text-sm text-rose-300">{error}</p>}
    </div>
  );
};
