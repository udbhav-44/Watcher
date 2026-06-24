# Streaming / Embed Provider Research (2026)

Research-only notes for expanding CampusStream's multi-source "server" switcher.
**No application code was changed to produce this document.** Sources cited inline.

> Legal note up front: every provider below is an unlicensed piracy-adjacent
> embed/aggregator. Treat them as best-effort, expect domain churn, and keep a
> health-check + fallback chain. See "Legal / abuse caveats" at the bottom.

---

## How our current integration is shaped (what a new provider must satisfy)

- **Movies/TV** are TMDB-keyed. `embedProviders[]` entries implement
  `movieUrl(tmdbId)` and `tvUrl(tmdbId, season, episode)` and an `adQuality`
  tag (`src/lib/streaming/providers.ts`). `resolveProviders.ts` resolves any
  identifier → TMDB id, then maps every provider over it. **Adding a TMDB-keyed
  movie/TV provider = one array entry + one host in `providerHosts.ts` + extend
  the `EmbedProviderId` union.**
- **Host allowlist** (`providerHosts.ts`) currently: `playimdb.domains`,
  `vidking.net`, `megaplay.buzz`. Any new iframe host must be added here.
- **Anime** is separate. `megaplay.ts` builds candidates from a catalog
  `episode_embed_id` (`/stream/s-2/{id}/{sub|dub}`), MAL id
  (`/stream/mal/{mal}/{ep}/{lang}`), or AniList id
  (`/stream/ani/{ani}/{ep}/{lang}`), then **server-side probes** each URL for an
  error page and returns working ones first. `vidkingAnime.ts` maps anime →
  TMDB-TV id and reuses the Vidking TV embed as a fallback.
- **Sub/dub today** = URL path toggle (`/sub` vs `/dub`), not in-player audio
  tracks. This is the existing "audio switching" mechanism for anime.
- **PLAYER_EVENT**: Vidking posts `{type:"PLAYER_EVENT", data:{event,
  currentTime, duration, progress, id, mediaType, season, episode}}` to the
  parent window (`timeupdate|play|pause|ended|seeked`). Our progress tracking
  relies on this. Most "vid*" providers emit a compatible shape (see notes).

**Key compatibility gotcha:** some aggregators sit behind Cloudflare and return
`403` to *server-side* fetches but render fine in a real browser iframe
("cf-challenge"). Those break our MegaPlay-style server-side probe pattern —
they must be treated as **direct-iframe-only** (no `probe*` step).

---

## Tier A — drop-in TMDB-keyed movie/TV providers (the "vid*" family)

These match our `EmbedProvider` interface almost exactly and emit
Vidking-compatible `PLAYER_EVENT` postMessages.

### VidFast  ⭐ top movie/TV pick
- Base/embed: `https://vidfast.pro/movie/{id}` · `https://vidfast.pro/tv/{id}/{season}/{episode}`
- Domains (resilience): `vidfast.pro, .pm, .in, .io, .me, .net, .xyz`
- IDs: **TMDB or IMDb** (no anime endpoint documented)
- Key/free: no key, free.
- Notable params: `server=` (pick upstream server), `hideServer`, `nextButton`,
  `autoNext`, `sub=en|es|...` (default subtitle), `fullscreenButton`, `chromecast`.
- Audio: subtitle default only; server switch sometimes changes language source.
- Events: PLAYER_EVENT postMessage (compatible).
- Iframe/CORS: designed for iframe embed.
- Reliability: listed in `core` (verified-alive) tier of `tmdb-embed-providers`.
- Source: https://vidfast.pm/ , https://github.com/Astralchemist/tmdb-embed-providers

### Vidsrc.cc (v2)  ⭐ highest leverage (movie + TV + anime in one)
- Movie: `https://vidsrc.cc/v2/embed/movie/{id}`
- TV: `https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}`
- **Anime: `https://vidsrc.cc/v2/embed/anime/{id}/{episode}/{sub|dub}`**
- IDs: TMDB (`tmdb` prefix), IMDb (`tt`), **AniList (`ani` prefix), MAL** — i.e.
  it can consume the MAL/AniList ids our anime catalog already carries.
- Key/free: no key, free. `v2`/`v3` player versions.
- Params: `autoPlay`, `autoSkipIntro`, `color`, external subs
  (`?sub.file=`/`?sub.info=` with `Access-Control-Allow-Origin:*`).
- Audio: anime sub/dub via path; subtitle injection for movie/TV.
- Events: PLAYER_EVENT (`play|pause|time|complete`, fields `tmdbId, currentTime,
  duration, mediaType, season, episode`) — slightly different event names than
  Vidking (`time` not `timeupdate`, `complete` not `ended`) → needs a tiny
  per-provider event-name map.
