-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'FIRE', 'WOW');

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "backdropUrl" TEXT,
    "posterUrl" TEXT,
    "releaseYear" INTEGER,
    "durationMinutes" INTEGER,
    "maturityRating" TEXT,
    "trailerUrl" TEXT,
    "playableUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieGenre" (
    "movieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    CONSTRAINT "MovieGenre_pkey" PRIMARY KEY ("movieId","genreId")
);

CREATE TABLE "CastMember" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "character" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CastMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WatchEvent" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "profileKey" TEXT NOT NULL,
    "secondsWatched" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "profileKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "profileKey" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeaturedRail" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeaturedRail_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeaturedRailMovie" (
    "featuredRailId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FeaturedRailMovie_pkey" PRIMARY KEY ("featuredRailId","movieId")
);

CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Movie_titleId_key" ON "Movie"("titleId");
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE UNIQUE INDEX "WatchlistItem_movieId_profileKey_key" ON "WatchlistItem"("movieId","profileKey");
CREATE UNIQUE INDEX "Reaction_movieId_profileKey_key" ON "Reaction"("movieId","profileKey");
CREATE UNIQUE INDEX "FeaturedRail_slug_key" ON "FeaturedRail"("slug");
CREATE INDEX "WatchEvent_profileKey_watchedAt_idx" ON "WatchEvent"("profileKey","watchedAt");
CREATE INDEX "AdminAudit_action_createdAt_idx" ON "AdminAudit"("action","createdAt");

ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieGenre" ADD CONSTRAINT "MovieGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CastMember" ADD CONSTRAINT "CastMember_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedRailMovie" ADD CONSTRAINT "FeaturedRailMovie_featuredRailId_fkey" FOREIGN KEY ("featuredRailId") REFERENCES "FeaturedRail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeaturedRailMovie" ADD CONSTRAINT "FeaturedRailMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
