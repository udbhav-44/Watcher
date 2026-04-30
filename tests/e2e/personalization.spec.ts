import { expect, test } from "@playwright/test";

test("watchlist and profile isolation works for tmdb title IDs", async ({ request }) => {
  const suffix = Date.now();
  const profileA = `qa_a_${suffix}`;
  const profileB = `qa_b_${suffix}`;
  const titleId = "tmdb-1314481";

  const setA = await request.post("/api/profile", { data: { profileKey: profileA } });
  expect(setA.ok()).toBeTruthy();

  const addWatchlist = await request.post("/api/watchlist", { data: { titleId } });
  expect(addWatchlist.ok()).toBeTruthy();

  const listA = await request.get("/api/watchlist");
  expect(listA.ok()).toBeTruthy();
  const payloadA = (await listA.json()) as { watchlist?: Array<{ titleId: string }> };
  expect(payloadA.watchlist?.some((entry) => entry.titleId === titleId)).toBeTruthy();

  const setB = await request.post("/api/profile", { data: { profileKey: profileB } });
  expect(setB.ok()).toBeTruthy();

  const listB = await request.get("/api/watchlist");
  expect(listB.ok()).toBeTruthy();
  const payloadB = (await listB.json()) as { watchlist?: Array<{ titleId: string }> };
  expect(payloadB.watchlist?.some((entry) => entry.titleId === titleId)).toBeFalsy();
});

test("reactions and watch-events accept tt and tmdb IDs", async ({ request }) => {
  const profile = `qa_events_${Date.now()}`;
  const setProfile = await request.post("/api/profile", { data: { profileKey: profile } });
  expect(setProfile.ok()).toBeTruthy();

  const likeTmdb = await request.post("/api/reactions", {
    data: { titleId: "tmdb-1314481", type: "LIKE" }
  });
  expect(likeTmdb.ok()).toBeTruthy();

  const likeTt = await request.post("/api/reactions", {
    data: { titleId: "tt1375666", type: "WOW" }
  });
  expect(likeTt.ok()).toBeTruthy();

  const watchEvent = await request.post("/api/watch-events", {
    data: { titleId: "tmdb-1314481", secondsWatched: 120, progressPercent: 12, completed: false }
  });
  expect(watchEvent.ok()).toBeTruthy();
});
