import { test, expect } from "@playwright/test";
import { clearOffloaderItems } from "./offload-helpers";
import { AUTH_FILE } from "./global-setup";

test.use({ storageState: AUTH_FILE });

test.beforeEach(async () => {
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
