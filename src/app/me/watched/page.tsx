import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProfileSwitcher } from "@/components/profile/profile-switcher";
import { WatchedGrid } from "@/components/profile/watched-grid";

export default function WatchedPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/me/collections"
          className="inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Your library
        </Link>
        <div className="mt-2 space-y-2">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            Your library
          </p>
          <h1 className="text-3xl font-semibold text-fg">Watched</h1>
          <p className="max-w-prose text-pretty text-sm text-fg-muted">
            Movies and series you have finished. Watched titles are hidden from
            Continue watching and recommendations.
          </p>
        </div>
      </div>
      <ProfileSwitcher />
      <WatchedGrid />
    </div>
  );
}
