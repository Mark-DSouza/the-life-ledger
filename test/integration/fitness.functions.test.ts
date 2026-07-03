// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createTestUser } from "../helpers/supabase";
import { loadFitness, saveFitness } from "@/lib/fitness-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Exercise = Record<string, unknown>;
type Day = { type: string; bodyParts: string; exercises: Exercise[] };

function emptyWeek(): Record<string, Day> {
  return Object.fromEntries(
    WEEKDAYS.map((d) => [d, { type: "Rest", bodyParts: "", exercises: [] }]),
  ) as Record<string, Day>;
}

describe("fitness round-trip through the unified exercises table", () => {
  it("saves and loads a lift (with sets) and a cardio (with decimal pace)", async () => {
    const { userId, client } = await createTestUser();

    const week = emptyWeek();
    week.Mon = {
      type: "Hypertrophy",
      bodyParts: "Chest - Triceps",
      exercises: [
        {
          exerciseType: "lift",
          name: "Bench Press",
          bodyPart: "Chest",
          sets: 3,
          reps: 10,
          weight: 60,
          seat: "—",
        },
      ],
    };
    week.Tue = {
      type: "Cardio",
      bodyParts: "Zone 2",
      exercises: [{ exerciseType: "cardio", name: "Treadmill", pace: 6.5, duration: 35, bpm: 138 }],
    };

    await saveFitness(client, userId, week);
    const loaded = (await loadFitness(client, userId)) as Record<string, Day> | null;

    expect(loaded).not.toBeNull();

    const mon = loaded!.Mon;
    expect(mon.type).toBe("Hypertrophy");
    expect(mon.bodyParts).toBe("Chest - Triceps");
    expect(mon.exercises).toHaveLength(1);
    expect(mon.exercises[0]).toMatchObject({
      exerciseType: "lift",
      name: "Bench Press",
      bodyPart: "Chest",
      sets: 3,
      reps: 10,
      weight: 60,
      seat: "—",
    });

    const tue = loaded!.Tue;
    expect(tue.exercises[0]).toMatchObject({
      exerciseType: "cardio",
      name: "Treadmill",
      pace: 6.5,
      duration: 35,
      bpm: 138,
    });
  });

  it("re-saving replaces a day's exercises instead of appending", async () => {
    const { userId, client } = await createTestUser();

    const week = emptyWeek();
    week.Mon = {
      type: "Strength",
      bodyParts: "Back",
      exercises: [
        {
          exerciseType: "lift",
          name: "Deadlift",
          bodyPart: "Back",
          sets: 3,
          reps: 5,
          weight: 110,
          seat: "—",
        },
        {
          exerciseType: "lift",
          name: "Barbell Row",
          bodyPart: "Back",
          sets: 3,
          reps: 8,
          weight: 60,
          seat: "—",
        },
      ],
    };
    await saveFitness(client, userId, week);

    week.Mon.exercises = [
      {
        exerciseType: "lift",
        name: "Deadlift",
        bodyPart: "Back",
        sets: 5,
        reps: 3,
        weight: 120,
        seat: "—",
      },
    ];
    await saveFitness(client, userId, week);

    const loaded = (await loadFitness(client, userId)) as Record<string, Day>;
    expect(loaded.Mon.exercises).toHaveLength(1);
    expect(loaded.Mon.exercises[0]).toMatchObject({
      name: "Deadlift",
      sets: 5,
      reps: 3,
      weight: 120,
    });
  });

  it("keeps each user's week invisible to other users (RLS)", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();

    const week = emptyWeek();
    week.Fri = {
      type: "Hypertrophy",
      bodyParts: "Legs",
      exercises: [
        {
          exerciseType: "lift",
          name: "Back Squat",
          bodyPart: "Quads",
          sets: 3,
          reps: 10,
          weight: 100,
          seat: "—",
        },
      ],
    };
    await saveFitness(alice.client, alice.userId, week);

    // Bob has no data of his own, and asking for Alice's rows through his client yields nothing.
    expect(await loadFitness(bob.client, bob.userId)).toBeNull();
    expect(await loadFitness(bob.client, alice.userId)).toBeNull();
  });
});
