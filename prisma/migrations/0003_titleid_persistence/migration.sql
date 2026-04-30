-- Drop FK constraints that bind watch data to movie primary keys.
ALTER TABLE "WatchEvent" DROP CONSTRAINT IF EXISTS "WatchEvent_movieId_fkey";
ALTER TABLE "WatchlistItem" DROP CONSTRAINT IF EXISTS "WatchlistItem_movieId_fkey";
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS "Reaction_movieId_fkey";

-- Rename movieId columns to titleId for persistence consistency.
ALTER TABLE "WatchEvent" RENAME COLUMN "movieId" TO "titleId";
ALTER TABLE "WatchlistItem" RENAME COLUMN "movieId" TO "titleId";
ALTER TABLE "Reaction" RENAME COLUMN "movieId" TO "titleId";

-- Rebuild unique/index constraints with titleId semantics.
DROP INDEX IF EXISTS "WatchlistItem_movieId_profileKey_key";
CREATE UNIQUE INDEX "WatchlistItem_titleId_profileKey_key" ON "WatchlistItem"("titleId", "profileKey");

DROP INDEX IF EXISTS "Reaction_movieId_profileKey_key";
CREATE UNIQUE INDEX "Reaction_titleId_profileKey_key" ON "Reaction"("titleId", "profileKey");

CREATE INDEX IF NOT EXISTS "WatchEvent_titleId_idx" ON "WatchEvent"("titleId");
