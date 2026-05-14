import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof WEEKDAYS)[number];

const KEY = z.enum([
  "fitness",
  "meals",
  "sleep",
  "mental",
  "personal",
  "career",
  "work",
]);
type Key = z.infer<typeof KEY>;

// ---------------- shape helpers ----------------

function emptyWeek<T>(make: () => T): Record<Weekday, T> {
  return WEEKDAYS.reduce(
    (acc, d) => ({ ...acc, [d]: make() }),
    {} as Record<Weekday, T>,
  );
}

// ---------------- FITNESS ----------------

async function loadFitness(supabase: DB, userId: string) {
  const [days, lifts, cardio] = await Promise.all([
    supabase.from("fitness_days").select("*").eq("user_id", userId),
    supabase.from("fitness_lifts").select("*").eq("user_id", userId).order("position"),
    supabase.from("fitness_cardio").select("*").eq("user_id", userId).order("position"),
  ]);
  if (days.error) throw days.error;
  if (lifts.error) throw lifts.error;
  if (cardio.error) throw cardio.error;
  if (!days.data || days.data.length === 0) return null;

  const week = emptyWeek(() => ({
    type: "Rest" as const,
    bodyParts: "",
    lifts: [] as unknown[],
    cardio: [] as unknown[],
  }));
  const dayById = new Map<string, Weekday>();
  for (const d of days.data) {
    const wd = d.weekday as Weekday;
    dayById.set(d.id, wd);
    week[wd] = { type: d.type as never, bodyParts: d.summary, lifts: [], cardio: [] };
  }
  for (const l of lifts.data ?? []) {
    const wd = dayById.get(l.day_id);
    if (!wd) continue;
    week[wd].lifts.push({
      id: l.id,
      bodyPart: l.body_part,
      name: l.name,
      reps: l.reps,
      weight: Number(l.weight),
      seat: l.seat,
    });
  }
  for (const c of cardio.data ?? []) {
    const wd = dayById.get(c.day_id);
    if (!wd) continue;
    week[wd].cardio.push({
      id: c.id,
      name: c.name,
      pace: c.pace,
      duration: c.duration_min,
      bpm: c.bpm,
    });
  }
  return week;
}

async function saveFitness(supabase: DB, userId: string, data: unknown) {
  const week = data as Record<Weekday, {
    type: string;
    bodyParts: string;
    lifts: { bodyPart: string; name: string; reps: number; weight: number; seat: string }[];
    cardio: { name: string; pace: string; duration: number; bpm: number }[];
  }>;

  // Upsert each day, get id, then replace child rows.
  for (const wd of WEEKDAYS) {
    const d = week[wd];
    if (!d) continue;
    const { data: dayRow, error: upErr } = await supabase
      .from("fitness_days")
      .upsert(
        { user_id: userId, weekday: wd, type: d.type as never, summary: d.bodyParts ?? "" },
        { onConflict: "user_id,weekday" },
      )
      .select("id")
      .single();
    if (upErr) throw upErr;

    await supabase.from("fitness_lifts").delete().eq("day_id", dayRow.id);
    if (d.lifts?.length) {
      const rows = d.lifts.map((l, i) => ({
        day_id: dayRow.id,
        user_id: userId,
        position: i,
        body_part: l.bodyPart ?? "",
        name: l.name ?? "",
        reps: Number(l.reps) || 0,
        weight: Number(l.weight) || 0,
        seat: l.seat ?? "",
      }));
      const { error } = await supabase.from("fitness_lifts").insert(rows);
      if (error) throw error;
    }

    await supabase.from("fitness_cardio").delete().eq("day_id", dayRow.id);
    if (d.cardio?.length) {
      const rows = d.cardio.map((c, i) => ({
        day_id: dayRow.id,
        user_id: userId,
        position: i,
        name: c.name ?? "",
        pace: c.pace ?? "",
        duration_min: Number(c.duration) || 0,
        bpm: Number(c.bpm) || 0,
      }));
      const { error } = await supabase.from("fitness_cardio").insert(rows);
      if (error) throw error;
    }
  }
}

// ---------------- MEALS ----------------

async function loadMeals(supabase: DB, userId: string) {
  const [days, entries] = await Promise.all([
    supabase.from("meal_days").select("*").eq("user_id", userId),
    supabase.from("meal_entries").select("*").eq("user_id", userId).order("position"),
  ]);
  if (days.error) throw days.error;
  if (entries.error) throw entries.error;
  if (!days.data || days.data.length === 0) return null;

  const week = emptyWeek(() => ({ meals: [] as unknown[], goal: 2200 }));
  const dayById = new Map<string, Weekday>();
  for (const d of days.data) {
    const wd = d.weekday as Weekday;
    dayById.set(d.id, wd);
    week[wd] = { meals: [], goal: d.calorie_goal };
  }
  for (const m of entries.data ?? []) {
    const wd = dayById.get(m.day_id);
    if (!wd) continue;
    week[wd].meals.push({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein_g,
      carb: m.carb_g,
      fat: m.fat_g,
    });
  }
  return week;
}

