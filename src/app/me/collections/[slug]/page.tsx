import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CollectionItemsGrid } from "@/components/profile/collection-items-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { isDbEnabled, prisma } from "@/lib/db";
import { ensureDefaultCollection } from "@/lib/personalization/collections";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

type Props = {
  params: { slug: string };
};

export default async function CollectionDetailPage({
  params
}: Props): Promise<JSX.Element> {
  if (!isDbEnabled()) {
    return (
      <EmptyState
        title="Collections are offline"
        description="The database is currently unavailable. Try again in a moment."
      />
    );
  }

  const profileKey = getProfileKeyFromCookie();
  await ensureDefaultCollection(profileKey);

  const collection = await prisma.collection.findUnique({
    where: { profileKey_slug: { profileKey, slug: params.slug } },
    include: {
      items: { orderBy: { addedAt: "desc" } }
    }
  });

  if (!collection) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/me/collections"
          className="inline-flex items-center gap-1 text-xs text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All collections
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl font-semibold text-fg">{collection.name}</h1>
          <p className="text-sm text-fg-faint tabular-nums">
            {collection.items.length} title
            {collection.items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <CollectionItemsGrid
        slug={collection.slug}
        items={collection.items.map((item) => ({
          id: item.id,
          titleId: item.titleId,
          mediaType: item.mediaType,
          addedAt: item.addedAt.toISOString()
        }))}
      />
    </div>
  );
}
