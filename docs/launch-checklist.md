# Launch Checklist

## Security & Access

- Keep `NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD=false` for public builds unless explicitly needed.
- Store `ADMIN_INTERNAL_KEY` in deployment secrets and rotate before go-live.
- Verify admin routes require `X-Internal-Admin-Key` and return `401` otherwise.
- Confirm ingress/network policy only allows campus-network traffic.
- Verify `GET /api/system/readiness` returns `ok=true` before go-live.

## Accessibility Pass

- Verify keyboard-only navigation across `Home`, `Browse`, `Search`, `Title`, and `Watch`.
- Confirm visible focus rings and skip-link behavior.
- Validate contrast ratio on dark/glass backgrounds.
- Ensure reduced-motion preference gracefully limits transitions.

## Performance & Reliability

- Confirm API rate limiting in production environment.
- Capture Web Vitals and playback failure metrics.
- Validate provider-health and embed-proxy behavior for allowed redirect chains.
- Confirm watchlist/watch-events/reactions persist by `titleId` for active profile cookie.
- Confirm `npm run prisma:status` reports the production database schema is up to date.

## CI/CD Gates

- GitHub Actions CI passes: `lint`, `typecheck`, `build`, and Playwright smoke test.
- `npm run prisma:generate` succeeds in CI and deployment pipeline.
- Production deploys use `npm run prisma:migrate:deploy`, not `prisma migrate dev`.
- Deployment is blocked on failing quality checks.
- Release command on MacBook uses `npm run verify:release` before `npm run start:prod:checked`.

## Monitoring

- Set `SENTRY_DSN` and confirm startup initialization in `src/instrumentation.ts`.
- Create alerts for 5xx spikes on `/api/watchlist`, `/api/watch-events`, `/api/reactions`, and `/api/embed-proxy`.
- Run canary validation after deploy: search -> title -> watch -> profile watch history.
- Run `npm run healthcheck` on a schedule and alert on non-zero exit.

## Backups & Recovery

- Schedule daily `npm run db:backup` with retained snapshots.
- Test restore weekly using `DATABASE_URL=... npm run db:restore -- <backup-file>`.
- Keep rollback procedure documented alongside latest verified backup timestamp.

## Beta Rollout

- Week 1: 25 student testers from two departments.
- Week 2: 100 testers campus-wide with support channel.
- Collect NPS + playback QoE + search-to-play time.

## Full Launch

- Freeze schema changes 24h before launch.
- Deploy with rollback tag.
- Monitor errors + health endpoints every 15 minutes for first 24h.
