import { expect, test } from "@playwright/test";

test("provider health and embed proxy block untrusted hosts", async ({
  request
}) => {
  const providerBlocked = await request.get(
    "/api/provider-health?target=https://example.com"
  );
  expect(providerBlocked.status()).toBe(403);

  const proxyBlocked = await request.get(
    "/api/embed-proxy?target=https://example.com"
  );
  expect(proxyBlocked.status()).toBe(403);
});

test("watch page renders without blank screen", async ({ page }) => {
  await page.goto("/watch/tt1375666", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Inception/i })).toBeVisible();
  await expect(page.getByText("Server", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PlayIMDb" })).toBeVisible();
});
