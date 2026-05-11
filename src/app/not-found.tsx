import Link from "next/link";
import { Compass, WifiOff } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound(): JSX.Element {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <EmptyState
        icon={<Compass className="h-5 w-5" />}
        title="We couldn't find that page"
        description="The title may have been removed, or the catalog source (TMDb) is temporarily unreachable from your network."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent transition hover:bg-accent-hover"
            >
              Back to home
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-fg/[0.04] px-4 py-2 text-sm text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg"
            >
              Browse the catalog
            </Link>
          </div>
        }
      />
      <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-fg-faint">
        <WifiOff className="h-3 w-3" />
        On a flaky network? Refresh in a moment — TMDb-backed pages auto-retry.
      </p>
    </div>
  );
}
