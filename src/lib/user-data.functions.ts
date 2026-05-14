import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ key: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("user_data")
      .select("data")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw error;
    return { data: row?.data ?? null };
  });

export const saveUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        key: z.string().min(1).max(64),
        data: z.unknown(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_data")
      .upsert(
        { user_id: userId, key: data.key, data: data.data as never },
        { onConflict: "user_id,key" },
      );
    if (error) throw error;
    return { ok: true };
  });
