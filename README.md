# CampusStream

A campus-only streaming web app. Browse movies and TV shows backed by [TMDB](https://www.themoviedb.org/), then play them through configurable streaming providers (`PlayIMDb` or `Vidking`) inside an iframe player. Personal data (collections, ratings, watch history, search history) is persisted to PostgreSQL and partitioned by a cookie-based profile.

This README is the complete build-from-scratch guide. Follow it top-to-bottom and you will have a working dev environment, a real Postgres database, and (optionally) a production-ready local server.

## Table of contents

- [What's in the box](#whats-in-the-box)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Build from scratch (dev)](#build-from-scratch-dev)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Running the app](#running-the-app)
- [Project layout](#project-layout)
- [Routes](#routes)
- [API reference](#api-reference)
- [Production deployment](#production-deployment-self-hosted)
- [Admin tooling](#admin-tooling)
- [Operations and health](#operations-and-health)
- [Troubleshooting](#troubleshooting)
- [Development workflow](#development-workflow)
- [License](#license)

---

## What's in the box

- TMDB-backed catalog: trending, popular, top-rated, now-playing, on-the-air, search, discover.
- Movies and TV shows with separate detail and watch routes.
- TV second-pass features: episode-level watch tracking, auto-advance overlay, "Up next" rail, air calendar, series completion badge.
- Multi-collections (with a default `Watchlist` collection auto-created per profile).
- 5-star ratings + Like/Fire/Wow emoji reactions.
- "Because you rated X" personalized rail driven by your highest rating.
- Search autocomplete (TMDB multi-search), recent searches, "Surprise me" button, hero rotation on the home page.
- Player toggle between PlayIMDb and Vidking with provider health checks; auto fallback when one provider is unreachable.
- Persistent mini-player that follows you across the site while playback is active.
- Picture-in-picture, persistent volume, resume toast, and skip-intro markers for direct media playback.
- Profile system via cookie (no auth provider yet, designed for campus-only deployments).
- Admin endpoints for ingest/moderation/health, gated by both an env flag and an internal header secret.
- Strict DB-only behavior for personalization (no silent fallbacks), with an explicit production preflight that blocks startup if the contract is incomplete.

## Tech stack

- [Next.js 14 (App Router)](https://nextjs.org/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/) (via `@tailwindcss/postcss`)
- [Prisma 6](https://www.prisma.io/) + PostgreSQL
- [TMDB API](https://developer.themoviedb.org/) for catalog data
- [Framer Motion](https://www.framer.com/motion/) for transitions
- [hls.js](https://github.com/video-dev/hls.js/) for HLS playback
- [Zod](https://zod.dev/) for runtime schema validation
- Optional: [Upstash Redis](https://upstash.com/) for rate limiting, [Sentry](https://sentry.io/) for error monitoring
- [Playwright](https://playwright.dev/) for end-to-end testing

## Prerequisites

| Tool | Minimum | Notes |
| --- | --- | --- |
| Node.js | `>=20.17` (recommended `22.x`) | The app builds on `20.15`, but `npm 11.x` warns. Use `nvm install 20` or newer. |
| npm | `>=10.x` | Comes bundled with Node. |
| PostgreSQL | `>=14` | Local, Docker, or any managed Postgres. |
| TMDB v3 API key | required | Free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). |
| Git | any modern | For cloning. |

Optional:

- Docker / Docker Desktop (if you prefer Postgres in a container).
- `pm2` or `launchd` for keeping a self-hosted production server alive.

## Build from scratch (dev)

```bash
# 1) Clone
git clone <this-repo-url> campusstream
cd campusstream

# 2) Install dependencies
npm install

# 3) Configure environment (see "Environment variables" below)
cp .env.example .env.local
# then edit .env.local

# 4) Generate the Prisma client
npm run prisma:generate

# 5) Apply database migrations (creates all tables)
npm run prisma:migrate

# 6) Run the dev server
npm run dev
# -> http://localhost:3000
```

That's it for development. Open the app, hit the navbar links (Home, Movies, TV, New, Calendar, Search, Collections), and click any movie or show to land on the detail/watch flow.

## Environment variables

All variables live in `.env.local` (gitignored). Start by copying `.env.example`. The schema is enforced by [`src/lib/config/env.ts`](src/lib/config/env.ts) — the app refuses to start if required values are missing in production.

### Required (always)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. e.g. `postgresql://user:pass@localhost:5432/streaming_app`. |
| `TMDB_API_KEY` | TMDB v3 API key. The catalog will be empty without it. |

### Required in production only

| Variable | Purpose |
| --- | --- |
| `ADMIN_INTERNAL_KEY` | 16+ char secret used to gate `/api/admin/*`. Required even if admin UI is disabled, so you can curl admin endpoints. |

### Optional / feature flags

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENABLE_DATABASE` | `true` | Set to `false` to force read-only TMDB-only behavior (personalization will return 503). |
| `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD` | `false` | Show the `/admin/dashboard` UI in the navbar and unlock admin APIs. |
| `NEXT_PUBLIC_PLAY_HOST` | `https://www.playimdb.com` | PlayIMDb base URL. |
| `NEXT_PUBLIC_VIDKING_BASE` | `https://www.vidking.net` | Vidking embed base URL. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | empty | Enable distributed rate limiting if present. |
| `REQUIRE_REDIS_IN_PROD` | `false` | If `true`, production preflight fails when Redis creds are missing. |
| `SENTRY_DSN` | empty | Enables Sentry error capture (server + edge runtimes). |
| `PREFLIGHT_STRICT_EXTERNALS` | `false` | If `true`, production preflight will fail on transient TMDB/provider outages. Default lets transient outages through. |

### Example `.env.local` for local dev

```env
ENABLE_DATABASE="true"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streaming_app"
TMDB_API_KEY="<your-tmdb-v3-key>"
ADMIN_INTERNAL_KEY="dev-admin-key-change-in-prod"
NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD="false"
NEXT_PUBLIC_PLAY_HOST="https://www.playimdb.com"
NEXT_PUBLIC_VIDKING_BASE="https://www.vidking.net"
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
SENTRY_DSN=""
```

## Database setup

You need a running Postgres reachable at `DATABASE_URL`. Pick one of:

### Option A: Docker (recommended)

```bash
docker run --name campusstream-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=streaming_app \
  -p 5432:5432 \
  -d postgres:16
```

Then in `.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streaming_app"
```

### Option B: Native Postgres (Homebrew on macOS)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb streaming_app
```

Then use a URL with your local Unix user:

```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/streaming_app"
```

### Option C: Managed Postgres

Any provider (Neon, Supabase, RDS, Railway, etc.) works as long as you can paste the connection string into `DATABASE_URL`.

### Apply migrations

```bash
npm run prisma:generate     # regenerates @prisma/client types
npm run prisma:migrate      # runs prisma migrate dev (creates all tables)
```

To check status: `npm run prisma:status`. To deploy migrations against an existing prod DB: `npm run prisma:migrate:deploy`.

## Running the app

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:3000 with hot reload |
| `npm run build` | Production build |
| `npm run start` | Plain `next start` against the built output |
| `npm run start:prod` | Same as `start`, named for clarity |
| `npm run start:prod:checked` | Run `preflight:prod` (TMDB + DB health) then `start:prod` |
| `npm run preflight:prod` | One-shot env + connectivity check (used by `start:prod:checked` and CI) |
| `npm run healthcheck` | Hits `/api/system/readiness` against a running server |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify:release` | lint + typecheck + build, gate before deploy |
| `npm run test:e2e` | Playwright tests |
| `npm run prisma:generate` | Re-emit the Prisma client |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:migrate:deploy` | `prisma migrate deploy` (production) |
| `npm run prisma:status` | List applied + pending migrations |
| `npm run db:backup` | `pg_dump` to `./backups/<timestamp>.sql` |
| `npm run db:restore -- ./backups/<file>.sql` | Restore from a backup |

## Project layout

```
src/
  app/                       Next.js App Router pages and API routes
    page.tsx                 Home (hero rotation + personalized rails)
    browse/                  Movie discovery
    tv/                      TV index, detail, and watch (with episode picker)
    title/[ttid]/            Movie detail page
    watch/[ttid]/            Movie watch page
    search/                  Search with autocomplete and filters
    new/                     Now-playing + on-the-air
    calendar/                Air calendar for series in your profile
    genre/[slug]/            Genre landing pages
    me/                      Profile-scoped pages (collections, watchlist redirect)
    admin/                   Admin dashboard (env-gated)
    api/                     All API routes (see below)
  components/                Reusable UI (movies, player, profile, layout, ui)
  lib/
    catalog/                 Title id helpers, media type detection
    config/                  Server- and client-side env validation
    data/                    TMDB layer + movie/tv data accessors
    imdb/                    Title id parsing + provider URL builders
    personalization/         Collections, recommendations, calendar, series progress
    player/                  Cross-route player store
    profile/                 Cookie session helpers
    security/                Admin auth header validation
    streaming/               Provider host allowlist
    telemetry/               Sentry hooks
  types/                     Ambient TypeScript declarations
prisma/
  schema.prisma              Database schema
  migrations/                Versioned migration history
scripts/
  preflight-prod.mjs         Production preflight check
  healthcheck.mjs            Hits /api/system/readiness
  db-backup.sh, db-restore.sh
  with-env.mjs               Loads .env.local before invoking child commands
docs/                        Launch checklist, ops notes
```

## Routes

| Path | Notes |
| --- | --- |
| `/` | Home: hero rotation, personalized rails, recent rails |
| `/browse` | Movies index with filters and quick-genre chips |
| `/tv` | TV index with filters |
| `/tv/[id]` | TV show detail (id is `tmdb-tv-<n>`) |
| `/tv/[id]/watch` | TV episode watch page (`?s=&e=`) |
| `/title/[ttid]` | Movie detail (id is `tt<n>` or `tmdb-<n>`) |
| `/watch/[ttid]` | Movie watch page |
| `/search` | Search page with autocomplete and type tabs |
| `/new` | Now playing + on the air |
| `/calendar` | Upcoming TV episodes for your profile |
| `/genre/[slug]` | Genre landing page (combines movies + tv) |
| `/me/collections` | Your collections (default Watchlist + custom) |
| `/me/collections/[slug]` | Items in a specific collection |
| `/me/watchlist` | Redirects to `/me/collections/watchlist` |
| `/admin/dashboard` | Admin tiles (env-gated) |

## API reference

All API routes live under `src/app/api/`. The personalization endpoints expect a `campus_profile` cookie set by `POST /api/profile`; the default profile is `guest`. Requests without a valid cookie still work but write to the `guest` profile.

### Catalog and discovery

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/movies` | Catalog list (TMDB-backed). Accepts `?q=` and discovery filters. |
| `GET` | `/api/movies/[titleId]` | Resolve a movie or TV title by id (`tt*`, `tmdb-*`, `tmdb-tv-*`). |
| `GET` | `/api/search/autocomplete?q=` | TMDB multi-search results for autocomplete. |
| `GET` | `/api/surprise-me?scope=movie\|tv` | Random highly-rated unwatched title. |
| `GET` | `/api/resolve?imdbUrlOrId=&provider=` | Convert an IMDb URL/id to a playable provider URL. |
| `GET` | `/api/provider-health?target=` | Check that an external provider URL is reachable. |
| `GET` | `/api/embed-proxy?target=` | Server-side proxy for provider iframe pages (reduces blocked third-party requests). |

### Profiles

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`/`POST` | `/api/profile` | Read/set the active `campus_profile` cookie. |
| `GET`/`POST` | `/api/profiles` | List existing profiles or create a new one. |

### Personalization (DB-backed, profile-scoped)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`/`POST`/`DELETE` | `/api/watchlist` | Default-collection wrapper for backward compat. |
| `GET`/`POST` | `/api/collections` | List or create collections. |
| `GET`/`DELETE` | `/api/collections/[slug]` | Read or delete a collection (default cannot be deleted). |
| `POST`/`DELETE` | `/api/collections/[slug]/items` | Add/remove a title from a collection. |
| `GET` | `/api/collections/membership?titleId=` | Which slugs include this title. |
| `GET`/`POST`/`DELETE` | `/api/ratings` | 5-star rating per profile/title. |
| `GET`/`POST` | `/api/reactions` | Like/Fire/Wow reactions. |
| `GET`/`POST` | `/api/watch-events` | Episode-aware watch progress events. |
| `GET` | `/api/series-progress?titleId=` | Watched / total episode counts and percent. |
| `GET` | `/api/up-next` | "Up next" entries for in-progress + saved series. |
| `GET` | `/api/recommendations` | "Because you rated X" suggestions. |
| `GET`/`POST`/`DELETE` | `/api/search-history` | Per-profile recent search list. |
| `GET`/`POST`/`DELETE` | `/api/skip-markers` | Skip-intro markers per episode. |

### Admin (gated by `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=true` and `X-Internal-Admin-Key`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/health` | Admin-only DB health summary. |
| `POST` | `/api/admin/ingest` | Upsert a Movie row. |
| `POST` | `/api/admin/moderation` | Toggle `isActive` on a Movie row. |

### System

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/system/readiness` | Combined DB + TMDB + provider readiness probe. Used by `npm run healthcheck`. |

## Production deployment (self-hosted)

The app is platform-agnostic but designed to run well on a single machine (laptop, mini-PC, or VPS) behind a reverse proxy. Below is the path used in practice.

### One-time setup

1. Set every variable from the production list in `.env.local` on the host.
2. Apply migrations: `npm run prisma:migrate:deploy`.
3. Run `npm run verify:release` once to confirm a clean build.

### Start in production mode

```bash
npm run start:prod:checked
```

This runs the [`scripts/preflight-prod.mjs`](scripts/preflight-prod.mjs) check (env contract, TMDB reachability, DB health) and then `next start`. If preflight fails, the server does not start.

### Keep it alive (PM2 example)

```bash
npm install -g pm2
pm2 start "npm run start:prod:checked" --name campusstream
pm2 save
pm2 startup           # follow the printed instructions to install a boot script
```

Logs: `pm2 logs campusstream`. Restart: `pm2 restart campusstream`.

### Reverse proxy (Caddy example)

```Caddyfile
campus.example.com {
  reverse_proxy localhost:3000
}
```

Caddy handles HTTPS automatically. Restrict to your campus network at the firewall, VPN, or proxy layer; the app itself trusts whatever clients can reach it.

### Backups

```bash
# nightly cron
DATABASE_URL=... npm run db:backup

# point-in-time restore
DATABASE_URL=... npm run db:restore -- ./backups/<file>.sql
```

## Admin tooling

Admin is intentionally separate from the user experience.

1. Set `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=true` and `ADMIN_INTERNAL_KEY=<long-secret>`.
2. Restart the server.
3. Visit `/admin/dashboard` (now in the navbar).
4. To call admin APIs from outside, include the header `X-Internal-Admin-Key: <secret>`. Example:

```bash
curl -X POST https://campus.example.com/api/admin/ingest \
  -H "Content-Type: application/json" \
  -H "X-Internal-Admin-Key: $ADMIN_INTERNAL_KEY" \
  -d '{"titleId":"tt1375666","title":"Inception","playableUrl":"https://www.playimdb.com/title/tt1375666/"}'
```

Without both the env flag and the header, every admin endpoint returns `403`.

## Operations and health

- `GET /api/system/readiness` returns DB + TMDB + provider status. Probe this from your monitor or `npm run healthcheck`.
- Sentry: set `SENTRY_DSN` to capture server and edge runtime errors. See [`src/instrumentation.ts`](src/instrumentation.ts).
- Rate limiting: [`src/lib/rateLimit.ts`](src/lib/rateLimit.ts) uses Upstash if creds are present, otherwise it is a no-op.

## Troubleshooting

**Dev server returns 404 for everything.**
Stop and fully restart `npm run dev`. Often the `.next` cache references a deleted module after refactors. Worst case: `rm -rf .next && npm run dev`.

**`Cannot find module './<n>.js'` errors in dev.**
Same root cause. Kill the dev server, `rm -rf .next`, restart.

**Personalization endpoints return `503`.**
Either `DATABASE_URL` is missing or `ENABLE_DATABASE=false` is set. Personalization is strict DB-only by design.

**TMDB rails are empty.**
Confirm `TMDB_API_KEY` is correct. Try `curl "https://api.themoviedb.org/3/configuration?api_key=$TMDB_API_KEY"`. The TMDB layer is wrapped in retries, but a permanently bad key returns nothing.

**Vidking embed shows nothing for some titles.**
Vidking only supports IMDb-to-TMDB resolvable titles. Check the response of `GET /api/provider-health?target=<vidking-url>`. Falling back to PlayIMDb is automatic.

**Migration `0005_episode_progress_themes_prefs` fails.**
Confirm Postgres user has `CREATE` permission on the schema and re-run `npm run prisma:migrate:deploy`.

## Development workflow

- Branch naming and commit messages: short, factual, no boilerplate.
- Always run `npm run verify:release` before opening a PR.
- New API routes go under `src/app/api/<feature>/route.ts` and must validate input with `zod`.
- New schema changes: edit `prisma/schema.prisma`, then `npm run prisma:migrate -- --name <descriptive_name>`.
- Heavy server-only modules use `import "server-only"` to prevent leaking into client bundles.
- Use `import type { Route } from "next"` and cast dynamic strings to `Route` when typed routes complain.
- Personalization writes are strict DB-only. Don't add silent in-memory fallbacks.

## License

Internal/educational. Not for redistribution. The TMDB API is governed by [TMDB's terms of use](https://www.themoviedb.org/documentation/api/terms-of-use). Provider integrations are user-configurable and should comply with each provider's terms.
