import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionItemsGrid } from "@/components/profile/collection-items-grid";
import { Card } from "@/components/ui/card";
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
      <Card>
        <p className="text-sm text-white/68">
          Collections are unavailable while the database is offline.
        </p>
      </Card>
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
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Link
            href="/me/collections"
            className="text-xs text-[#f2c46d] hover:underline"
          >
            ← All collections
          </Link>
          <h1 className="text-3xl font-semibold">{collection.name}</h1>
          <p className="text-sm text-white/62">
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
