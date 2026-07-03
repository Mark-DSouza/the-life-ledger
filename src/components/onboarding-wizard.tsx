import { useState } from "react";
import { ArrowLeft, Bike, Dumbbell, PencilRuler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/expandable-card";
import { cn } from "@/lib/utils";
import type { WorkoutGoal, WorkoutTemplate } from "@/lib/fitness-templates";

const GOALS: { goal: WorkoutGoal | "Custom"; blurb: string; icon: typeof Dumbbell }[] = [
  { goal: "Hypertrophy", blurb: "Build muscle with curated lifting splits.", icon: Dumbbell },
  { goal: "Cardio", blurb: "Structured aerobic weeks — pace, duration, BPM.", icon: Bike },
  { goal: "Custom", blurb: "Start from an empty week and build your own.", icon: PencilRuler },
];

const TYPE_TONE = {
  Strength: "primary",
  Hypertrophy: "warn",
  Cardio: "success",
  Rest: "muted",
} as const;

/**
 * Two-step Onboarding Flow, shown when the user has no Training Week yet.
 * Step 1 picks a Workout Goal (Custom completes immediately with an empty
 * week); step 2 picks a Template for that goal.
 */
export function OnboardingWizard({
  loadTemplates,
  onApplyTemplate,
  onCustom,
}: {
  loadTemplates: (goal: WorkoutGoal) => Promise<WorkoutTemplate[]>;
  onApplyTemplate: (templateId: string) => Promise<void>;
  onCustom: () => Promise<void>;
}) {
  const [goal, setGoal] = useState<WorkoutGoal | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickGoal = async (picked: WorkoutGoal | "Custom") => {
    if (picked === "Custom") {
      setBusy(true);
      await onCustom().finally(() => setBusy(false));
      return;
    }
    setGoal(picked);
    setTemplates(null);
    setSelectedId(null);
    setTemplates(await loadTemplates(picked));
  };

  const apply = async () => {
    if (!selectedId) return;
    setBusy(true);
    await onApplyTemplate(selectedId).finally(() => setBusy(false));
  };

  if (goal === null) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Set up your training week
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a goal and we&apos;ll start you off with a full weekly plan you can edit freely.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {GOALS.map(({ goal: g, blurb, icon: Icon }) => (
            <button
              key={g}
              type="button"
              disabled={busy}
              onClick={() => void pickGoal(g)}
              className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-card-nested disabled:opacity-60"
            >
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-medium">{g}</div>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setGoal(null)}
        className="mb-4 text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Choose a {goal.toLowerCase()} plan
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every day comes fully populated — exercises, sets, reps and weights you can tune later.
      </p>

      {templates === null ? (
        <p className="mt-6 text-sm text-tertiary">Loading templates…</p>
      ) : templates.length === 0 ? (
        <p className="mt-6 text-sm text-tertiary">No templates available yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedId(t.id)}
              className={cn(
                "rounded-xl border bg-card p-5 text-left transition-colors hover:bg-card-nested",
                selectedId === t.id ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t.name}</span>
                {!t.isPublic ? <Pill tone="muted">Personal</Pill> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {t.days.map((d) => (
                  <li key={d.weekday} className="flex items-center gap-2">
                    <span className="w-10 text-tertiary">{d.weekday}</span>
                    <Pill tone={TYPE_TONE[d.type]}>{d.type}</Pill>
                    <span className="truncate text-muted-foreground">{d.summary}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button disabled={!selectedId || busy} onClick={() => void apply()}>
          Use this plan
        </Button>
      </div>
    </div>
  );
}
