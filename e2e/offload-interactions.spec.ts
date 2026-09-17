import { test, expect } from "@playwright/test";
import { clearOffloaderItems } from "./offload-helpers";
import { AUTH_FILE } from "./global-setup";

test.use({ storageState: AUTH_FILE });

test.beforeEach(async () => {
  await clearOffloaderItems();
});

test("capture creates a new root item and persists across reload", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Call the dentist");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Call the dentist")).toBeVisible();

  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByText("Call the dentist")).toBeVisible();
});

test("inline edit persists across reload", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Draft newsletter");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Draft newsletter")).toBeVisible();

  await page
    .locator("li", { hasText: "Draft newsletter" })
    .locator("input")
    .fill("Draft and send newsletter");
  await expect(page.getByText("Draft and send newsletter")).toBeVisible();

  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByText("Draft and send newsletter")).toBeVisible();
});

test("deletes a leaf item", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Throwaway task");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Throwaway task")).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Throwaway task")).not.toBeVisible();

  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByText("Throwaway task")).not.toBeVisible();
});
