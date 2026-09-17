import { test, expect } from "@playwright/test";

test("landing page boots and renders", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/LifeOS/);
  await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
});
