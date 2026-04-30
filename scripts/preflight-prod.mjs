import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

import { loadAppEnv } from "./load-app-env.mjs";

const fail = (message) => {
  // eslint-disable-next-line no-console
  console.error(`[preflight] ${message}`);
  process.exit(1);
};

const info = (message) => {
  // eslint-disable-next-line no-console
  console.info(`[preflight] ${message}`);
};

const warn = (message) => {
  // eslint-disable-next-line no-console
  console.warn(`[preflight] ${message}`);
};

const sanitize = (value) =>
  value.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "postgresql://<redacted>");

const checkTmdb = async ({ attempts = 1, timeoutMs = 5000 } = {}) => {
  const tmdbUrl = `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(process.env.TMDB_API_KEY ?? "")}`;
  const errors = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(tmdbUrl, {
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) {
        errors.push(`attempt ${attempt}: TMDB status ${response.status}`);
      } else {
        return { ok: true };
      }
    } catch (error) {
      errors.push(
        `attempt ${attempt}: fetch failed (${error instanceof Error ? error.message : String(error)})`
      );
    }

    // Fallback to curl for environments where Node fetch DNS/TLS intermittently fails.
    try {
      execFileSync(
        "curl",
        ["-sfL", "--max-time", String(Math.ceil(timeoutMs / 1000)), tmdbUrl],
        {
          stdio: "ignore"
        }
      );
      return { ok: true };
    } catch {
      errors.push(`attempt ${attempt}: curl failed`);
    }

    if (attempt < attempts) {
      await sleep(700 * attempt);
    }
  }

  return {
    ok: false,
    reason: `TMDB API is unreachable after ${attempts} attempts. ${errors.join(" | ")}`
  };
};

const checkDatabase = async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch {
    return { ok: false, reason: "Database connectivity check failed." };
  } finally {
    await prisma.$disconnect();
  }
};

const checkMigrations = () => {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";

  try {
    const output = execFileSync(npx, ["prisma", "migrate", "status"], {
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    if (output.includes("Database schema is up to date")) {
      return { ok: true };
    }

    return {
      ok: false,
      reason: "Prisma migrations are not confirmed as up to date."
    };
  } catch (error) {
    const stdout = error?.stdout ? sanitize(String(error.stdout)) : "";
    const stderr = error?.stderr ? sanitize(String(error.stderr)) : "";
    const details = [stdout, stderr].filter(Boolean).join("\n").trim();

    return {
      ok: false,
      reason: details
        ? `Prisma migration status failed: ${details}`
        : "Prisma migration status failed."
    };
  }
};

const run = async () => {
  loadAppEnv({ dev: false });

  const failures = [];
  const strictExternals = process.env.PREFLIGHT_STRICT_EXTERNALS === "true";
  const required = ["DATABASE_URL", "TMDB_API_KEY", "ADMIN_INTERNAL_KEY"];
  required.forEach((key) => {
    if (!process.env[key])
      failures.push(`Missing required production env: ${key}`);
  });

  if ((process.env.ADMIN_INTERNAL_KEY ?? "").length < 16) {
    failures.push("ADMIN_INTERNAL_KEY must be at least 16 characters.");
  }

  if (process.env.REQUIRE_REDIS_IN_PROD === "true") {
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      failures.push(
        "Redis credentials are required when REQUIRE_REDIS_IN_PROD=true."
      );
    }
  }

  if (failures.length) {
    fail(failures.join(" "));
  }

  const [database, tmdb] = await Promise.all([
    checkDatabase(),
    checkTmdb({
      attempts: strictExternals ? 4 : 1,
      timeoutMs: strictExternals ? 8000 : 5000
    })
  ]);

  if (!database.ok) {
    failures.push(database.reason);
  } else {
    info("Database connectivity passed.");
  }

  const migrations = database.ok
    ? checkMigrations()
    : {
        ok: false,
        reason: "Skipped migration status because database is unavailable."
      };
  if (!migrations.ok) {
    failures.push(migrations.reason);
  } else {
    info("Prisma migration status passed.");
  }

  if (!tmdb.ok) {
    const message = tmdb.reason ?? "TMDB API check failed.";
    if (strictExternals) {
      failures.push(message);
    } else {
      warn(
        `${message} Continuing because PREFLIGHT_STRICT_EXTERNALS is not true.`
      );
    }
  } else {
    info("TMDB API check passed.");
  }

  if (failures.length) {
    fail(failures.join(" "));
  }

  info("Production checks passed.");
};

await run();
