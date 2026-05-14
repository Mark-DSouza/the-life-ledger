import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RequireAuth, PageHeader } from "@/components/require-auth";
import { ExpandableCard, Pill } from "@/components/expandable-card";
import { InlineEdit } from "@/components/inline-edit";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadData, saveData, WEEKDAYS, type Weekday } from "@/lib/storage";

export const Route = createFileRoute("/sleep")({
  head: () => ({
    meta: [
      { title: "Sleep — LifeOS" },
      { name: "description", content: "Track sleep start, wake time, and interruptions for every day of the week." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SleepPage />
    </RequireAuth>
  ),
});

type Interruption = { id: string; time: string; reason: string };
type DaySleep = { start: string; end: string; interruptions: Interruption[] };

function durationHrs(start: string, end: string) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

const DEFAULT: Record<Weekday, DaySleep> = WEEKDAYS.reduce(
  (acc, d) => ({ ...acc, [d]: { start: "23:00", end: "07:00", interruptions: [] } }),
  {} as Record<Weekday, DaySleep>,
);

function SleepPage() {
  const { user } = useAuth();
  const [week, setWeek] = useState(DEFAULT);

  useEffect(() => setWeek(loadData(user?.id, "sleep", DEFAULT)), [user?.id]);
  useEffect(() => saveData(user?.id, "sleep", week), [user?.id, week]);

  const update = (day: Weekday, patch: Partial<DaySleep>) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));

  return (
    <>
      <PageHeader title="Sleep" subtitle="Log when you went to bed, when you woke up, and any interruptions." />
      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const d = week[day];
          const hrs = durationHrs(d.start, d.end);
          const tone: "success" | "warn" | "primary" =
            hrs >= 7 ? "success" : hrs >= 6 ? "primary" : "warn";
          return (
            <ExpandableCard
              key={day}
              title={
                <span className="flex items-center gap-3">
                  <span className="w-10 text-tertiary">{day}</span>
                  <span>
                    {d.start} → {d.end}
                  </span>
                </span>
              }
              accent={
                <>
                  <Pill tone={tone}>{hrs} h</Pill>
                  {d.interruptions.length > 0 ? (
                    <Pill tone="muted">{d.interruptions.length} wake-up{d.interruptions.length === 1 ? "" : "s"}</Pill>
                  ) : null}
                </>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-tertiary">Bedtime</span>
                    <input
                      type="time"
                      value={d.start}
                      onChange={(e) => update(day, { start: e.target.value })}
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums focus:border-primary/40 focus:outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-tertiary">Wake</span>
                    <input
                      type="time"
                      value={d.end}
                      onChange={(e) => update(day, { end: e.target.value })}
                      className="rounded-md border border-border bg-card px-2 py-1 text-sm tabular-nums focus:border-primary/40 focus:outline-none"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-tertiary">
                    Interruptions
                  </div>
                  {d.interruptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Slept through the night.</p>
                  ) : (
                    <div className="space-y-2">
                      {d.interruptions.map((it, idx) => (
                        <div
                          key={it.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                        >
                          <input
                            type="time"
                            value={it.time}
                            onChange={(e) =>
                              update(day, {
                                interruptions: d.interruptions.map((x, i) =>
                                  i === idx ? { ...x, time: e.target.value } : x,
                                ),
                              })
                            }
                            className="rounded-md border border-border bg-card-nested px-2 py-1 tabular-nums focus:border-primary/40 focus:outline-none"
                          />
                          <InlineEdit
                            value={it.reason}
                            onChange={(v) =>
                              update(day, {
                                interruptions: d.interruptions.map((x, i) =>
                                  i === idx ? { ...x, reason: v } : x,
                                ),
                              })
                            }
                            placeholder="Reason"
                          />
                          <button
                            onClick={() =>
                              update(day, {
                                interruptions: d.interruptions.filter((_, i) => i !== idx),
                              })
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
                        interruptions: [
                          ...d.interruptions,
                          { id: crypto.randomUUID(), time: "03:00", reason: "" },
                        ],
                      })
                    }
                    className="mt-2 border-border bg-card hover:bg-card-nested"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add interruption
                  </Button>
                </div>
              </div>
            </ExpandableCard>
          );
        })}
      </div>
    </>
  );
}
