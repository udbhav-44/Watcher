"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  trailerUrl: string;
  title: string;
};

const youTubeIdFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
};

export const TrailerModal = ({ trailerUrl, title }: Props): JSX.Element => {
  const [open, setOpen] = useState(false);
  const youTubeId = youTubeIdFromUrl(trailerUrl);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [open]);

  if (!youTubeId) {
    return (
      <a href={trailerUrl} target="_blank" rel="noreferrer">
        <Button type="button" variant="outline" size="lg">
          Trailer <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </a>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
      >
        Watch trailer
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
        >
          <div
            className="relative aspect-video w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 rounded-full border border-white/20 bg-black/60 p-2 text-white transition hover:bg-black/80"
              aria-label="Close trailer"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              className="h-full w-full rounded-lg border border-white/10 bg-black"
              src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};
