import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { ExerciseRow } from "@/components/exercise-row";
import { Button } from "@/components/ui/button";
import { useUserData, WEEKDAYS, type Weekday } from "@/lib/storage";
import type { Exercise, FitnessDay, FitnessWeek } from "@/lib/fitness-data";

export const Route = createFileRoute("/fitness")({
  head: () => ({
    meta: [
      { title: "Fitness — LifeOS" },
      {
        name: "description",
        content: "Plan your weekly workouts. Track sets, reps, weight, cardio, pace and BPM.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <FitnessPage />
    </RequireAuth>
  ),
});

type DayType = FitnessDay["type"];

const DEFAULT: FitnessWeek = {
  Mon: {
    type: "Hypertrophy",
    bodyParts: "Chest - Triceps",
    exercises: [
      {
        id: "1",
        exerciseType: "lift",
        bodyPart: "Chest",
        name: "Bench Press",
        sets: 3,
        reps: 10,
        weight: 60,
        seat: "—",
      },
      {
        id: "2",
        exerciseType: "lift",
        bodyPart: "Triceps",
        name: "Cable Pushdown",
        sets: 3,
        reps: 12,
        weight: 25,
        seat: "—",
      },
    ],
  },
  Tue: {
    type: "Cardio",
    bodyParts: "Zone 2 - Easy",
    exercises: [
      { id: "1", exerciseType: "cardio", name: "Treadmill", pace: 6.5, duration: 35, bpm: 138 },
    ],
  },
  Wed: {
    type: "Strength",
    bodyParts: "Back - Biceps",
    exercises: [
      {
        id: "1",
        exerciseType: "lift",
        bodyPart: "Back",
        name: "Deadlift",
        sets: 3,
        reps: 5,
        weight: 110,
        seat: "—",
      },
      {
        id: "2",
        exerciseType: "lift",
        bodyPart: "Biceps",
        name: "Barbell Curl",
        sets: 3,
        reps: 8,
        weight: 30,
        seat: "—",
      },
    ],
  },
  Thu: {
    type: "Hypertrophy",
    bodyParts: "Shoulders - Abs",
    exercises: [
      {
        id: "1",
        exerciseType: "lift",
        bodyPart: "Shoulders",
        name: "Overhead Press",
        sets: 3,
        reps: 10,
        weight: 35,
        seat: "5",
      },
    ],
  },
  Fri: {
    type: "Strength",
    bodyParts: "Legs",
    exercises: [
      {
        id: "1",
        exerciseType: "lift",
        bodyPart: "Quads",
        name: "Back Squat",
        sets: 3,
        reps: 5,
        weight: 100,
        seat: "—",
      },
      {
        id: "2",
        exerciseType: "lift",
        bodyPart: "Hamstrings",
        name: "Romanian DL",
        sets: 3,
        reps: 8,
        weight: 80,
        seat: "—",
      },
    ],
  },
  Sat: {
    type: "Cardio",
    bodyParts: "Tempo run",
    exercises: [
      { id: "1", exerciseType: "cardio", name: "Outdoor run", pace: 5.33, duration: 25, bpm: 162 },
    ],
  },
  Sun: { type: "Rest", bodyParts: "Mobility & walk", exercises: [] },
};

const TYPE_TONE: Record<DayType, "primary" | "muted" | "success" | "warn"> = {
  Strength: "primary",
  Hypertrophy: "warn",
  Cardio: "success",
  Rest: "muted",
};

function newLift(): Exercise {
  return {
    id: crypto.randomUUID(),
    exerciseType: "lift",
    bodyPart: "—",
    name: "New exercise",
    sets: 3,
    reps: 10,
    weight: 20,
    seat: "—",
  };
}

function newCardio(): Exercise {
  return {
    id: crypto.randomUUID(),
    exerciseType: "cardio",
    name: "New cardio",
    pace: 6.5,
    duration: 20,
    bpm: 130,
  };
}

function FitnessPage() {
  const { data: week, setData: setWeek } = useUserData<FitnessWeek>("fitness", DEFAULT);

  const update = (day: Weekday, patch: Partial<FitnessDay>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  return (
    <>
      <PageHeader
        title="Fitness"
        subtitle="Plan workouts for every day of the week. Tap a card to expand."
      />
      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const d = week[day];
          return (
            <ExpandableCard
              key={day}
              title={
                <span className="flex items-center gap-3">
                  <span className="w-10 text-tertiary">{day}</span>
                  <span>{d.type}</span>
                </span>
              }
              accent={
                <>
                  <Pill tone={TYPE_TONE[d.type]}>{d.type}</Pill>
                  <span className="text-sm text-muted-foreground">/ {d.bodyParts}</span>
                </>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="text-tertiary">Type</label>
                  <select
                    value={d.type}
                    onChange={(e) => update(day, { type: e.target.value as DayType })}
                    className="rounded-md border border-border bg-card px-2 py-1 text-sm focus:border-primary/40 focus:outline-none"
                  >
                    {(["Strength", "Hypertrophy", "Cardio", "Rest"] as DayType[]).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="ml-2 text-tertiary">Summary</label>
                  <InlineEdit
                    value={d.bodyParts}
                    onChange={(v) => update(day, { bodyParts: v })}
                    placeholder="e.g. Biceps - Shoulders"
                  />
                </div>

                {d.type === "Rest" ? (
                  <p className="text-sm text-muted-foreground">Rest day. Take it easy.</p>
                ) : (
                  <div className="space-y-2">
                    {d.exercises.map((ex, idx) => (
                      <ExerciseRow
                        key={ex.id ?? idx}
                        exercise={ex}
                        onChange={(updated) =>
                          update(day, {
                            exercises: d.exercises.map((x, i) => (i === idx ? updated : x)),
                          })
                        }
                        onDelete={() =>
                          update(day, { exercises: d.exercises.filter((_, i) => i !== idx) })
                        }
                      />
                    ))}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => update(day, { exercises: [...d.exercises, newLift()] })}
                        className="border-border bg-card hover:bg-card-nested"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add lift
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => update(day, { exercises: [...d.exercises, newCardio()] })}
                        className="border-border bg-card hover:bg-card-nested"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add cardio
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ExpandableCard>
          );
        })}
      </div>
    </>
  );
}
