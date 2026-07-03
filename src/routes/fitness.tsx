import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Plus } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { ExerciseRow } from "@/components/exercise-row";
import { ImportCsvButton } from "@/components/import-csv-button";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { WeightUnitToggle } from "@/components/weight-unit-toggle";
import { Button } from "@/components/ui/button";
import { useUserData, WEEKDAYS, type Weekday } from "@/lib/storage";
import { useWeightUnit } from "@/lib/preferences";
import { exportFitnessCSV } from "@/lib/fitness-csv";
import { saveUserData } from "@/lib/user-data.functions";
import { applyWorkoutTemplate, getWorkoutTemplates } from "@/lib/fitness-templates.functions";
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

const restDay: FitnessDay = { type: "Rest", bodyParts: "", exercises: [] };

// Seed shown only until the first load resolves; real first-time users get the
// Onboarding Flow instead (loadFitness returning null means no Training Week).
const EMPTY_WEEK: FitnessWeek = {
  Mon: restDay,
  Tue: restDay,
  Wed: restDay,
  Thu: restDay,
  Fri: restDay,
  Sat: restDay,
  Sun: restDay,
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

function downloadCSV(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function FitnessPage() {
  const {
    data: week,
    setData: setWeek,
    loading,
    exists,
    reload,
  } = useUserData<FitnessWeek>("fitness", EMPTY_WEEK);
  const { unit, setUnit } = useWeightUnit();
  const getTemplates = useServerFn(getWorkoutTemplates);
  const applyTemplate = useServerFn(applyWorkoutTemplate);
  const save = useServerFn(saveUserData);

  const update = (day: Weekday, patch: Partial<FitnessDay>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  if (loading) {
    return <div className="grid min-h-[40vh] place-items-center text-tertiary">Loading…</div>;
  }

  // First visit: no Training Week yet — run the Onboarding Flow full-page.
  if (!exists) {
    return (
      <OnboardingWizard
        loadTemplates={(goal) => getTemplates({ data: { goal } })}
        onApplyTemplate={async (templateId) => {
          await applyTemplate({ data: { templateId } });
          reload();
        }}
        onCustom={async () => {
          await save({ data: { key: "fitness", data: EMPTY_WEEK } });
          reload();
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Fitness"
        subtitle="Plan workouts for every day of the week. Tap a card to expand."
        right={
          <div className="flex items-center gap-2">
            <ImportCsvButton onImport={(w) => setWeek(w)} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV(exportFitnessCSV(week), "fitness-week.csv")}
              className="border-border bg-card hover:bg-card-nested"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <WeightUnitToggle value={unit} onChange={setUnit} />
          </div>
        }
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
                        weightUnit={unit}
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
