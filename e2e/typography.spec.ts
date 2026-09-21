import { test, expect } from "@playwright/test";

// The point of self-hosting the UI face (#83) is that the rendering stops
// being a property of the viewer's machine. That is exactly the kind of
// guarantee the visual snapshots cannot state: they only compare pixels
// against pixels taken on a machine that happened to resolve the same fonts,
// which is the coincidence #83 exists to remove. These assertions name the
// guarantee directly, so a regression reads as "the font stopped being served"
// rather than "two screenshots differ by 1% of pixels".
//
// `/login` is used throughout because it is the densest page reachable without
// a session, which keeps this file independent of the Supabase fixtures.

const FONT_PATH = "/fonts/inter-variable-latin.woff2";

test("serves the UI face from the app's own origin, not a font CDN", async ({ page, baseURL }) => {
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font") fontRequests.push(request.url());
  });

  await page.goto("/login");
  // The face is fetched by the preload, which the parser starts before the
  // stylesheet; waiting on document.fonts is what makes this deterministic
  // rather than dependent on when the listener above happened to fire.
  await page.evaluate(() => document.fonts.ready);

  expect(fontRequests).toEqual([new URL(FONT_PATH, baseURL).toString()]);

  const response = await page.request.get(FONT_PATH);
  expect(response.status()).toBe(200);
  // 48 KB today. Not an exact assertion — this is a budget, and it should fail
  // loudly if someone swaps in an unsubsetted family that is an order of
  // magnitude larger, since this ships on every cold load.
  expect((await response.body()).byteLength).toBeLessThan(100 * 1024);
});

test("preloads the primary face so first paint does not flash the fallback", async ({ page }) => {
  await page.goto("/login");

  const preload = page.locator(`link[rel="preload"][href="${FONT_PATH}"]`);
  await expect(preload).toHaveAttribute("as", "font");
  await expect(preload).toHaveAttribute("type", "font/woff2");
  // Font fetches are CORS-mode even same-origin. A preload issued in a
  // different mode is discarded and the face fetched a second time, which
  // silently undoes the whole point of preloading it.
  await expect(preload).toHaveAttribute("crossorigin", "anonymous");
});

test("renders in the self-hosted face, with a generic stack behind it", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => document.fonts.ready);

  const loadedInter = await page.evaluate(() =>
    [...document.fonts].some((face) => face.family === "Inter" && face.status === "loaded"),
  );
  expect(loadedInter).toBe(true);

  const fontFamily = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).fontFamily.toLowerCase());
  // Inter first, so it wins wherever it covers the glyph...
  expect(fontFamily.startsWith("inter")).toBe(true);
  // ...and a generic stack behind it, for the swap window and for anything
  // outside the latin subset.
  expect(fontFamily).toContain("sans-serif");
});

test("uses tabular figures so numeric columns keep their width", async ({ page }) => {
  await page.goto("/login");

  const featureSettings = await page
    .locator("body")
    .evaluate((el) => getComputedStyle(el).fontFeatureSettings);
  expect(featureSettings).toContain("tnum");
});
