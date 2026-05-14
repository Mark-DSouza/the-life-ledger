import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/require-auth";
import { GoalsAndTasks, type GoalsBoard } from "@/components/goals-and-tasks";

export const Route = createFileRoute("/personal")({
  head: () => ({
    meta: [
      { title: "Personal — LifeOS" },
      { name: "description", content: "Track personal goals, habits, and meaningful moments outside work." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <GoalsAndTasks
        storageKey="personal"
        title="Personal"
        subtitle="Habits, relationships, growth — the things that matter outside work."
        seed={SEED}
      />
    </RequireAuth>
  ),
});

const SEED: GoalsBoard = {
  goals: [
    { id: "1", title: "Read 12 books this year", horizon: "12 months", progress: 35, notes: "Currently: 'Designing Your Life'" },
    { id: "2", title: "Call parents weekly", horizon: "Ongoing", progress: 70, notes: "Sundays after lunch" },
  ],
  thisWeek: [
    { id: "1", text: "Date night Friday", done: false },
    { id: "2", text: "30 min reading every night", done: false },
  ],
  later: [
    { id: "1", text: "Plan parents' anniversary trip", done: false },
    { id: "2", text: "Reorganize closet", done: false },
  ],
};
