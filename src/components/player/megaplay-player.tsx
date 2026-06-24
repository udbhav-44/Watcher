"use client";

import { useEffect, useMemo, useState } from "react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MegaplayLanguage } from "@/lib/streaming/megaplay";

const LANGUAGE_KEY = "campusstream:anime-language";

type Props = {
  src: string;
  poster?: string | null;
  titleId: string;
  hasSub: boolean;
  hasDub: boolean;
  episodeLabel?: string | null;
};

export const MegaplayPlayer = ({
  src,
  poster,
  titleId,
  hasSub,
  hasDub,
  episodeLabel
}: Props): JSX.Element => {
  const defaultLanguage: MegaplayLanguage = hasSub ? "sub" : "dub";
  const [language, setLanguage] = useState<MegaplayLanguage>(defaultLanguage);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_KEY);
      if (stored === "sub" && hasSub) setLanguage("sub");
      if (stored === "dub" && hasDub) setLanguage("dub");
    } catch {
      // ignore
    }
  }, [hasSub, hasDub]);

  const activeSrc = useMemo(() => {
    if (language === "dub" && hasDub) {
      return src.replace(/\/(sub|dub)$/, "/dub");
    }
    if (language === "sub" && hasSub) {
      return src.replace(/\/(sub|dub)$/, "/sub");
    }
    return src;
  }, [src, language, hasSub, hasDub]);

  const selectLanguage = (next: MegaplayLanguage): void => {
    setLanguage(next);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      <StreamingPlayer src={activeSrc} poster={poster} titleId={titleId} />
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-fg-faint uppercase">
            Audio
          </p>
          <p className="text-sm font-medium text-fg">
            MegaPlay
            {episodeLabel ? (
              <span className="text-fg-muted">  ·  {episodeLabel}</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === "sub" ? "primary" : "outline"}
            disabled={!hasSub}
            onClick={() => selectLanguage("sub")}
            className={cn(!hasSub && "opacity-50")}
          >
            Sub
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "dub" ? "primary" : "outline"}
            disabled={!hasDub}
            onClick={() => selectLanguage("dub")}
            className={cn(!hasDub && "opacity-50")}
          >
            Dub
          </Button>
        </div>
      </div>
    </div>
  );
};