async function saveMeals(supabase: DB, userId: string, data: unknown) {
  const week = data as Record<Weekday, {
    goal: number;
    meals: { name: string; calories: number; protein: number; carb: number; fat: number }[];
  }>;
  for (const wd of WEEKDAYS) {
    const d = week[wd];
    if (!d) continue;
    const { data: dayRow, error: upErr } = await supabase
      .from("meal_days")
      .upsert(
        { user_id: userId, weekday: wd, calorie_goal: Number(d.goal) || 2200 },
        { onConflict: "user_id,weekday" },
      )
      .select("id")
      .single();
    if (upErr) throw upErr;

    await supabase.from("meal_entries").delete().eq("day_id", dayRow.id);
    if (d.meals?.length) {
      const rows = d.meals.map((m, i) => ({
        day_id: dayRow.id,
        user_id: userId,
        position: i,
        name: m.name ?? "",
        calories: Number(m.calories) || 0,
        protein_g: Number(m.protein) || 0,
        carb_g: Number(m.carb) || 0,
        fat_g: Number(m.fat) || 0,
      }));
      const { error } = await supabase.from("meal_entries").insert(rows);
      if (error) throw error;
    }
  }
}

// ---------------- SLEEP ----------------

async function loadSleep(supabase: DB, userId: string) {
  const [days, ints] = await Promise.all([
    supabase.from("sleep_days").select("*").eq("user_id", userId),
    supabase.from("sleep_interruptions").select("*").eq("user_id", userId).order("position"),
  ]);
  if (days.error) throw days.error;
  if (ints.error) throw ints.error;
  if (!days.data || days.data.length === 0) return null;

  const week = emptyWeek(() => ({ start: "23:00", end: "07:00", interruptions: [] as unknown[] }));
  const dayById = new Map<string, Weekday>();
  for (const d of days.data) {
    const wd = d.weekday as Weekday;
    dayById.set(d.id, wd);
    week[wd] = {
      start: (d.bedtime as string).slice(0, 5),
      end: (d.wake_time as string).slice(0, 5),
      interruptions: [],
    };
  }
  for (const i of ints.data ?? []) {
    const wd = dayById.get(i.day_id);
    if (!wd) continue;
    week[wd].interruptions.push({
      id: i.id,
      time: (i.at as string).slice(0, 5),
      reason: i.reason,
    });
  }
  return week;
}

async function saveSleep(supabase: DB, userId: string, data: unknown) {
  const week = data as Record<Weekday, {
    start: string;
    end: string;
    interruptions: { time: string; reason: string }[];
  }>;
  for (const wd of WEEKDAYS) {
    const d = week[wd];
    if (!d) continue;
    const { data: dayRow, error: upErr } = await supabase
      .from("sleep_days")
      .upsert(
        { user_id: userId, weekday: wd, bedtime: d.start || "23:00", wake_time: d.end || "07:00" },
        { onConflict: "user_id,weekday" },
      )
      .select("id")
      .single();
    if (upErr) throw upErr;

    await supabase.from("sleep_interruptions").delete().eq("day_id", dayRow.id);
    if (d.interruptions?.length) {
      const rows = d.interruptions.map((it, i) => ({
        day_id: dayRow.id,
        user_id: userId,
        position: i,
        at: it.time || "03:00",
        reason: it.reason ?? "",
      }));
      const { error } = await supabase.from("sleep_interruptions").insert(rows);
      if (error) throw error;
    }
  }
}

// ---------------- MENTAL ----------------

async function loadMental(supabase: DB, userId: string) {
  const [days, actions] = await Promise.all([
    supabase.from("mental_days").select("*").eq("user_id", userId),
    supabase.from("mental_actions").select("*").eq("user_id", userId).order("position"),
  ]);
  if (days.error) throw days.error;
  if (actions.error) throw actions.error;
  if (!days.data || days.data.length === 0) return null;

  const week = emptyWeek(() => ({
    happiness: 7,
    productivity: 6,
    stress: 4,
    actions: [] as unknown[],
    therapy: "",
    notes: "",
  }));
  const dayById = new Map<string, Weekday>();
  for (const d of days.data) {
    const wd = d.weekday as Weekday;
    dayById.set(d.id, wd);
    week[wd] = {
      happiness: d.happiness,
      productivity: d.productivity,
      stress: d.stress,
      actions: [],
      therapy: d.therapy,
      notes: d.notes,
    };
  }
  for (const a of actions.data ?? []) {
    const wd = dayById.get(a.day_id);
    if (!wd) continue;
    week[wd].actions.push({ id: a.id, text: a.text, done: a.done });
  }
  return week;
}

