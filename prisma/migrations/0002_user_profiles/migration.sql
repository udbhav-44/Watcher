CREATE TABLE "UserProfile" (
  "key" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatarColor" TEXT DEFAULT '#5ee3ff',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("key")
);
