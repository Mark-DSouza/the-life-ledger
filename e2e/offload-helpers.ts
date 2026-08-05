import { readFileSync } from "node:fs";
import { AUTH_FILE } from "./global-setup";

type StoredSession = { access_token: string; user: { id: string } };

function loadTestUserSession(): StoredSession {
  const state = JSON.parse(readFileSync(AUTH_FILE, "utf-8")) as {
    origins: { localStorage: { name: string; value: string }[] }[];
  };
  const entry = state.origins[0]?.localStorage[0];
  if (!entry) throw new Error("No stored Supabase session found — did globalSetup run?");
  return JSON.parse(entry.value) as StoredSession;
}

/** Wipes every offloader_items row for the dedicated e2e test user, so each
 * spec starts from a known-empty state despite running against real
 * Supabase (no separate integration/mock seam for this feature). */
export async function clearOffloaderItems() {
  const session = loadTestUserSession();
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(`${url}/rest/v1/offloader_items?user_id=eq.${session.user.id}`, {
    method: "DELETE",
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`clearOffloaderItems failed: ${res.status} ${await res.text()}`);
  }
}
