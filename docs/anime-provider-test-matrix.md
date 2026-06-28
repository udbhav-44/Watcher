# Anime provider live-test matrix (2026-06-28, updated)

Live-tested from dev network via HTTP fetch. **Only providers marked playable are wired.**
VidLink removed — passes HTML probe but streams fail or desync in browser.

| Provider | Method | Frieren (52991) | Slime S3 (154587 ep12) | One Piece (21) |
| --- | --- | --- | --- | --- |
| **Vidking** (TMDB TV) | `/embed/tv/{tmdb}/{s}/{e}` | playable | playable | playable |
| **VidFast** | `/tv/{tmdb}/{s}/{e}` | playable HTML | playable HTML | playable HTML |
| **VidRock** | `/embed/tv/{tmdb}/{s}/{e}` | playable HTML | playable HTML | — |
| **VidCore** | `/embed/tv/{tmdb}/{s}/{e}` | playable HTML | playable HTML | — |
| **Vidsrc.cc** | `/v2/embed/tv/{tmdb}/{s}/{e}` | timeout (CF) | timeout | timeout |
| **VidLink** (MAL) | removed | dead in browser | dead in browser | dead |
| **SupaPlay / MegaPlay** | removed | dead (404) | dead | dead |

## Anime playback architecture

All anime playback uses the **same TMDB resolver as the TV tab**:
1. MAL/Jikan catalog → resolve TMDB TV id (title search + MAL/AniList find)
2. Parse season from title (`Season 7` → season 7)
3. Build embed URLs via `resolveProviderUrlsFromIdentifier`
4. Server switcher (anime order): **VidFast** → VidRock → VidCore → Vidking → Vidsrc.cc

## Subtitles / audio

Subtitle timing is controlled **inside each provider's player** (gear menu).
We cannot adjust sync from outside cross-origin iframes.

## API health

| API | Result |
| --- | --- |
| **Jikan** | OK — cached server-side |
| **Anikoto** | OK — cached, secondary rail only |
