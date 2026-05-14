import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { Button } from "@/components/ui/button";
import { useUserData, WEEKDAYS, type Weekday } from "@/lib/storage";

export const Route = createFileRoute("/mental")({
  head: () => ({
    meta: [
      { title: "Mental Wellbeing — LifeOS" },
      { name: "description", content: "Track happiness, productivity, stress, daily actions and therapy notes for every weekday." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MentalPage />
    </RequireAuth>
  ),
});

type Action = { id: string; text: string; done: boolean };

type DayMental = {
  happiness: number; // 1-10
  productivity: number;
  stress: number;
  actions: Action[];
  therapy: string;
  notes: string;
};

const DEFAULT_DAY: DayMental = {
  happiness: 7,
  productivity: 6,
  stress: 4,
  actions: [],
  therapy: "",
  notes: "",
};

const DEFAULT: Record<Weekday, DayMental> = WEEKDAYS.reduce(
  (acc, d) => ({ ...acc, [d]: { ...DEFAULT_DAY } }),
  {} as Record<Weekday, DayMental>,
);

function ScoreSlider({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  tone: "good" | "bad" | "neutral";
}) {
  const color =
    tone === "good"
      ? "accent-emerald-400"
      : tone === "bad"
        ? "accent-rose-400"
        : "accent-violet-400";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-tertiary">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${color}`}
      />
    </div>
  );
}

function MentalPage() {
  const { data: week, setData: setWeek } = useUserData("mental", DEFAULT);

  const update = (day: Weekday, patch: Partial<DayMental>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  return (
    <>
      <PageHeader
        title="Mental Wellbeing"
        subtitle="Score your day on happiness, productivity, stress. Capture actions, therapy and notes."
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
                  <span>Mood {d.happiness}/10</span>
                </span>
              }
              accent={
                <>
                  <Pill tone="success">😊 {d.happiness}</Pill>
                  <Pill tone="primary">⚡ {d.productivity}</Pill>
                  <Pill tone="warn">😰 {d.stress}</Pill>
                </>
              }
            >
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <ScoreSlider
                    label="Happiness"
                    value={d.happiness}
                    onChange={(v) => update(day, { happiness: v })}
                    tone="good"
                  />
                  <ScoreSlider
                    label="Productivity"
                    value={d.productivity}
                    onChange={(v) => update(day, { productivity: v })}
                    tone="neutral"
                  />
                  <ScoreSlider
                    label="Stress"
                    value={d.stress}
                    onChange={(v) => update(day, { stress: v })}
                    tone="bad"
                  />
                </div>

                <section>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-tertiary">
                    Actions
                  </div>
                  {d.actions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No actions yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {d.actions.map((a, idx) => (
                        <li
                          key={a.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={a.done}
                            onChange={(e) =>
                              update(day, {
                                actions: d.actions.map((x, i) =>
                                  i === idx ? { ...x, done: e.target.checked } : x,
                                ),
                              })
                            }
                            className="h-4 w-4 accent-violet-400"
                          />
                          <InlineEdit
                            value={a.text}
                            onChange={(v) =>
                              update(day, {
                                actions: d.actions.map((x, i) =>
                                  i === idx ? { ...x, text: v } : x,
                                ),
                              })
                            }
                            placeholder="Action"
                            className={a.done ? "line-through text-tertiary" : ""}
                          />
                          <button
                            onClick={() =>
                              update(day, {
                                actions: d.actions.filter((_, i) => i !== idx),
                              })
                            }
                            className="ml-auto text-tertiary hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      update(day, {
                        actions: [
                          ...d.actions,
                          { id: crypto.randomUUID(), text: "", done: false },
                        ],
                      })
                    }
                    className="mt-2 border-border bg-card hover:bg-card-nested"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add action
                  </Button>
                </section>

                <section className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-tertiary">
                      Therapy
                    </div>
                    <textarea
                      value={d.therapy}
                      onChange={(e) => update(day, { therapy: e.target.value })}
                      rows={4}
                      placeholder="Session reflections, prompts, takeaways…"
                      className="w-full resize-none rounded-md bg-transparent text-sm placeholder:text-tertiary focus:outline-none"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wider text-tertiary">
                      Notes
                    </div>
                    <textarea
                      value={d.notes}
                      onChange={(e) => update(day, { notes: e.target.value })}
                      rows={4}
                      placeholder="Anything else on your mind."
                      className="w-full resize-none rounded-md bg-transparent text-sm placeholder:text-tertiary focus:outline-none"
                    />
                  </div>
                </section>
              </div>
            </ExpandableCard>
          );
        })}
      </div>
    </>
  );
}
