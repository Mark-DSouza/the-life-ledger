import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { exerciseFromRow, saveFitness } from "./fitness-data";
import type { FitnessDay, FitnessWeek } from "./fitness-data";

type DB = SupabaseClient<Database>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof WEEKDAYS)[number];

export const WorkoutGoalSchema = z.enum(["Hypertrophy", "Cardio"]);
export type WorkoutGoal = z.infer<typeof WorkoutGoalSchema>;

export type TemplateDay = {
  weekday: Weekday;
  type: FitnessDay["type"];
  summary: string;
};

export type WorkoutTemplate = {
  id: string;
  goal: WorkoutGoal;
  name: string;
  description: string;
  isPublic: boolean;
  days: TemplateDay[];
};

/** Public templates for the goal plus the calling user's Personal Templates. */
export async function loadTemplates(
  supabase: DB,
  userId: string,
  goal: WorkoutGoal,
): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, goal, name, description, is_public, workout_template_days(weekday, type, summary)")
    .eq("goal", goal)
    .or(`is_public.eq.true,owner_user_id.eq.${userId}`)
    .order("is_public", { ascending: false })
    .order("name");
  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id,
    goal: t.goal,
    name: t.name,
    description: t.description,
    isPublic: t.is_public,
    days: [...t.workout_template_days]
      .sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday))
      .map((d) => ({ weekday: d.weekday, type: d.type, summary: d.summary })),
  }));
}

/**
 * Write a template's days and exercises into the user's Training Week
 * (fitness_days + fitness_exercises). Days the template does not define
 * become empty Rest days. Returns the applied week.
 */
export async function applyTemplate(
  supabase: DB,
  userId: string,
  templateId: string,
): Promise<FitnessWeek> {
  // RLS hides templates the user may not use, so visibility doubles as authorisation.
  const { data: template, error: tplErr } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("id", templateId)
    .maybeSingle();
  if (tplErr) throw tplErr;
  if (!template) throw new Error("Template not found");

  const { data: days, error: daysErr } = await supabase
    .from("workout_template_days")
    .select("*")
    .eq("template_id", templateId);
  if (daysErr) throw daysErr;

  const dayIds = (days ?? []).map((d) => d.id);
  const exercises = dayIds.length
    ? await supabase
        .from("workout_template_exercises")
        .select("*")
        .in("template_day_id", dayIds)
        .order("position")
    : { data: [], error: null };
  if (exercises.error) throw exercises.error;

  const week = WEEKDAYS.reduce(
    (acc, d) => ({ ...acc, [d]: { type: "Rest" as const, bodyParts: "", exercises: [] } }),
    {} as FitnessWeek,
  );
  const dayById = new Map<string, Weekday>();
  for (const d of days ?? []) {
    dayById.set(d.id, d.weekday);
    week[d.weekday] = { type: d.type, bodyParts: d.summary, exercises: [] };
  }
  for (const e of exercises.data ?? []) {
    const wd = dayById.get(e.template_day_id);
    if (!wd) continue;
    const { id: _rowId, ...exercise } = exerciseFromRow(e);
    week[wd].exercises.push(exercise);
  }

  await saveFitness(supabase, userId, week);
  return week;
}
