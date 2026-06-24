"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Shield, Volume2 } from "lucide-react";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlayableProvider = {
  id: string;
  label: string;
  url: string;
  adQuality?: "low" | "medium" | "heavy";
};

const AD_QUALITY_DOT: Record<"low" | "medium" | "heavy", string> = {
  low: "bg-success",
  medium: "bg-warning",
  heavy: "bg-danger"
};

const AD_QUALITY_LABEL: Record<"low" | "medium" | "heavy", string> = {
  low: "Lighter ads",
  medium: "Moderate ads",
  heavy: "Heavy ads"
};

type Props = {
  titleId: string;
  poster?: string | null;
  providers: PlayableProvider[];
  /** Direct external link (no embed) — typically the PlayIMDb series page. */
  externalUrl?: string | null;
  externalLabel?: string;
  mediaType?: "movie" | "tv";
  episodeLabel?: string | null;
};

const PROVIDER_PREFERENCE_KEY = "campusstream:preferred-provider";

export const ServerTogglePlayer = ({
  titleId,
  poster,
  providers,
  externalUrl,
  externalLabel = "Open in new tab",
  mediaType = "movie",
  episodeLabel
}: Props): JSX.Element => {
  const fallbackId = providers[0]?.id ?? "";
  const [providerId, setProviderId] = useState<string>(fallbackId);

  useEffect(() => {
    if (providers.length === 0) return;
    try {
      const stored = window.localStorage.getItem(PROVIDER_PREFERENCE_KEY);
      if (stored && providers.some((entry) => entry.id === stored)) {
        setProviderId(stored);
        return;
      }
    } catch {
      // localStorage may be unavailable (incognito, SSR fallthrough)
    }
    setProviderId(providers[0].id);
  }, [providers]);

  const active = useMemo(
    () => providers.find((entry) => entry.id === providerId) ?? providers[0],
    [providerId, providers]
  );

  const selectProvider = (id: string): void => {
    setProviderId(id);
    try {
      window.localStorage.setItem(PROVIDER_PREFERENCE_KEY, id);
    } catch {
      // ignored
    }
  };

  const cycleNext = (): void => {
    if (providers.length <= 1) return;
    const currentIndex = providers.findIndex((entry) => entry.id === providerId);
    const nextIndex = (currentIndex + 1) % providers.length;
    selectProvider(providers[nextIndex].id);
  };

  if (providers.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
        <p className="font-medium">No streaming providers resolved for this title.</p>
        <p className="text-xs text-warning/80">
          The title couldn&apos;t be mapped to a TMDb id, so the embed
          providers can&apos;t build a URL. Verify the catalog id, or check
          that TMDB_API_KEY is set and reachable.
        </p>
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-fg/[0.04] px-3 py-1.5 text-xs text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg"
          >
            {externalLabel}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <StreamingPlayer src={active.url} poster={poster} titleId={titleId} />

      <div className="glass-panel space-y-3 rounded-lg p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.18em] text-fg-faint uppercase">
              Active server
            </p>
            <p className="text-sm font-medium text-fg">
              {active.label}
              {episodeLabel ? (
                <span className="text-fg-muted">  ·  {episodeLabel}</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cycleNext}
              disabled={providers.length <= 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Next server
            </Button>
            <a
              href={active.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-3 py-1.5 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
            >
              Open in new tab
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {providers.map((entry) => {
            const isActive = entry.id === active.id;
            const quality = entry.adQuality ?? "medium";
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => selectProvider(entry.id)}
                aria-pressed={isActive}
                title={AD_QUALITY_LABEL[quality]}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                  isActive
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-border bg-fg/[0.04] text-fg-muted hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    AD_QUALITY_DOT[quality]
                  )}
                />
                {entry.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 text-xs">
          <p className="inline-flex items-start gap-1.5 text-fg-muted">
            <Volume2 className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            <span>
              To change audio language, subtitles, or quality, use the
              player&apos;s own settings (gear) menu. Switching servers above
              can also surface a different audio track when one source is
              English-only.
            </span>
          </p>
          <p className="inline-flex items-start gap-1.5 text-fg-muted">
            <Shield className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            <span>
              Free embed providers are ad-supported. Pick a green-dot server
              for the lightest ads, and install{" "}
              <a
                href="https://ublockorigin.com"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                uBlock Origin
              </a>{" "}
              to silence the rest.
            </span>
          </p>
          <p className="text-fg-faint">
            {mediaType === "tv"
              ? "Episode availability varies by source. Try the next server if playback stalls."
              : "Try the next server if playback stalls. Each source aggregates a different upstream catalog."}
            {externalUrl && (
              <>
                {" "}
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-accent hover:underline"
                >
                  {externalLabel}
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
