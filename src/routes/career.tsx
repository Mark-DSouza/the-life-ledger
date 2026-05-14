import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/require-auth";
import { GoalsAndTasks, type GoalsBoard } from "@/components/goals-and-tasks";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career — LifeOS" },
      { name: "description", content: "Long-term career goals, milestones, and skills you're building." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <GoalsAndTasks
        storageKey="career"
        title="Career"
        subtitle="Long-term direction, milestones, and skills you're investing in."
        seed={SEED}
      />
    </RequireAuth>
  ),
});

const SEED: GoalsBoard = {
  goals: [
    { id: "1", title: "Move into a Staff role", horizon: "18 months", progress: 25, notes: "Influence + writing" },
    { id: "2", title: "Speak at one conference", horizon: "12 months", progress: 10, notes: "Draft abstract" },
  ],
  thisWeek: [
    { id: "1", text: "Update LinkedIn headline", done: false },
    { id: "2", text: "1:1 with mentor", done: false },
  ],
  later: [
    { id: "1", text: "Refresh portfolio site", done: false },
    { id: "2", text: "Write 2 essays on system design", done: false },
  ],
};
