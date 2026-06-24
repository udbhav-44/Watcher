// CampusStream — minimal service worker.
// Caches TMDB poster/backdrop images aggressively so rails feel instant on
// revisit. Does NOT intercept HTML or API requests — every nav goes through
// the gate fresh, every API call respects rate limits.

const IMAGE_CACHE = "campusstream-images-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (!request.url.includes("image.tmdb.org")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone()).catch(() => {
            /* quota exceeded — ignore */
          });
        }
        return response;
      } catch {
        return cached ?? Response.error();
      }
    })()
  );
});
