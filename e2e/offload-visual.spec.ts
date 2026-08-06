import { test, expect } from "@playwright/test";
import { clearOffloaderItems } from "./offload-helpers";
import { AUTH_FILE } from "./global-setup";

test.use({ storageState: AUTH_FILE });

// Clear both before AND after each test (not just before): with retries
// enabled in CI, a failed attempt's leftover rows could otherwise still be
// there when a *different* test's attempt runs next, since Playwright
// doesn't guarantee retries happen immediately after the test they belong
// to — a beforeEach-only clear left a real cross-test leakage gap in CI.
test.beforeEach(async () => {
  await clearOffloaderItems();
});
test.afterEach(async () => {
  await clearOffloaderItems();
});

test("empty state", async ({ page }) => {
  await page.goto("/offload");
  await expect(page.getByText("Nothing offloaded yet")).toBeVisible();
  await expect(page.locator("main")).toHaveScreenshot("offload-empty-state.png");
});

test("single root item, no children", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Buy groceries");
  await page.getByRole("button", { name: "Add" }).click();
  // Item content renders inside an InlineEdit <input> (its value), not as a
  // plain text node, so this asserts on the input's value, not getByText.
  await expect(page.locator("li input")).toHaveValue("Buy groceries");
  await expect(page.locator("main")).toHaveScreenshot("offload-single-item.png");
});
