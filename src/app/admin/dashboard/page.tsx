import { notFound } from "next/navigation";
import { Activity, Database, FileCog, ShieldCheck } from "lucide-react";

import { SystemHealthPanel } from "@/components/admin/system-health-panel";
import { env } from "@/lib/config/env";

export default function AdminDashboardPage(): JSX.Element {
  if (env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD !== "true") {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          Operations
        </p>
        <h1 className="text-3xl font-semibold text-fg">Admin dashboard</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Live readiness signals and a quick reference to the secured admin
          endpoints. Action endpoints require an internal admin key.
        </p>
      </div>

      <section aria-labelledby="health-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="health-heading"
            className="text-xl font-medium text-fg"
          >
            System health
          </h2>
          <span className="inline-flex items-center gap-1 text-xs text-fg-faint">
            <Activity className="h-3 w-3" />
            Auto-loaded from
            <code className="rounded bg-fg/[0.06] px-1 py-0.5 font-mono text-[11px] text-fg">
              /api/system/readiness
            </code>
          </span>
        </div>
        <SystemHealthPanel />
      </section>

      <section aria-labelledby="endpoints-heading" className="space-y-4">
        <h2 id="endpoints-heading" className="text-xl font-medium text-fg">
          Operational endpoints
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <EndpointCard
            icon={<FileCog className="h-5 w-5" />}
            title="Catalog ingest"
            description="Trigger title sync from your internal cron or runbook."
            method="POST"
            path="/api/admin/ingest"
            tone="info"
          />
          <EndpointCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Moderation"
            description="Activate or deactivate titles by catalog ID."
            method="POST"
            path="/api/admin/moderation"
            tone="warning"
          />
          <EndpointCard
            icon={<Database className="h-5 w-5" />}
            title="Health probe"
            description="DB + ingest-queue status for monitoring agents."
            method="GET"
            path="/api/admin/health"
            tone="info"
          />
        </div>
        <p className="text-xs text-fg-faint">
          All admin endpoints expect an{" "}
          <code className="rounded bg-fg/[0.06] px-1 py-0.5 font-mono text-[11px] text-fg">
            X-Admin-Key
          </code>{" "}
          header matching the configured server secret.
        </p>
      </section>
    </div>
  );
}

const EndpointCard = ({
  icon,
  title,
  description,
  method,
  path,
  tone
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  tone: "info" | "warning" | "danger" | "neutral";
}): JSX.Element => {
  const toneRing =
    tone === "info"
      ? "border-info/30"
      : tone === "warning"
        ? "border-warning/30"
        : tone === "danger"
          ? "border-danger/30"
          : "border-border";
  const toneText =
    tone === "info"
      ? "text-info"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-danger"
          : "text-fg-muted";
  const toneBg =
    tone === "info"
      ? "bg-info/10"
      : tone === "warning"
        ? "bg-warning/10"
        : tone === "danger"
          ? "bg-danger/10"
          : "bg-fg/[0.06]";

  return (
    <div className={`rounded-lg border ${toneRing} bg-surface-2 p-4 shadow-card`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneBg} ${toneText}`}
        >
          {icon}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-fg">{title}</p>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`rounded-full border ${toneRing} ${toneBg} px-2 py-0.5 font-mono text-[10px] font-semibold ${toneText} tabular-nums`}
        >
          {method}
        </span>
        <code className="truncate font-mono text-xs text-fg">{path}</code>
      </div>
    </div>
  );
};
