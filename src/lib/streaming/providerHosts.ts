/**
 * Hosts we are willing to *server-side fetch* — health checks and the embed
 * proxy / link-hardening. Only providers that answer server-side GETs belong
 * here.
 */
const probeHostRules = ["playimdb.domains", "vidking.net"] as const;

/**
 * Direct-iframe-only providers. These sit behind Cloudflare and 403 our
 * server-side fetches (see docs/streaming-providers-research.md), so we never
 * probe or proxy them — they are offered purely as manual server choices and
 * loaded straight into the player iframe. They are allowlisted for embedding
 * (CSP frame-src) but deliberately kept out of `providerHostAllowlist` so the
 * readiness check doesn't mark them down for an expected 403.
 */
const directIframeHostRules = [
  "vidfast.pro",
  "vidfast.pm",
  "vidfast.in",
  "vidfast.io",
  "vidfast.me",
  "vidfast.net",
  "vidfast.xyz",
  "vidlink.pro",
  "vidsrc.cc"
] as const;

const allHostRules = [...probeHostRules, ...directIframeHostRules] as const;

const matchesHost = (
  hostname: string,
  rules: readonly string[]
): boolean => {
  const host = hostname.toLowerCase();
  return rules.some((rule) => host === rule || host.endsWith(`.${rule}`));
};

/** True for any provider host we embed or fetch (probe-able or direct-iframe). */
export const isAllowedProviderHost = (hostname: string): boolean =>
  matchesHost(hostname, allHostRules);

/** Hosts the readiness check and embed proxy/hardening operate over. */
export const providerHostAllowlist = probeHostRules;
