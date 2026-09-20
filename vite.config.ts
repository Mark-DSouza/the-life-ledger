import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Vite only inlines VITE_* into the client environment on its own. The
  // Supabase client is constructed during SSR too, so the same values are
  // defined across every environment.
  const clientEnv = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(clientEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return {
    define,
    server: { host: "::", port: 8080 },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
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
      nitro({ preset: "cloudflare-module" }),
      tanstackStart({
        // Redirect Start's bundled server entry to src/server.ts (our SSR
        // error wrapper). wrangler.jsonc `main` alone is insufficient.
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      viteReact(),
    ],
  };
});
