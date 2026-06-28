# Anime provider live-test matrix (2026-06-28)

Tested from CI/dev network via HTTP fetch + browser iframe verification.
Only providers marked **playable** are wired into the anime server switcher.

| Provider | Versatile Mage S7 (62719) | Above Myriads (61642) | Frieren (52991) | One Piece (21) |
| --- | --- | --- | --- | --- |
| **SupaPlay** (`s-2` / `mal`) | dead (404) | dead (404) | dead (404) | dead (404) |
| **Vidsrc.cc** (MAL) | timeout | timeout | timeout | timeout |
| **VidLink** (MAL) | dead (error page) | dead (error page) | dead (error page) | dead (500) |
| **Vidking** (TMDB TV) | playable (`70311/7/1`) | no TMDB match | playable (`209867/1/1`) | playable (`37854/1/1`) |

## API health

| API | Result |
| --- | --- |
| **Jikan** (`api.jikan.moe`) | OK (200) — cached server-side |
| **Anikoto** (`recent-anime`) | OK (200) — cached server-side, secondary rail only |

## Wired in app

- **Vidking** (TMDB resolver + live probe) — default when MAL-keyed providers fail probe
- **VidLink / Vidsrc.cc** — probed per episode; omitted when probe fails (currently all fail)
- **SupaPlay / MegaPlay** — not in codebase (confirmed dead)
