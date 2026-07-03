import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPreferences, saveUserPreferences, UserPreferencesSchema } from "./preferences-data";

export const getPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getUserPreferences(supabase, userId);
  });

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UserPreferencesSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await saveUserPreferences(supabase, userId, data);
    return { ok: true };
  });
