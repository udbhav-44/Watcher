# CampusStream

Premium campus-only streaming web app that maps IMDb title IDs to your internal playable host.

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
4. Start local server:
   - `npm run dev`

## Core Features

- Browse/search/title detail/watch flows
- IMDb URL/ID resolver API (`/api/resolve`)
- Device profile-based personalization hooks
- Watchlist, watch-events, and reactions APIs
- Admin ingest, moderation, and health endpoints
- PWA manifest and premium dark futuristic UI baseline

## Production Readiness Checklist

- Configure `DATABASE_URL` to real PostgreSQL.
- Wire campus intranet reverse proxy/domain restrictions.
- Enable Redis credentials for distributed rate limiting.
- Add Sentry DSN and verify error instrumentation.
- Run `npm run lint && npm run typecheck && npm run build`.
- Run `npm run test:e2e` on staging.
- Pilot rollout to campus beta users before full release.
