import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export const UserPreferencesSchema = z.object({
  weightUnit: z.enum(["kg", "lbs"]),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type WeightUnit = UserPreferences["weightUnit"];

const DEFAULT_PREFERENCES: UserPreferences = { weightUnit: "kg" };

export async function getUserPreferences(supabase: DB, userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("weight_unit")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_PREFERENCES;
  return { weightUnit: data.weight_unit as UserPreferences["weightUnit"] };
}

export async function saveUserPreferences(
  supabase: DB,
  userId: string,
  prefs: UserPreferences,
): Promise<void> {
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, weight_unit: prefs.weightUnit }, { onConflict: "user_id" });
  if (error) throw error;
}
