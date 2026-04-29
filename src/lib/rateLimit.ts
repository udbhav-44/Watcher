import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/config/env";

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
      prefix: "campus-stream"
    })
  : null;

export const checkRateLimit = async (identifier: string): Promise<{ success: boolean }> => {
  if (!ratelimit) return { success: true };
  const result = await ratelimit.limit(identifier);
  return { success: result.success };
};
