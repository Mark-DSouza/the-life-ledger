import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { Button } from "@/components/ui/button";
import { useUserData, WEEKDAYS, type Weekday } from "@/lib/storage";

export const Route = createFileRoute("/meals")({
  head: () => ({
    meta: [
      { title: "Meals — LifeOS" },
      { name: "description", content: "Track every meal with calories and macros — protein, carb, fat — across the week." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MealsPage />
    </RequireAuth>
  ),
});

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
};

const DAILY_GOAL = 2200;

const DEFAULT: Record<Weekday, { meals: Meal[]; goal: number }> = WEEKDAYS.reduce(
  (acc, d) => ({ ...acc, [d]: { meals: [], goal: DAILY_GOAL } }),
  {} as Record<Weekday, { meals: Meal[]; goal: number }>,
);

function MealsPage() {
  const { data: week, setData: setWeek } = useUserData("meals", DEFAULT);

  const totals = useMemo(() => {
    return WEEKDAYS.reduce((acc, d) => {
      acc[d] = week[d].meals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
      return acc;
    }, {} as Record<Weekday, number>);
  }, [week]);

  const update = (day: Weekday, patch: Partial<(typeof week)[Weekday]>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  return (
    <>
      <PageHeader title="Meals" subtitle="Add meals as you eat. Calorie totals update live." />
      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const d = week[day];
          const consumed = totals[day];
          const remaining = d.goal - consumed;
          return (
            <ExpandableCard
              key={day}
              title={
                <span className="flex items-center gap-3">
                  <span className="w-10 text-tertiary">{day}</span>
                  <span>{consumed} kcal</span>
                </span>
              }
              accent={
                <>
                  <Pill tone={remaining >= 0 ? "primary" : "warn"}>
                    {remaining >= 0 ? `${remaining} kcal left` : `${Math.abs(remaining)} over`}
                  </Pill>
                  <span className="text-sm text-muted-foreground">
                    Goal {d.goal} kcal
                  </span>
                </>
              }
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-tertiary">Daily goal</span>
                  <InlineEdit
                    type="number"
                    value={d.goal}
                    onChange={(v) => update(day, { goal: Number(v) || 0 })}
                    suffix="kcal"
                    width="6ch"
                  />
                </div>

                {d.meals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No meals logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {d.meals.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card p-3 text-sm"
                      >
                        <InlineEdit
                          value={m.name}
                          onChange={(v) =>
                            update(day, {
                              meals: d.meals.map((x, i) => (i === idx ? { ...x, name: v } : x)),
                            })
                          }
                          placeholder="Meal name"
                        />
                        <span>
                          <InlineEdit
                            type="number"
                            value={m.calories}
                            onChange={(v) =>
                              update(day, {
                                meals: d.meals.map((x, i) => (i === idx ? { ...x, calories: Number(v) } : x)),
                              })
                            }
                            suffix="kcal"
                            width="5ch"
                          />
                        </span>
                        <span>
                          P{" "}
                          <InlineEdit
                            type="number"
                            value={m.protein}
                            onChange={(v) =>
                              update(day, {
                                meals: d.meals.map((x, i) => (i === idx ? { ...x, protein: Number(v) } : x)),
                              })
                            }
                            suffix="g"
                            width="3ch"
                          />
                        </span>
                        <span>
                          C{" "}
                          <InlineEdit
                            type="number"
                            value={m.carb}
                            onChange={(v) =>
                              update(day, {
                                meals: d.meals.map((x, i) => (i === idx ? { ...x, carb: Number(v) } : x)),
                              })
                            }
                            suffix="g"
                            width="3ch"
                          />
                        </span>
                        <span>
                          F{" "}
                          <InlineEdit
                            type="number"
                            value={m.fat}
                            onChange={(v) =>
                              update(day, {
                                meals: d.meals.map((x, i) => (i === idx ? { ...x, fat: Number(v) } : x)),
                              })
                            }
                            suffix="g"
                            width="3ch"
                          />
                        </span>
                        <button
                          onClick={() =>
                            update(day, { meals: d.meals.filter((_, i) => i !== idx) })
                          }
                          className="ml-auto text-tertiary hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update(day, {
                      meals: [
                        ...d.meals,
                        { id: crypto.randomUUID(), name: "New meal", calories: 0, protein: 0, carb: 0, fat: 0 },
                      ],
                    })
                  }
                  className="border-border bg-card hover:bg-card-nested"
                >
                  <Plus className="h-3.5 w-3.5" /> Add meal
                </Button>
              </div>
            </ExpandableCard>
          );
        })}
      </div>
    </>
  );
}
