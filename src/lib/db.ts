import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/config/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: []
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export const isDbEnabled = (): boolean => {
  if (!env.DATABASE_URL) return false;
  // Prevent accidental persistence disable when DATABASE_URL is configured.
  return process.env.ENABLE_DATABASE !== "false";
};