async function saveMental(supabase: DB, userId: string, data: unknown) {
  const week = data as Record<Weekday, {
    happiness: number;
    productivity: number;
    stress: number;
    therapy: string;
    notes: string;
    actions: { text: string; done: boolean }[];
  }>;
  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(Number(n) || min)));
  for (const wd of WEEKDAYS) {
    const d = week[wd];
    if (!d) continue;
    const { data: dayRow, error: upErr } = await supabase
      .from("mental_days")
      .upsert(
        {
          user_id: userId,
          weekday: wd,
          happiness: clamp(d.happiness, 1, 10),
          productivity: clamp(d.productivity, 1, 10),
          stress: clamp(d.stress, 1, 10),
          therapy: d.therapy ?? "",
          notes: d.notes ?? "",
        },
        { onConflict: "user_id,weekday" },
      )
      .select("id")
      .single();
    if (upErr) throw upErr;

    await supabase.from("mental_actions").delete().eq("day_id", dayRow.id);
    if (d.actions?.length) {
      const rows = d.actions.map((a, i) => ({
        day_id: dayRow.id,
        user_id: userId,
        position: i,
        text: a.text ?? "",
        done: !!a.done,
      }));
      const { error } = await supabase.from("mental_actions").insert(rows);
      if (error) throw error;
    }
  }
}

// ---------------- GOALS / TASKS (personal, career, work) ----------------

type Area = "personal" | "career" | "work";

async function loadBoard(supabase: DB, userId: string, area: Area) {
  const [goals, tasks] = await Promise.all([
    supabase
      .from("life_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("area", area)
      .order("position"),
    supabase
      .from("life_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("area", area)
      .order("position"),
  ]);
  if (goals.error) throw goals.error;
  if (tasks.error) throw tasks.error;
  if ((goals.data?.length ?? 0) === 0 && (tasks.data?.length ?? 0) === 0) return null;

  return {
    goals: (goals.data ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      horizon: g.horizon,
      progress: g.progress,
      notes: g.notes,
    })),
    thisWeek: (tasks.data ?? [])
      .filter((t) => t.bucket === "this_week")
      .map((t) => ({ id: t.id, text: t.text, done: t.done })),
    later: (tasks.data ?? [])
      .filter((t) => t.bucket === "later")
      .map((t) => ({ id: t.id, text: t.text, done: t.done })),
  };
}

async function saveBoard(supabase: DB, userId: string, area: Area, data: unknown) {
  const board = data as {
    goals: { title: string; horizon: string; progress: number; notes: string }[];
    thisWeek: { text: string; done: boolean }[];
    later: { text: string; done: boolean }[];
  };

  // Replace strategy: delete + insert (small N; simplest correctness).
  await supabase.from("life_goals").delete().eq("user_id", userId).eq("area", area);
  if (board.goals?.length) {
    const rows = board.goals.map((g, i) => ({
      user_id: userId,
      area,
      position: i,
      title: g.title ?? "",
      horizon: g.horizon ?? "",
      progress: Math.max(0, Math.min(100, Math.round(Number(g.progress) || 0))),
      notes: g.notes ?? "",
    }));
    const { error } = await supabase.from("life_goals").insert(rows);
    if (error) throw error;
  }

  await supabase.from("life_tasks").delete().eq("user_id", userId).eq("area", area);
  const taskRows = [
    ...(board.thisWeek ?? []).map((t, i) => ({
      user_id: userId,
      area,
      bucket: "this_week" as const,
      position: i,
      text: t.text ?? "",
      done: !!t.done,
    })),
    ...(board.later ?? []).map((t, i) => ({
      user_id: userId,
      area,
      bucket: "later" as const,
      position: i,
      text: t.text ?? "",
      done: !!t.done,
    })),
  ];
  if (taskRows.length) {
    const { error } = await supabase.from("life_tasks").insert(taskRows);
    if (error) throw error;
  }
}

// ---------------- public server fns ----------------

export const getUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ key: KEY }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const k = data.key as Key;
    let result: unknown = null;
    if (k === "fitness") result = await loadFitness(supabase, userId);
    else if (k === "meals") result = await loadMeals(supabase, userId);
    else if (k === "sleep") result = await loadSleep(supabase, userId);
    else if (k === "mental") result = await loadMental(supabase, userId);
    else result = await loadBoard(supabase, userId, k as Area);
    return { data: (result ?? null) as never };
  });

export const saveUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ key: KEY, data: z.unknown() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const k = data.key as Key;
    if (k === "fitness") await saveFitness(supabase, userId, data.data);
    else if (k === "meals") await saveMeals(supabase, userId, data.data);
    else if (k === "sleep") await saveSleep(supabase, userId, data.data);
    else if (k === "mental") await saveMental(supabase, userId, data.data);
    else await saveBoard(supabase, userId, k as Area, data.data);
    return { ok: true };
  });
