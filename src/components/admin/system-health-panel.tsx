"use client";

import { useEffect, useState, useCallback } from "react";
import { CircleCheck, CircleX, RefreshCw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Check = {
  ok: boolean;
  reason?: string;
  status?: number;
};

type ProviderCheck = Check & { host: string };

type Readiness = {
  ok: boolean;
  externalOk: boolean;
  timestamp: string;
  checks: {
    database: Check & { enabled: boolean };
    tmdb: Check;
    providers: ProviderCheck[];
  };
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

const Tone = ({
  ok,
  label
}: {
  ok: boolean;
  label: string;
}): JSX.Element => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tabular-nums",
      ok
        ? "border-success/40 bg-success/15 text-success"
        : "border-danger/40 bg-danger/15 text-danger"
    )}
  >
    {ok ? (
      <CircleCheck className="h-3 w-3" />
    ) : (
      <CircleX className="h-3 w-3" />
    )}
    {label}
  </span>
);

export const SystemHealthPanel = (): JSX.Element => {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/system/readiness", {
        cache: "no-store"
      });
      const payload = (await response.json()) as Readiness;
      setData(payload);
    } catch {
      setError("Could not reach the readiness endpoint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-danger/40 bg-danger/15 p-4 text-sm text-danger">
        <div className="flex items-center gap-2 font-medium">
          <ShieldAlert className="h-4 w-4" />
          Readiness endpoint unreachable
        </div>
        <p className="mt-1 text-xs">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  const providersOk = data.checks.providers.filter((p) => p.ok).length;
  const providersTotal = data.checks.providers.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Overall"
          value={data.ok ? "Operational" : "Degraded"}
          tone={data.ok ? "success" : "danger"}
        />
        <StatTile
          label="Database"
          value={
            data.checks.database.enabled
              ? data.checks.database.ok
                ? "Connected"
                : "Failing"
              : "Disabled"
          }
          tone={
            data.checks.database.ok
              ? "success"
              : data.checks.database.enabled
                ? "danger"
                : "neutral"
          }
        />
        <StatTile
          label="TMDb"
          value={data.checks.tmdb.ok ? "Reachable" : "Unreachable"}
          tone={data.checks.tmdb.ok ? "success" : "danger"}
        />
        <StatTile
          label="Providers"
          value={`${providersOk} / ${providersTotal}`}
          subValue={providersOk === providersTotal ? "All up" : "Some down"}
          tone={providersOk === providersTotal ? "success" : "warning"}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-xs tracking-[0.18em] text-accent uppercase">
              Provider health
            </p>
            <p className="text-xs text-fg-faint tabular-nums">
              Last checked {formatTime(data.timestamp)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-fg-faint uppercase">
              <th className="px-4 py-2 font-medium">Host</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">HTTP</th>
              <th className="px-4 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.checks.providers.map((entry, idx) => (
              <tr
                key={entry.host}
                className={cn(
                  "border-t border-border",
                  idx % 2 === 0 ? "" : "bg-fg/[0.02]",
                  !entry.ok && "bg-danger/[0.08]"
                )}
              >
                <td className="px-4 py-2 font-mono text-xs text-fg">
                  {entry.host}
                </td>
                <td className="px-4 py-2">
                  <Tone ok={entry.ok} label={entry.ok ? "Up" : "Down"} />
                </td>
                <td className="px-4 py-2 text-xs text-fg-muted tabular-nums">
                  {entry.status ?? "—"}
                </td>
                <td className="px-4 py-2 text-xs text-fg-muted">
                  {entry.reason ?? "Healthy"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatTile = ({
  label,
  value,
  subValue,
  tone
}: {
  label: string;
  value: string;
  subValue?: string;
  tone: "success" | "danger" | "warning" | "neutral";
}): JSX.Element => {
  const ring =
    tone === "success"
      ? "border-success/40"
      : tone === "danger"
        ? "border-danger/40"
        : tone === "warning"
          ? "border-warning/40"
          : "border-border";
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : tone === "warning"
          ? "text-warning"
          : "text-fg";
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface-2 p-4 shadow-card",
        ring
      )}
    >
      <p className="text-xs tracking-[0.16em] text-fg-faint uppercase">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", valueColor)}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-fg-muted tabular-nums">{subValue}</p>
      )}
    </div>
  );
};
