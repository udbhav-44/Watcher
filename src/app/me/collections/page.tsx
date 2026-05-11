import { CollectionsGrid } from "@/components/profile/collections-grid";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";

export default function CollectionsIndexPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.18em] text-accent uppercase">
          Your library
        </p>
        <h1 className="text-3xl font-semibold text-fg">Collections</h1>
        <p className="max-w-prose text-pretty text-sm text-fg-muted">
          Save titles to your Watchlist, or group them into your own collections
          to revisit later.
        </p>
      </div>
      <ProfileSwitcher />
      <CollectionsGrid />
    </div>
  );
}
