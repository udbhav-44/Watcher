import { NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { isDbEnabled, prisma } from "@/lib/db";
import {
  isAllowedProviderHost,
  providerHostAllowlist
} from "@/lib/streaming/providerHosts";

const checkTmdb = async (): Promise<{
  ok: boolean;
  status?: number;
  reason?: string;
}> => {
  if (!env.TMDB_API_KEY) return { ok: false, reason: "TMDB key missing" };

  const url = `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(env.TMDB_API_KEY)}`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        return { ok: true, status: response.status };
      }

      if (attempt === 3) {
        return {
          ok: false,
          status: response.status,
          reason: "TMDB non-2xx response"
        };
      }
    } catch {
      if (attempt === 3) {
        return { ok: false, reason: "TMDB unreachable" };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
  }

  return { ok: false, reason: "TMDB unreachable" };
};

const checkProviders = async (): Promise<
  Array<{ host: string; ok: boolean; reason?: string; status?: number }>
> => {
  const checks = providerHostAllowlist.map(async (host) => {
    const url = `https://${host}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(5000)
      });
      const finalHost = new URL(response.url).hostname.toLowerCase();
      if (!isAllowedProviderHost(finalHost)) {
        return {
          host,
          ok: false,
          reason: `Redirected to non-allowlisted host: ${finalHost}`
        };
      }
      return {
        host,
        ok: response.ok,
        status: response.status,
        reason: response.ok ? undefined : "Provider non-2xx response"
      };
    } catch {
      return { host, ok: false, reason: "Provider unreachable" };
    }
  });

  return Promise.all(checks);
};

const checkDatabase = async (): Promise<{
  enabled: boolean;
  ok: boolean;
  reason?: string;
}> => {
  if (!isDbEnabled()) {
    return {
      enabled: false,
      ok: false,
      reason: "Database disabled or URL missing"
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { enabled: true, ok: true };
  } catch {
    return { enabled: true, ok: false, reason: "Database query failed" };
  }
};

export async function GET(): Promise<Response> {
  const [db, tmdb, providers] = await Promise.all([
    checkDatabase(),
    checkTmdb(),
    checkProviders()
  ]);
  const providersOk = providers.every((entry) => entry.ok);
  const externalOk = tmdb.ok && providersOk;
  const ok = db.ok;

  return NextResponse.json(
    {
      ok,
      externalOk,
      timestamp: new Date().toISOString(),
      checks: {
        database: db,
        tmdb,
        providers
      }
    },
    { status: ok ? 200 : 503 }
  );
}
