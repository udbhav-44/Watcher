import { expect, test } from "@playwright/test";

test("search to play journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Futuristic Movie Nights, Now On Campus")).toBeVisible();

  await page.goto("/search?q=inception");
  await expect(page.getByText("Inception")).toBeVisible();

  await page.getByRole("link", { name: "Inception" }).first().click();
  await expect(page.getByRole("heading", { name: "Inception" })).toBeVisible();

  await page.getByRole("link", { name: "Play Now" }).click();
  await expect(page.getByRole("heading", { name: /Watching Inception/i })).toBeVisible();
});
