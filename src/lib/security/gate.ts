import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/config/env";

export const GATE_COOKIE = "gate-token";
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const hashHex = (input: string): string =>
  createHash("sha256").update(input).digest("hex");

export const gateEnabled = (): boolean => Boolean(env.SITE_PASSWORD);

export const expectedGateToken = (): string => {
  if (!env.SITE_PASSWORD) return "";
  return hashHex(env.SITE_PASSWORD);
};

const safeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

export const verifyGatePassword = (password: string): boolean => {
  if (!env.SITE_PASSWORD) return true;
  return safeEqual(password, env.SITE_PASSWORD);
};

export const verifyGateCookie = (token: string | undefined | null): boolean => {
  if (!env.SITE_PASSWORD) return true;
  if (!token) return false;
  return safeEqual(token, expectedGateToken());
};
