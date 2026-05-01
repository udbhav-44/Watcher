-- Episode-level watch event tracking
ALTER TABLE "WatchEvent" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'movie';
ALTER TABLE "WatchEvent" ADD COLUMN "season" INTEGER;
ALTER TABLE "WatchEvent" ADD COLUMN "episode" INTEGER;
CREATE INDEX "WatchEvent_profileKey_titleId_idx" ON "WatchEvent"("profileKey", "titleId");

-- Per-profile preferences
CREATE TABLE "UserPreferences" (
  "profileKey" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'dark',
  "density" TEXT NOT NULL DEFAULT 'comfortable',
  "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
  "defaultProvider" TEXT NOT NULL DEFAULT 'vidking',
  "subtitleLanguage" TEXT NOT NULL DEFAULT 'en',
  "voiceSearch" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("profileKey")
);

-- Skip markers (per profile, per title/episode, with kind)
CREATE TABLE "SkipMarker" (
  "id" TEXT NOT NULL,
  "profileKey" TEXT NOT NULL,
  "titleId" TEXT NOT NULL,
  "season" INTEGER,
  "episode" INTEGER,
  "kind" TEXT NOT NULL DEFAULT 'intro',
  "endSeconds" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SkipMarker_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SkipMarker_profileKey_titleId_season_episode_kind_key"
  ON "SkipMarker"("profileKey", "titleId", "season", "episode", "kind");
CREATE INDEX "SkipMarker_profileKey_titleId_idx" ON "SkipMarker"("profileKey", "titleId");

-- Curated themed rails
CREATE TABLE "FeaturedTheme" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "coverUrl" TEXT,
  "accent" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "items" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeaturedTheme_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeaturedTheme_slug_key" ON "FeaturedTheme"("slug");
CREATE INDEX "FeaturedTheme_isActive_sortOrder_idx" ON "FeaturedTheme"("isActive", "sortOrder");