- Reliability: `core` tier; but vidsrc-branded domains are under active legal
  injunctions (see caveats) → keep alternates.
- Source: https://vidsrc.cc/

### VidLink
- Movie: `https://vidlink.pro/movie/{tmdbId}`
- TV: `https://vidlink.pro/tv/{tmdbId}/{season}/{episode}`
- **Anime: `https://vidlink.pro/anime/{MALid}/{number}/{sub|dub}` (+`?fallback=true`)**
- IDs: TMDB for movie/TV, **MAL for anime**.
- Key/free: no key, free.
- Params: `sub_file` (external VTT), `sub_label`, `fallback_url`, color, player type.
- Audio: anime sub/dub via path, `?fallback=true` auto-swaps if requested track missing.
- Events: PLAYER_EVENT (`play|pause|seeked|ended|timeupdate`, field `mtmdbId`).
- Reliability: `core` tier.
- Source: https://vidlink.pro/

### Also in this family (verified-alive, same interface)
- **VidRock** (`vidrock.net`/`.ru`) — strong for TV. PLAYER_EVENT.
- **Videasy** (`videasy.net`) — strongest *anime* embed of the family (resolves
  AniList ids); used as ⭐ anime pick in community projects.
- **VidCore** (`https://vidcore.org/embed/movie/{id}`, `/embed/tv/{id}/{s}/{e}`) —
  advertises **14 servers + Hindi audio support**, HLS ABR, player events,
  built-in CORS proxy. Good "multi-audio-ish" option for movie/TV.
- **VidSrc.to / vidsrc.net / vidsrc.pm** — the classic. `/embed/movie/{id}`,
  `/embed/tv/{id}/{s}/{e}`, IMDb (`tt`) or TMDB. Heaviest domain churn; current
  active domains rotate (`.su`/`.ru` after Oct-2025 injunction). Use as backup,
  not primary.
- Sources: https://github.com/OgBek/watchers-heaven (12-provider ordering),
  https://www.vidcore.org/ , https://vidsrc.to/

---

## Tier B — anime servers (alongside MegaPlay)

### SupaPlay  ⭐ near-zero-effort MegaPlay sibling
- `https://supaplay.fun/stream/s-2/{episode_embed_id}/{sub|dub}`
- **Identical URL shape to our existing MegaPlay catalog path** — reuses the same
  Anikoto/HiAnime `episode_embed_id` we already fetch. Can be added as a second
  candidate inside the MegaPlay-style builder with no new ID resolution.
- Key/free: no key, free. Sub/dub via path.
- Source: https://supaplay.fun/

### Vidsrc.cc anime / VidLink anime
- Already covered above. Both take **MAL/AniList directly** (which `megaplay.ts`
  already has as `malId`/`aniId`), so they slot in as extra sub/dub anime servers
  with no TMDB round-trip.

### NinjaStream
- `https://ninjasheild.stream/map/anime/{anilistId}/{ep}/{sub|dub}`
- `https://ninjasheild.stream/map/animemal/{malId}/{ep}/{sub|dub}`
- Also movie/TV via IMDb/TMDB. No key, free. Sub/dub via path.
- Source: https://ninjasheild.stream/doc

### VidNest  (multi-audio incl. Hindi)
- `https://vidnest.fun/anime/{anilistId}/{ep}/{sub|dub}` — and supports a
  **`hindi`** audio variant in the path (`/anime/{ani}/{ep}/hindi`), plus an
  `animepahe` source variant.
- AniList-keyed. No key, free.
- Source: https://vidnest.fun/

---

## Tier C — self-hostable aggregators (reliability / true audio tracks)

These return **JSON / HLS**, not an iframe — so they need our own player +
HLS proxy. Bigger lift, but they fix the single-egress-IP rate-limit problem and
enable real in-player audio/quality track switching.

### Consumet API  ⭐ self-host pick
- Self-host: `docker run -p 3000:3000 riimuru/consumet-api` (or `@consumet/extensions` lib).
- Anime providers incl. **HiAnime/Zoro** with sub **and dub** (`/anime/zoro/watch/:id?dub=true`),
  AnimePahe, AnimeKai, GogoAnime, etc. Movies/TV providers too.
- IDs: provider slugs (resolve via AniList/MAL/title), **not TMDB-native**.
- Output: JSON with `.m3u8` HLS sources → real multi-quality/audio handling in a
  custom player. CORS/referer handled by you.
- Reliability: community scrapers fluctuate, but **self-hosting removes shared-IP
  rate limits** and dead public instances. Best long-term durability.
