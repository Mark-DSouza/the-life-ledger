import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Resolved from this file rather than process.cwd(), so the paths below don't
// depend on which directory Vite was invoked from.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  // Vite only inlines VITE_* into the client environment on its own. The
  // Supabase client is constructed during SSR too, so the same values are
  // defined across every environment — hence the name, which is not "client".
  const publicEnv = loadEnv(mode, projectRoot, "VITE_");
  const define = Object.fromEntries(
    Object.entries(publicEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return {
    define,
    server: { host: "::", port: 8080 },
    resolve: {
      alias: { "@": `${projectRoot}src` },
      // React and TanStack Query break if two copies end up in one bundle —
      // hooks read module-level state (the dispatcher, the query cache).
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      // Builds the Worker bundle into .output/ and writes its own wrangler
      // config, carrying over name/routes/vars from wrangler.jsonc.
      nitro({
        preset: "cloudflare-module",
        routeRules: {
          // The webfont is preloaded on every page, so without this it costs a
          // revalidation round trip per navigation — Workers Assets defaults
          // unhashed files to `max-age=0, must-revalidate`. Nitro already emits
          // this rule for /assets/* (which Vite content-hashes); /fonts/* is a
          // fixed path, so it needs its own. Safe to mark immutable because the
          // filename names the family, the subset and the variable axis:
          // swapping the face means a new filename, not new bytes at this one.
          "/fonts/**": {
            headers: { "cache-control": "public, max-age=31536000, immutable" },
          },
        },
      }),
      tanstackStart({
        // Redirect Start's bundled server entry to src/server.ts (our SSR
        // error wrapper). wrangler.jsonc `main` alone is insufficient.
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            // `specifiers` is merged with TanStack's defaults, but `files`
            // REPLACES them, so the default "**/*.server.*" has to be repeated
            // here. Without it `client.server.ts` — the service-role Supabase
            // client — ships to the browser with no build error.
            files: ["**/*.server.*", "**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      viteReact(),
    ],
  };
});
