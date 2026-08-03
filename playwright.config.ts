import { defineConfig, devices } from "@playwright/test";

// Visual-snapshot baselines are committed to the repo (not stored as a CI
// artifact) so a failing comparison shows up as an ordinary diff in the PR.
// Both local dev and CI run on Linux with the same pinned Playwright/browser
// version (package.json), which is what keeps pixel output consistent
// between the two — snapshots taken on a non-Linux machine will not match.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
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
