import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { applyTemplate, loadTemplates, WorkoutGoalSchema } from "./fitness-templates";

export const getWorkoutTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ goal: WorkoutGoalSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    return loadTemplates(supabase, userId, data.goal);
  });

export const applyWorkoutTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ templateId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await applyTemplate(supabase, userId, data.templateId);
    return { ok: true };
  });
