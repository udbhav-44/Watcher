CREATE TABLE "WatchedTitle" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "titleId" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL DEFAULT 'movie',
  "source" TEXT NOT NULL DEFAULT 'auto',
  "season" INTEGER,
  "episode" INTEGER,
  "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WatchedTitle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchedTitle_profileKey_titleId_key" ON "WatchedTitle"("profileKey", "titleId");
CREATE INDEX "WatchedTitle_profileKey_watchedAt_idx" ON "WatchedTitle"("profileKey", "watchedAt");
CREATE INDEX "WatchedTitle_titleId_idx" ON "WatchedTitle"("titleId");
