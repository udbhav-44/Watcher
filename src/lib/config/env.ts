import "server-only";
import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

const envSchema = z.object({
  ENABLE_DATABASE: z.enum(["true", "false"]).default("false"),
  REQUIRE_REDIS_IN_PROD: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD: z.enum(["true", "false"]).default("false"),
  ADMIN_INTERNAL_KEY: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_PLAY_HOST: z.string().url().default("https://www.playimdb.com"),
  NEXT_PUBLIC_VIDKING_BASE: z.preprocess(emptyToUndefined, z.string().url().default("https://www.vidking.net")),
  TMDB_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  UPSTASH_REDIS_REST_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional())
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

if (process.env.NODE_ENV === "production") {
  if (!parsed.data.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is required in production.");
  }
  if (!parsed.data.ADMIN_INTERNAL_KEY) {
    throw new Error("ADMIN_INTERNAL_KEY is required in production.");
  }
  if (!parsed.data.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (
    parsed.data.REQUIRE_REDIS_IN_PROD === "true" &&
    (!parsed.data.UPSTASH_REDIS_REST_URL || !parsed.data.UPSTASH_REDIS_REST_TOKEN)
  ) {
    throw new Error("Upstash Redis credentials are required when REQUIRE_REDIS_IN_PROD=true.");
  }
}

export const env = parsed.data;
