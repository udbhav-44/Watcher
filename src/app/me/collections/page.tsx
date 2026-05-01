import { CollectionsGrid } from "@/components/profile/collections-grid";
import { ProfileSwitcher } from "@/components/profile/profile-switcher";

export default function CollectionsIndexPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Collections</h1>
        <p className="text-sm text-white/62">
          Save titles into Watchlist or your own collections.
        </p>
      </div>
      <ProfileSwitcher />
      <CollectionsGrid />
    </div>
  );
}
