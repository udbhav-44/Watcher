const baseUrl = process.env.HEALTHCHECK_BASE_URL ?? "http://localhost:3000";

try {
  const response = await fetch(`${baseUrl}/api/system/readiness`, {
    signal: AbortSignal.timeout(8000),
    cache: "no-store"
  });
  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    // eslint-disable-next-line no-console
    console.error("[healthcheck] Readiness failed", payload);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.info("[healthcheck] Readiness passed", payload.timestamp);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("[healthcheck] Unable to reach readiness endpoint", error);
  process.exit(1);
}
