"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Props = {
  titleId: string;
  mediaType?: "movie" | "tv";
  initialScore?: number | null;
  className?: string;
};

export const RatingWidget = ({
  titleId,
  mediaType = "movie",
  initialScore = null,
  className
}: Props): JSX.Element => {
  const [score, setScore] = useState<number | null>(initialScore);
  const [hover, setHover] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      const response = await fetch(
        `/api/ratings?titleId=${encodeURIComponent(titleId)}`,
        { credentials: "same-origin", cache: "no-store" }
      );
      if (!response.ok) return;
      const data = (await response.json()) as { rating?: { score: number } | null };
      if (!cancelled && data.rating) {
        setScore(data.rating.score);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  const submit = async (next: number): Promise<void> => {
    const previous = score;
    setScore(next);
    setPending(true);
    const response = await fetch("/api/ratings", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId, score: next, mediaType })
    });
    setPending(false);
    if (!response.ok) {
      setScore(previous);
      toast.error("Could not save rating. Please try again.");
      return;
    }
    toast.success(`Rated ${next} star${next === 1 ? "" : "s"}`);
  };

  const display = hover ?? score ?? 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-white/70",
        className
      )}
      role="radiogroup"
      aria-label="Rate this title"
    >
      <span className="text-xs tracking-[0.16em] text-white/56 uppercase">
        Your rating
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(value)}
            onBlur={() => setHover(null)}
            onClick={() => submit(value)}
            disabled={pending}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            aria-checked={score === value}
            role="radio"
            className={cn(
              "rounded p-1 transition focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70 focus-visible:outline-none",
              value <= display ? "text-[#f2c46d]" : "text-white/30"
            )}
          >
            <Star
              className="h-5 w-5"
              fill={value <= display ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      {score && !pending && (
        <span className="text-xs text-white/56">{score}/5</span>
      )}
    </div>
  );
};
