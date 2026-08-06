import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// `playwright test` runs under Node, not Bun, so Bun's automatic .env
// loading (which only applies to processes Bun itself starts) never reaches
// it — `bun run test:e2e` spawns this as a separate node process via the
// `playwright` binary's shebang. Load .env by hand here, once, before
// anything else in this file runs; CI doesn't need this file (it sets real
// env vars directly), so existing env always wins over the file.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf-8").split("\n")) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^"(.*)"$/, "$1");
  }
}

// Visual-snapshot baselines are committed to the repo (not stored as a CI
// artifact) so a failing comparison shows up as an ordinary diff in the PR.
// Both local dev and CI run on Linux with the same pinned Playwright/browser
// version (package.json), which is what keeps pixel output consistent
// between the two — snapshots taken on a non-Linux machine will not match.
export default defineConfig({
  testDir: "./e2e",
  // The Offloader specs share one mutable Supabase account across tests
  // (no per-test tenancy), so tests aren't actually independent the way
  // fullyParallel assumes — with it on, CI observed hook/test scheduling
  // interleave across different tests even at workers: 1, corrupting each
  // other's data (e.g. one test's rows still present, doubled, inside a
  // different test's beforeEach-cleared run). Fully serial execution is a
  // correctness requirement here, not just a performance trade-off.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  // Signs in a dedicated test-only Supabase account once and writes its
  // session to e2e/.auth/user.json; authenticated specs load it via
  // test.use({ storageState: AUTH_FILE }). See e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bun run dev -- --port 4321 --strictPort",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
