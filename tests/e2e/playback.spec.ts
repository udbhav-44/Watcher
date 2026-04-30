import { expect, test } from "@playwright/test";

test("search to play journey", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /CampusStream/ })).toBeVisible();

  await page.goto("/search?q=inception", { waitUntil: "domcontentloaded" });
  const inceptionResult = page
    .getByRole("link", { name: /^Inception\s+Inception\s+2010/ })
    .first();
  await expect(inceptionResult).toBeVisible();

  await inceptionResult.click();
  await expect(page.getByRole("heading", { name: "Inception" })).toBeVisible();

  await page.getByRole("link", { name: /^Play$/ }).click();
  await expect(page.getByRole("heading", { name: "Inception" })).toBeVisible();
  await expect(page.getByRole("button", { name: "PlayIMDb" })).toBeVisible();
});
