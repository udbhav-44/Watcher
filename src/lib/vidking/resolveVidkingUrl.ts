/**
 * Back-compat shim: the legacy resolver returned only the Vidking URL.
 * The new multi-provider resolver lives in
 * `src/lib/streaming/resolveProviders.ts`. New code should call that one
 * directly. This shim is kept so `/api/resolve` and any external callers
 * relying on the old shape continue to work.
 */

import { resolveProviderUrlsFromIdentifier } from "@/lib/streaming/resolveProviders";

export const resolveVidkingUrlFromIdentifier = async (
  identifier: string,
  options: { season?: number; episode?: number } = {}
): Promise<string | null> => {
  const providers = await resolveProviderUrlsFromIdentifier(identifier, options);
  return providers.find((entry) => entry.id === "vidking")?.url ?? null;
};
