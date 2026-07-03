import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Standalone test config. Intentionally does NOT extend vite.config.ts, which
// pulls in the TanStack Start / Cloudflare build plugins via
// @lovable.dev/vite-tanstack-config — those break the test runner.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: false,
  },
});
