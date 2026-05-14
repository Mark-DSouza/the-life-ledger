import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadData, saveData, WEEKDAYS, type Weekday } from "@/lib/storage";

export const Route = createFileRoute("/fitness")({
  head: () => ({
    meta: [
      { title: "Fitness — LifeOS" },
      { name: "description", content: "Plan your weekly workouts. Track sets, reps, weight, cardio, pace and BPM." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <FitnessPage />
    </RequireAuth>
  ),
});

type WorkoutType = "Strength" | "Hypertrophy" | "Cardio" | "Rest";

type LiftExercise = {
  id: string;
  bodyPart: string;
  name: string;
  reps: number;
  weight: number;
  seat: string;
};

type CardioBlock = {
  id: string;
  name: string;
  pace: string;
  duration: number; // minutes
  bpm: number;
};

type DayData = {
  type: WorkoutType;
  bodyParts: string; // "Biceps - Shoulders"
  lifts: LiftExercise[];
  cardio: CardioBlock[];
};

const DEFAULT: Record<Weekday, DayData> = {
  Mon: { type: "Hypertrophy", bodyParts: "Chest - Triceps", lifts: [
    { id: "1", bodyPart: "Chest", name: "Bench Press", reps: 10, weight: 60, seat: "—" },
    { id: "2", bodyPart: "Triceps", name: "Cable Pushdown", reps: 12, weight: 25, seat: "—" },
  ], cardio: [] },
  Tue: { type: "Cardio", bodyParts: "Zone 2 - Easy", lifts: [], cardio: [
    { id: "1", name: "Treadmill", pace: "6:30/km", duration: 35, bpm: 138 },
  ] },
  Wed: { type: "Strength", bodyParts: "Back - Biceps", lifts: [
    { id: "1", bodyPart: "Back", name: "Deadlift", reps: 5, weight: 110, seat: "—" },
    { id: "2", bodyPart: "Biceps", name: "Barbell Curl", reps: 8, weight: 30, seat: "—" },
  ], cardio: [] },
  Thu: { type: "Hypertrophy", bodyParts: "Shoulders - Abs", lifts: [
    { id: "1", bodyPart: "Shoulders", name: "Overhead Press", reps: 10, weight: 35, seat: "5" },
  ], cardio: [] },
  Fri: { type: "Strength", bodyParts: "Legs", lifts: [
    { id: "1", bodyPart: "Quads", name: "Back Squat", reps: 5, weight: 100, seat: "—" },
    { id: "2", bodyPart: "Hamstrings", name: "Romanian DL", reps: 8, weight: 80, seat: "—" },
  ], cardio: [] },
  Sat: { type: "Cardio", bodyParts: "Tempo run", lifts: [], cardio: [
    { id: "1", name: "Outdoor run", pace: "5:20/km", duration: 25, bpm: 162 },
  ] },
  Sun: { type: "Rest", bodyParts: "Mobility & walk", lifts: [], cardio: [] },
};

const TYPE_TONE: Record<WorkoutType, "primary" | "muted" | "success" | "warn"> = {
  Strength: "primary",
  Hypertrophy: "warn",
  Cardio: "success",
  Rest: "muted",
};

function FitnessPage() {
  const { user } = useAuth();
  const [week, setWeek] = useState<Record<Weekday, DayData>>(DEFAULT);

  useEffect(() => {
    setWeek(loadData(user?.id, "fitness", DEFAULT));
  }, [user?.id]);

  useEffect(() => {
    saveData(user?.id, "fitness", week);
  }, [user?.id, week]);

  const update = (day: Weekday, patch: Partial<DayData>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  return (
    <>
      <PageHeader title="Fitness" subtitle="Plan workouts for every day of the week. Tap a card to expand." />
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
                    onChange={(e) => update(day, { type: e.target.value as WorkoutType })}
                    className="rounded-md border border-border bg-card px-2 py-1 text-sm focus:border-primary/40 focus:outline-none"
                  >
                    {(["Strength", "Hypertrophy", "Cardio", "Rest"] as WorkoutType[]).map((t) => (
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

                {d.type === "Cardio" ? (
                  <div className="space-y-2">
                    {d.cardio.map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <InlineEdit
                          value={c.name}
                          onChange={(v) =>
                            update(day, {
                              cardio: d.cardio.map((x, i) => (i === idx ? { ...x, name: v } : x)),
                            })
                          }
                          placeholder="Exercise"
                        />
                        <span className="text-tertiary">·</span>
                        <span>
                          Pace{" "}
                          <InlineEdit
                            value={c.pace}
                            onChange={(v) =>
                              update(day, {
                                cardio: d.cardio.map((x, i) => (i === idx ? { ...x, pace: v } : x)),
                              })
                            }
                          />
                        </span>
                        <span>
                          Duration{" "}
                          <InlineEdit
                            type="number"
                            value={c.duration}
                            onChange={(v) =>
                              update(day, {
                                cardio: d.cardio.map((x, i) => (i === idx ? { ...x, duration: Number(v) } : x)),
                              })
                            }
                            suffix="min"
                            width="4ch"
                          />
                        </span>
                        <span>
                          BPM{" "}
                          <InlineEdit
                            type="number"
                            value={c.bpm}
                            onChange={(v) =>
                              update(day, {
                                cardio: d.cardio.map((x, i) => (i === idx ? { ...x, bpm: Number(v) } : x)),
                              })
                            }
                            width="4ch"
                          />
                        </span>
                        <button
                          onClick={() =>
                            update(day, { cardio: d.cardio.filter((_, i) => i !== idx) })
                          }
                          className="ml-auto text-tertiary hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update(day, {
                          cardio: [
                            ...d.cardio,
                            { id: crypto.randomUUID(), name: "New cardio", pace: "—", duration: 20, bpm: 130 },
                          ],
                        })
                      }
                      className="border-border bg-card hover:bg-card-nested"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add cardio
                    </Button>
                  </div>
                ) : d.type === "Rest" ? (
                  <p className="text-sm text-muted-foreground">Rest day. Take it easy.</p>
                ) : (
                  <div className="space-y-2">
                    {d.lifts.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <span className="text-tertiary">Body</span>
                        <InlineEdit
                          value={ex.bodyPart}
                          onChange={(v) =>
                            update(day, {
                              lifts: d.lifts.map((x, i) => (i === idx ? { ...x, bodyPart: v } : x)),
                            })
                          }
                        />
                        <span className="text-tertiary">·</span>
                        <span className="text-tertiary">Exercise</span>
                        <InlineEdit
                          value={ex.name}
                          onChange={(v) =>
                            update(day, {
                              lifts: d.lifts.map((x, i) => (i === idx ? { ...x, name: v } : x)),
                            })
                          }
                        />
                        <span>
                          Reps{" "}
                          <InlineEdit
                            type="number"
                            value={ex.reps}
                            onChange={(v) =>
                              update(day, {
                                lifts: d.lifts.map((x, i) => (i === idx ? { ...x, reps: Number(v) } : x)),
                              })
                            }
                            width="4ch"
                          />
                        </span>
                        <span>
                          Weight{" "}
                          <InlineEdit
                            type="number"
                            value={ex.weight}
                            onChange={(v) =>
                              update(day, {
                                lifts: d.lifts.map((x, i) => (i === idx ? { ...x, weight: Number(v) } : x)),
                              })
                            }
                            suffix="kg"
                            width="5ch"
                          />
                        </span>
                        <span>
                          Seat{" "}
                          <InlineEdit
                            value={ex.seat}
                            onChange={(v) =>
                              update(day, {
                                lifts: d.lifts.map((x, i) => (i === idx ? { ...x, seat: v } : x)),
                              })
                            }
                          />
                        </span>
                        <button
                          onClick={() =>
                            update(day, { lifts: d.lifts.filter((_, i) => i !== idx) })
                          }
                          className="ml-auto text-tertiary hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update(day, {
                          lifts: [
                            ...d.lifts,
                            { id: crypto.randomUUID(), bodyPart: "—", name: "New exercise", reps: 10, weight: 20, seat: "—" },
                          ],
                        })
                      }
                      className="border-border bg-card hover:bg-card-nested"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add exercise
                    </Button>
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
