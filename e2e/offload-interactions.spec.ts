import { test, expect, type Page } from "@playwright/test";
import { clearOffloaderItems } from "./offload-helpers";
import { AUTH_FILE } from "./global-setup";

test.use({ storageState: AUTH_FILE });

test.beforeEach(async () => {
  await clearOffloaderItems();
});

// Item content renders inside an InlineEdit <input> (its value), not as a
// plain text node, so assertions below use toHaveValue()/li count, not
// getByText — a text-node locator never matches an <input>'s value.

/** Every mutation here fires immediately, unawaited, from a synchronous UI
 * event handler (no debounce, per this feature's persistence design) — the
 * actual fetch to the server fn can dispatch a tick after the triggering
 * action returns. `networkidle` can resolve in that gap before the fetch
 * has even started, so a reload right after can abort it mid-flight. Start
 * listening for the response before triggering the action to close that
 * race, rather than relying on the networkidle heuristic. */
function waitForServerFnResponse(page: Page) {
  return page.waitForResponse(
    (res) => res.request().method() === "POST" && res.url().includes("/_serverFn/"),
  );
}

test("capture creates a new root item and persists across reload", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Call the dentist");
  const created = waitForServerFnResponse(page);
  await page.getByRole("button", { name: "Add" }).click();
  await created;
  await expect(page.locator("li input")).toHaveValue("Call the dentist");

  await page.reload();
  await expect(page.locator("li input")).toHaveValue("Call the dentist");
});

test("inline edit persists across reload", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Draft newsletter");
  const created = waitForServerFnResponse(page);
  await page.getByRole("button", { name: "Add" }).click();
  await created;
  const input = page.locator("li input");
  await expect(input).toHaveValue("Draft newsletter");

  const edited = waitForServerFnResponse(page);
  await input.fill("Draft and send newsletter");
  await edited;
  await expect(input).toHaveValue("Draft and send newsletter");

  await page.reload();
  await expect(page.locator("li input")).toHaveValue("Draft and send newsletter");
});

test("deletes a leaf item", async ({ page }) => {
  await page.goto("/offload");
  await page.getByLabel("Capture a new item").fill("Throwaway task");
  const created = waitForServerFnResponse(page);
  await page.getByRole("button", { name: "Add" }).click();
  await created;
  await expect(page.locator("li input")).toHaveValue("Throwaway task");

  const deleted = waitForServerFnResponse(page);
  await page.getByRole("button", { name: "Delete" }).click();
  await deleted;
  await expect(page.locator("li")).toHaveCount(0);

  await page.reload();
  await expect(page.locator("li")).toHaveCount(0);
});
