# Launch Checklist

## Accessibility Pass

- Verify keyboard-only navigation across `Home`, `Browse`, `Search`, `Title`, and `Watch`.
- Confirm visible focus rings and skip-link behavior.
- Validate contrast ratio on dark/glass backgrounds.
- Ensure reduced-motion preference gracefully limits transitions.

## Performance & Reliability

- Confirm API rate limiting in production environment.
- Capture Web Vitals and playback failure metrics.
- Validate fallback behavior when database is unavailable.

## Beta Rollout

- Week 1: 25 student testers from two departments.
- Week 2: 100 testers campus-wide with support channel.
- Collect NPS + playback QoE + search-to-play time.

## Full Launch

- Freeze schema changes 24h before launch.
- Deploy with rollback tag.
- Monitor errors + health endpoints every 15 minutes for first 24h.
