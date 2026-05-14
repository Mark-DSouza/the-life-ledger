import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/require-auth";
import { GoalsAndTasks, type GoalsBoard } from "@/components/goals-and-tasks";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work — LifeOS" },
      { name: "description", content: "Track current projects, deep-work blocks and weekly deliverables." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <GoalsAndTasks
        storageKey="work"
        title="Work"
        subtitle="Current projects, deep work blocks, and weekly deliverables."
        seed={SEED}
      />
    </RequireAuth>
  ),
});

const SEED: GoalsBoard = {
  goals: [
    { id: "1", title: "Ship Q3 roadmap on time", horizon: "Quarter", progress: 55, notes: "On track, watch billing scope" },
    { id: "2", title: "Reduce p95 latency by 30%", horizon: "8 weeks", progress: 40, notes: "Cache layer rolling out" },
  ],
  thisWeek: [
    { id: "1", text: "Roadmap review draft", done: false },
    { id: "2", text: "Pair on auth migration", done: true },
    { id: "3", text: "Hiring loop debrief", done: false },
  ],
  later: [
    { id: "1", text: "Write up incident retro", done: false },
    { id: "2", text: "Reorg observability dashboards", done: false },
  ],
};
