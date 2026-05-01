import { isDbEnabled, prisma } from "@/lib/db";
import { mediaTypeFromTitleId } from "@/lib/catalog/titleId";

export const DEFAULT_COLLECTION_SLUG = "watchlist";
export const DEFAULT_COLLECTION_NAME = "Watchlist";

export const ensureDbEnabled = (): void => {
  if (!isDbEnabled()) {
    throw new Error("Database unavailable");
  }
};

export const slugifyCollectionName = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);
  return slug || `collection-${Date.now()}`;
};

export const ensureDefaultCollection = async (
  profileKey: string
): Promise<{ id: string; name: string; slug: string; isDefault: boolean }> => {
  ensureDbEnabled();
  const existing = await prisma.collection.findUnique({
    where: {
      profileKey_slug: {
        profileKey,
        slug: DEFAULT_COLLECTION_SLUG
      }
    }
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      slug: existing.slug,
      isDefault: existing.isDefault
    };
  }

  const created = await prisma.collection.create({
    data: {
      profileKey,
      slug: DEFAULT_COLLECTION_SLUG,
      name: DEFAULT_COLLECTION_NAME,
      isDefault: true
    }
  });

  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    isDefault: created.isDefault
  };
};

export const upsertCollectionItem = async (
  profileKey: string,
  collectionSlug: string,
  titleId: string
): Promise<{ collectionId: string; titleId: string; mediaType: string; addedAt: string }> => {
  ensureDbEnabled();

  const collection = await prisma.collection.findUnique({
    where: { profileKey_slug: { profileKey, slug: collectionSlug } }
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  const mediaType = mediaTypeFromTitleId(titleId);
  const item = await prisma.collectionItem.upsert({
    where: {
      collectionId_titleId: {
        collectionId: collection.id,
        titleId
      }
    },
    update: { mediaType },
    create: {
      collectionId: collection.id,
      titleId,
      mediaType
    }
  });

  return {
    collectionId: item.collectionId,
    titleId: item.titleId,
    mediaType: item.mediaType,
    addedAt: item.addedAt.toISOString()
  };
};

export const removeCollectionItem = async (
  profileKey: string,
  collectionSlug: string,
  titleId: string
): Promise<boolean> => {
  ensureDbEnabled();

  const collection = await prisma.collection.findUnique({
    where: { profileKey_slug: { profileKey, slug: collectionSlug } }
  });

  if (!collection) return false;

  const result = await prisma.collectionItem.deleteMany({
    where: { collectionId: collection.id, titleId }
  });

  return result.count > 0;
};
