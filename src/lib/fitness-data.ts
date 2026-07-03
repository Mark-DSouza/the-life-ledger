import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof WEEKDAYS)[number];

// ---------------- schemas ----------------

const LiftExerciseSchema = z.object({
  id: z.string().max(100).optional(),
  exerciseType: z.literal("lift"),
  name: z.string().max(200).default(""),
  bodyPart: z.string().max(100).default(""),
  sets: z.number().int().min(0).max(100),
  reps: z.number().int().min(0).max(1000),
  weight: z.number().min(0).max(10000),
  seat: z.string().max(50).default(""),
});

const CardioExerciseSchema = z.object({
  id: z.string().max(100).optional(),
  exerciseType: z.literal("cardio"),
  name: z.string().max(200).default(""),
  // Decimal minutes per km (6.5 = 6:30/km). The UI labels it min/km.
  pace: z.number().min(0).max(1000),
  duration: z.number().int().min(0).max(1440),
  bpm: z.number().int().min(0).max(300),
});

export const ExerciseSchema = z.discriminatedUnion("exerciseType", [
  LiftExerciseSchema,
  CardioExerciseSchema,
]);

export const FitnessDaySchema = z.object({
  type: z.enum(["Strength", "Hypertrophy", "Cardio", "Rest"]),
  bodyParts: z.string().max(200).default(""),
  exercises: z.array(ExerciseSchema).max(50).default([]),
});

export const FitnessWeekSchema = z.object(
  WEEKDAYS.reduce(
    (acc, d) => ({ ...acc, [d]: FitnessDaySchema }),
    {} as Record<Weekday, typeof FitnessDaySchema>,
  ),
);

export type LiftExercise = z.infer<typeof LiftExerciseSchema>;
export type CardioExercise = z.infer<typeof CardioExerciseSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type FitnessDay = z.infer<typeof FitnessDaySchema>;
export type FitnessWeek = z.infer<typeof FitnessWeekSchema>;

// ---------------- persistence ----------------

export async function loadFitness(supabase: DB, userId: string): Promise<FitnessWeek | null> {
  const [days, exercises] = await Promise.all([
    supabase.from("fitness_days").select("*").eq("user_id", userId),
    supabase.from("fitness_exercises").select("*").eq("user_id", userId).order("position"),
  ]);
  if (days.error) throw days.error;
  if (exercises.error) throw exercises.error;
  if (!days.data || days.data.length === 0) return null;

  const week = WEEKDAYS.reduce(
    (acc, d) => ({ ...acc, [d]: { type: "Rest" as const, bodyParts: "", exercises: [] } }),
    {} as FitnessWeek,
  );
  const dayById = new Map<string, Weekday>();
  for (const d of days.data) {
    const wd = d.weekday as Weekday;
    dayById.set(d.id, wd);
    week[wd] = { type: d.type, bodyParts: d.summary, exercises: [] };
  }
  for (const e of exercises.data ?? []) {
    const wd = dayById.get(e.day_id);
    if (!wd) continue;
    week[wd].exercises.push(exerciseFromRow(e));
  }
  return week;
}

/** Sparse DB row (fitness_exercises or workout_template_exercises) → Exercise. */
export function exerciseFromRow(row: {
  id?: string;
  exercise_type: "lift" | "cardio";
  name: string;
  body_part: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  seat: string | null;
  pace: number | null;
  duration_min: number | null;
  bpm: number | null;
}): Exercise {
  if (row.exercise_type === "lift") {
    return {
      id: row.id,
      exerciseType: "lift",
      name: row.name,
      bodyPart: row.body_part ?? "",
      sets: row.sets ?? 0,
      reps: row.reps ?? 0,
      weight: Number(row.weight ?? 0),
      seat: row.seat ?? "",
    };
  }
  return {
    id: row.id,
    exerciseType: "cardio",
    name: row.name,
    pace: Number(row.pace ?? 0),
    duration: row.duration_min ?? 0,
    bpm: row.bpm ?? 0,
  };
}

export async function saveFitness(supabase: DB, userId: string, data: unknown): Promise<void> {
  const week = data as FitnessWeek;

  // Upsert each day, get id, then replace child exercise rows.
  for (const wd of WEEKDAYS) {
    const d = week[wd];
    if (!d) continue;
    const { data: dayRow, error: upErr } = await supabase
      .from("fitness_days")
      .upsert(
        { user_id: userId, weekday: wd, type: d.type, summary: d.bodyParts ?? "" },
        { onConflict: "user_id,weekday" },
      )
      .select("id")
      .single();
    if (upErr) throw upErr;

    await supabase.from("fitness_exercises").delete().eq("day_id", dayRow.id);
    if (d.exercises?.length) {
      const rows = d.exercises.map((e, i) =>
        e.exerciseType === "lift"
          ? {
              day_id: dayRow.id,
              user_id: userId,
              position: i,
              exercise_type: "lift" as const,
              name: e.name ?? "",
              body_part: e.bodyPart ?? "",
              sets: Number(e.sets) || 0,
              reps: Number(e.reps) || 0,
              weight: Number(e.weight) || 0,
              seat: e.seat ?? "",
            }
          : {
              day_id: dayRow.id,
              user_id: userId,
              position: i,
              exercise_type: "cardio" as const,
              name: e.name ?? "",
              pace: Number(e.pace) || 0,
              duration_min: Number(e.duration) || 0,
              bpm: Number(e.bpm) || 0,
            },
      );
      const { error } = await supabase.from("fitness_exercises").insert(rows);
      if (error) throw error;
    }
  }
}
