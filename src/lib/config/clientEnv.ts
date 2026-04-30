import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD: z.enum(["true", "false"]).default("false"),
  NEXT_PUBLIC_PLAY_HOST: z.string().url().default("https://www.playimdb.com"),
  NEXT_PUBLIC_VIDKING_BASE: z.string().url().default("https://www.vidking.net")
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD: process.env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD,
  NEXT_PUBLIC_PLAY_HOST: process.env.NEXT_PUBLIC_PLAY_HOST,
  NEXT_PUBLIC_VIDKING_BASE: process.env.NEXT_PUBLIC_VIDKING_BASE
});

if (!parsed.success) {
  throw new Error(`Invalid client environment configuration: ${parsed.error.message}`);
}

export const clientEnv = parsed.data;
