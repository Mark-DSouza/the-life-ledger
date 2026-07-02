import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Integration tests talk to the local Supabase dev stack (`bunx supabase start`).
// Config is read from TEST_-prefixed env vars so the app's .env (which points at
// the hosted project) can never leak in, and a guard below refuses non-local URLs.
const SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? "http://127.0.0.1:54321";
// Fixed demo keys the supabase CLI generates for every local stack.
const ANON_KEY =
  process.env.TEST_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SUPABASE_URL)) {
  throw new Error(
    `Integration tests only run against a local Supabase stack, got: ${SUPABASE_URL}`,
  );
}

export type TestDB = SupabaseClient<Database>;

/** Service-role client that bypasses RLS — for setup/teardown only, never for assertions. */
export function adminClient(): TestDB {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type TestUser = {
  userId: string;
  email: string;
  /** A client authenticated AS this user — RLS applies exactly as in production. */
  client: TestDB;
};

/**
 * Create a fresh confirmed user and return a client signed in as them. Each test
 * should call this so its data is isolated behind that user's RLS policies.
 */
export async function createTestUser(): Promise<TestUser> {
  const admin = adminClient();
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = "password-123456";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user.id;

  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { userId, email, client };
}
