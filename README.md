# CampusStream

Campus-only streaming web app that maps IMDb title IDs to internal playback providers.

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS + reusable UI primitives
- Prisma + PostgreSQL data model
- Motion interactions with Framer Motion
- Upstash-based API rate limiting (optional)
- Playwright end-to-end testing

## Quick Start

1. Copy `.env.example` to `.env.local`.
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run local migrations:
   - `npm run prisma:migrate`
5. Start local server:
   - `npm run dev`

## MacBook Production Runbook (Free Deployment)

1. Set required production variables in `.env.local`:
   - `DATABASE_URL`
   - `TMDB_API_KEY`
   - `ADMIN_INTERNAL_KEY`
2. Generate Prisma client and run migrations:
   - `npm run prisma:generate`
   - `npm run prisma:migrate:deploy`
3. Build:
   - `npm run build`
4. Run preflight + production server:
   - `npm run start:prod:checked`
5. Verify readiness:
   - `npm run healthcheck`
6. Keep process alive (free options):
   - PM2: `pm2 start "npm run start:prod:checked" --name campusstream`
   - launchd/system service: run `npm run start:prod:checked` as managed service with auto-restart

## Core Features

- Live TMDB-backed browse/search/discovery flows
- Filtered discovery (genre, year range, sort)
- IMDb URL/ID resolver API (`/api/resolve`)
- Profile-backed personalization via cookie session + profiles API
- Watchlist, continue-watching, watch-events, and reactions APIs
- Provider toggle playback for PlayIMDb and Vidking
- Player upgrades: resume tracking, subtitle URL input, speed control
- Internal-only admin ingest, moderation, and health endpoints (header-gated)
- PWA manifest and dark interface baseline

## Production Environment Contract

Required in production:

- `TMDB_API_KEY`
- `ADMIN_INTERNAL_KEY`
- `DATABASE_URL` (required for production persistence)

Recommended:

- `ENABLE_DATABASE=true` (or omit; DB auto-enables when `DATABASE_URL` exists)
- `PREFLIGHT_STRICT_EXTERNALS=false` to avoid blocking startup on transient external API/provider outages

Optional but recommended:

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`
- `REQUIRE_REDIS_IN_PROD=true` to force Redis credentials at startup

## Admin API Access

Admin APIs are disabled unless `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=true`.
When enabled, all admin API calls must include:

- Header: `X-Internal-Admin-Key: <ADMIN_INTERNAL_KEY>`

## Readiness and Health

- Runtime readiness endpoint: `GET /api/system/readiness`
- Startup preflight: `npm run preflight:prod`
- DB migration status: `npm run prisma:status`
- Local health probe: `npm run healthcheck`
- Backup/restore:
  - `npm run db:backup`
  - `DATABASE_URL=... npm run db:restore -- ./backups/<file>.sql`

## Production Readiness Checklist

- Configure `DATABASE_URL` and verify DB readiness is `ok=true`.
- Wire campus intranet reverse proxy/domain restrictions.
- Enable Redis credentials for distributed rate limiting.
- Add Sentry DSN and verify error instrumentation.
- Confirm security headers and CSP behavior for embedded providers.
- Run `npm run verify:release`.
- Run `npm run test:e2e` on staging.
- Pilot rollout to campus beta users before full release.
