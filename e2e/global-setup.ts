import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Authenticated specs need a real signed-in session, but this app only
// exposes passwordless OTP/magic-link login in its UI — neither is
// scriptable in CI without an inbox. Supabase's email provider also
// supports plain password sign-in even though the app doesn't surface it;
// a dedicated test-only account (created once, confirmed by hand) lets this
// setup sign in with only the existing public anon key — no service-role
// key or admin API involved. See the Offloader e2e auth ADR discussion on
// issue #45 for how the account was provisioned.
export const AUTH_FILE = path.join(dirname, ".auth", "user.json");

export default async function globalSetup() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  const projectId = process.env.VITE_SUPABASE_PROJECT_ID;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  const missing = [
    ...(!url ? ["VITE_SUPABASE_URL"] : []),
    ...(!anonKey ? ["VITE_SUPABASE_PUBLISHABLE_KEY"] : []),
    ...(!projectId ? ["VITE_SUPABASE_PROJECT_ID"] : []),
    ...(!email ? ["E2E_TEST_EMAIL"] : []),
    ...(!password ? ["E2E_TEST_PASSWORD"] : []),
  ];
  if (missing.length) {
    throw new Error(
      `Playwright auth setup: missing env var(s): ${missing.join(", ")}. ` +
        `See .env.example for the full list.`,
    );
  }

  const supabase = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email!,
    password: password!,
  });
  if (error || !data.session) {
    throw new Error(`Playwright auth setup: sign-in failed: ${error?.message ?? "no session"}`);
  }

  const storageKey = `sb-${projectId}-auth-token`;
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321";

  mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  writeFileSync(
    AUTH_FILE,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [{ name: storageKey, value: JSON.stringify(data.session) }],
        },
      ],
    }),
  );
}
