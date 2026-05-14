import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2, Target, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { loadData, saveData } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { InlineEdit } from "@/components/inline-edit";
import { PageHeader } from "@/components/require-auth";
import { cn } from "@/lib/utils";

type Task = { id: string; text: string; done: boolean };
type Goal = { id: string; title: string; horizon: string; progress: number; notes: string };

export type GoalsBoard = {
  goals: Goal[];
  thisWeek: Task[];
  later: Task[];
};

const EMPTY: GoalsBoard = { goals: [], thisWeek: [], later: [] };

export function GoalsAndTasks({
  storageKey,
  title,
  subtitle,
  seed,
  intro,
}: {
  storageKey: string;
  title: string;
  subtitle: string;
  seed: GoalsBoard;
  intro?: ReactNode;
}) {
  const { user } = useAuth();
  const [board, setBoard] = useState<GoalsBoard>(seed);

  useEffect(() => {
    setBoard(loadData(user?.id, storageKey, seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, storageKey]);
  useEffect(() => saveData(user?.id, storageKey, board), [user?.id, storageKey, board]);

  const update = (patch: Partial<GoalsBoard>) => setBoard((b) => ({ ...b, ...patch }));

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      {intro}

      {/* Goals */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary-light" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-tertiary">
            Goals
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {board.goals.map((g, idx) => (
            <div key={g.id} className="rounded-xl border border-border bg-gradient-card p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <InlineEdit
                  value={g.title}
                  onChange={(v) =>
                    update({
                      goals: board.goals.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                    })
                  }
                  className="text-base font-semibold"
                />
                <button
                  onClick={() => update({ goals: board.goals.filter((_, i) => i !== idx) })}
                  className="text-tertiary hover:text-destructive"
                  aria-label="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs text-tertiary">
                Horizon{" "}
                <InlineEdit
                  value={g.horizon}
                  onChange={(v) =>
                    update({
                      goals: board.goals.map((x, i) => (i === idx ? { ...x, horizon: v } : x)),
                    })
                  }
                  className="text-xs"
                />
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-tertiary">Progress</span>
                  <span className="font-semibold tabular-nums">{g.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={g.progress}
                  onChange={(e) =>
                    update({
                      goals: board.goals.map((x, i) =>
                        i === idx ? { ...x, progress: Number(e.target.value) } : x,
                      ),
                    })
                  }
                  className="w-full accent-violet-400"
                />
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-card-nested">
                  <div
                    className="h-full bg-gradient-brand transition-all"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
              </div>

              <textarea
                value={g.notes}
                onChange={(e) =>
                  update({
                    goals: board.goals.map((x, i) =>
                      i === idx ? { ...x, notes: e.target.value } : x,
                    ),
                  })
                }
                rows={2}
                placeholder="Why this matters, next step…"
                className="mt-3 w-full resize-none rounded-md border border-border bg-card p-2 text-sm placeholder:text-tertiary focus:border-primary/40 focus:outline-none"
              />
            </div>
          ))}

          <button
            onClick={() =>
              update({
                goals: [
                  ...board.goals,
                  { id: crypto.randomUUID(), title: "New goal", horizon: "3 months", progress: 0, notes: "" },
                ],
              })
            }
            className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Add goal
            </span>
          </button>
        </div>
      </section>

      {/* Tasks */}
      <section className="grid gap-4 lg:grid-cols-2">
        {(["thisWeek", "later"] as const).map((bucket) => {
          const items = board[bucket];
          const label = bucket === "thisWeek" ? "This week" : "Later";
          return (
            <div key={bucket} className="rounded-xl border border-border bg-gradient-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium uppercase tracking-wider text-tertiary">
                  {label}
                </h3>
                <span className="text-xs text-tertiary">
                  {items.filter((x) => x.done).length}/{items.length} done
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((t, idx) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-sm"
                  >
                    <button
                      onClick={() =>
                        update({
                          [bucket]: items.map((x, i) => (i === idx ? { ...x, done: !x.done } : x)),
                        } as Partial<GoalsBoard>)
                      }
                      className="text-primary-light"
                      aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {t.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4 text-tertiary" />
                      )}
                    </button>
                    <InlineEdit
                      value={t.text}
                      onChange={(v) =>
                        update({
                          [bucket]: items.map((x, i) => (i === idx ? { ...x, text: v } : x)),
                        } as Partial<GoalsBoard>)
                      }
                      placeholder="New task"
                      className={cn("flex-1", t.done && "line-through text-tertiary")}
                    />
                    <button
                      onClick={() =>
                        update({
                          [bucket]: items.filter((_, i) => i !== idx),
                        } as Partial<GoalsBoard>)
                      }
                      className="text-tertiary hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update({
                    [bucket]: [
                      ...items,
                      { id: crypto.randomUUID(), text: "", done: false },
                    ],
                  } as Partial<GoalsBoard>)
                }
                className="mt-3 border-border bg-card hover:bg-card-nested"
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </Button>
            </div>
          );
        })}
      </section>
    </>
  );
}

export const emptyBoard = EMPTY;
