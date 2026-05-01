-- Create Collection and CollectionItem tables for multi-watchlist support.
CREATE TABLE "Collection" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Collection_profileKey_slug_key" ON "Collection"("profileKey", "slug");
CREATE INDEX "Collection_profileKey_idx" ON "Collection"("profileKey");

CREATE TABLE "CollectionItem" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "titleId" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL DEFAULT 'movie',
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CollectionItem_collectionId_titleId_key" ON "CollectionItem"("collectionId", "titleId");
CREATE INDEX "CollectionItem_titleId_idx" ON "CollectionItem"("titleId");
ALTER TABLE "CollectionItem"
  ADD CONSTRAINT "CollectionItem_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5-star Rating table.
CREATE TABLE "Rating" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "titleId" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL DEFAULT 'movie',
  "score" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Rating_titleId_profileKey_key" ON "Rating"("titleId", "profileKey");
CREATE INDEX "Rating_profileKey_score_idx" ON "Rating"("profileKey", "score");
CREATE INDEX "Rating_titleId_idx" ON "Rating"("titleId");

-- Search history table for per-profile recent searches.
CREATE TABLE "SearchHistoryEntry" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchHistoryEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SearchHistoryEntry_profileKey_createdAt_idx" ON "SearchHistoryEntry"("profileKey", "createdAt");

-- Migrate existing watchlist rows into a default collection per profile.
INSERT INTO "Collection" ("id", "profileKey", "name", "slug", "isDefault", "createdAt", "updatedAt")
SELECT
  concat('cmig_wl_', md5(w."profileKey")),
  w."profileKey",
  'Watchlist',
  'watchlist',
  true,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT "profileKey" FROM "WatchlistItem"
) w;

INSERT INTO "CollectionItem" ("id", "collectionId", "titleId", "mediaType", "addedAt")
SELECT
  concat('cmig_ci_', md5(w."id")),
  concat('cmig_wl_', md5(w."profileKey")),
  w."titleId",
  CASE
    WHEN w."titleId" LIKE 'tmdb-tv-%' THEN 'tv'
    ELSE 'movie'
  END,
  w."createdAt"
FROM "WatchlistItem" w;

DROP TABLE "WatchlistItem";