- Sources: https://docs.consumet.org/list-of-providers ,
  https://hub.docker.com/r/riimuru/consumet-api ,
  https://deepwiki.com/consumet/api.consumet.org/3-anime-providers

### Vyla API
- Node SSE API (Hugging Face Spaces). Fans out to many providers in parallel,
  verifies streams live, returns **CORS-safe proxied HLS** + multi-language
  subtitles via SSE (`/movie?id=`, `/tv?id=&season=&episode=`). TMDB-keyed.
  Self-hostable. Not iframe.
- Source: https://vyla.mintlify.app/introduction

### ezvidapi / Embed-API / apiplayer (hosted multi-failover, iframe)
- **ezvidapi**: `https://ezvidapi.com/embed/{movie|tv}/{tmdb}[/{s}/{e}]?provider=` —
  no key, 4-provider auto-failover, also JSON HLS endpoint, anime via TMDB.
- **apiplayer.ru**: `/embed/movie/{id}`, `/embed/tv/{id}/{s}/{e}`, IMDb+TMDB,
  multi-source failover, no key.
- **embed-api.stream**: `https://player.embed-api.stream/?id={tmdb}&s=&e=`,
  aggregates 10+ sources.
- Sources: https://ezvidapi.com/ , https://apiplayer.ru/ , https://embed-api.stream/

---

## Multi-audio reality check

- **True multiple audio tracks inside one stream** → only via self-hosted raw
  HLS (Consumet / Vyla) where you own the player and can expose track selection.
- **Practical "audio" switching for iframe providers**:
  - Anime: `sub` vs `dub` path toggle (MegaPlay, SupaPlay, VidLink, Vidsrc.cc,
    NinjaStream, VidNest). This is what we already do for MegaPlay.
  - Hindi/regional dubs: **VidNest** (`/hindi` anime path) and **VidCore**
    (Hindi audio + 14 servers, movie/TV).
  - Per-server selection: VidFast `server=` param.

---

## Prioritized recommendation

**Add as movie/TV servers (drop-in to `embedProviders[]`):**
1. **VidFast** — most robust drop-in; multi-domain, server selector, low ads.
2. **Vidsrc.cc (v2)** — one provider that *also* covers anime via MAL/AniList;
   highest coverage-per-integration. Needs a 3-line event-name map.
3. **VidLink** — solid third source; anime via MAL with `fallback`.
   *(Keep VidCore in reserve if Hindi audio for movie/TV becomes a priority.)*

**Add as anime servers (alongside MegaPlay):**
4. **SupaPlay** — drop straight into the MegaPlay candidate builder (same
   `s-2/{episode_embed_id}/{lang}` shape) for an instant 2nd anime server.
   Then **Vidsrc.cc anime** and **VidLink anime** (both MAL/AniList-keyed, which
   we already have) as additional sub/dub options. **VidNest** if you want a
   Hindi-dub track.

**Reliability / single-egress-IP concern:**
- Self-host **Consumet** (Docker) as the durable phase-2 backend — gives real
  sub/dub (`?dub=true`) and HLS, immune to shared-IP rate limits and public
  instance death. Costs a custom player + HLS proxy, so do it only if the iframe
  providers keep dropping.

**Integration notes:**
- Whitelist new hosts in `providerHosts.ts`; extend the `EmbedProviderId` union.
- Add a per-provider PLAYER_EVENT field/event-name normalizer (Vidking
  `timeupdate/ended` vs vidsrc.cc `time/complete`, field `id` vs `tmdbId`/`mtmdbId`).
- Do **not** server-side-probe Cloudflare-fronted providers (cf-challenge → 403);
  mark them direct-iframe-only and let the client server-switcher handle failures.
- For movie/TV, prefer providers that accept **IMDb** too (VidFast, VidLink-no,
  Vidsrc) so unmapped-TMDB titles still resolve.

---

## Legal / abuse caveats

- All providers serve **unlicensed** content. The vidsrc family in particular is
  under active global anti-piracy enforcement: a 2025 injunction forced a move to
  Russia-linked `.su`/`.ru` domains, and the IIPA 2026 Special 301 report plus
  Indian court orders list vidsrc domains for blocking. Expect frequent domain
  rotation and occasional total outages.
- Practical mitigations: multi-domain configs, a `probe`/health-check before
  promoting a server, graceful client-side fallback, and uBlock-style ad caveats
  already noted in `providers.ts`.
- Sources: https://torrentfreak.com/global-piracy-injunction-targets-vidsrc-domains-hydra-regenerates-in-russia-251029/ ,
  https://www.iipa.org/files/uploads/2026/01/IIPA-2026-Special-301-Comments-for-Publication-2.pdf
