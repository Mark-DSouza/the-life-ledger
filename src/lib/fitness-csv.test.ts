import { describe, it, expect } from "vitest";
import { exportFitnessCSV, importFitnessCSV } from "./fitness-csv";
import type { FitnessDay, FitnessWeek } from "./fitness-data";

const HEADER =
  "day,day_type,summary,exercise_type,name,body_part,sets,reps,weight,seat,pace,duration_min,bpm";

const restDay: FitnessDay = { type: "Rest", bodyParts: "", exercises: [] };

function week(overrides: Partial<FitnessWeek>): FitnessWeek {
  return {
    Mon: restDay,
    Tue: restDay,
    Wed: restDay,
    Thu: restDay,
    Fri: restDay,
    Sat: restDay,
    Sun: restDay,
    ...overrides,
  };
}

describe("exportFitnessCSV", () => {
  it("serialises lift exercises with cardio columns left blank", () => {
    const csv = exportFitnessCSV(
      week({
        Mon: {
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
        },
      }),
    );
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toBe("Mon,Hypertrophy,Chest - Triceps,lift,Bench Press,Chest,3,10,60,—,,,");
  });

  it("serialises a mixed day with cardio rows leaving lift columns blank", () => {
    const csv = exportFitnessCSV(
      week({
        Tue: {
          type: "Cardio",
          bodyParts: "Zone 2",
          exercises: [
            {
              exerciseType: "lift",
              name: "Goblet Squat",
              bodyPart: "Quads",
              sets: 2,
              reps: 12,
              weight: 24,
              seat: "—",
            },
            { exerciseType: "cardio", name: "Treadmill", pace: 6.5, duration: 35, bpm: 138 },
          ],
        },
      }),
    );
    const lines = csv.trim().split("\n");
    expect(lines).toContain("Tue,Cardio,Zone 2,lift,Goblet Squat,Quads,2,12,24,—,,,");
    expect(lines).toContain("Tue,Cardio,Zone 2,cardio,Treadmill,,,,,,6.5,35,138");
  });

  it("emits a day-only row for days with no exercises", () => {
    const csv = exportFitnessCSV(
      week({ Sun: { type: "Rest", bodyParts: "Mobility & walk", exercises: [] } }),
    );
    const lines = csv.trim().split("\n");
    expect(lines).toContain("Sun,Rest,Mobility & walk,,,,,,,,,,");
    // every day appears at least once, so the file round-trips to a full week
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(lines.some((l) => l.startsWith(`${day},`))).toBe(true);
    }
  });

  it("quotes fields containing commas or quotes", () => {
    const csv = exportFitnessCSV(
      week({
        Mon: {
          type: "Strength",
          bodyParts: "Back, Grip",
          exercises: [
            {
              exerciseType: "lift",
              name: 'Pull-ups, "weighted"',
              bodyPart: "Back",
              sets: 3,
              reps: 8,
              weight: 10,
              seat: "—",
            },
          ],
        },
      }),
    );
    const lines = csv.trim().split("\n");
    expect(lines[1]).toBe(
      'Mon,Strength,"Back, Grip",lift,"Pull-ups, ""weighted""",Back,3,8,10,—,,,',
    );
  });
});

describe("importFitnessCSV", () => {
  const fullWeek = week({
    Mon: {
      type: "Hypertrophy",
      bodyParts: "Chest, Triceps",
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
        { exerciseType: "cardio", name: "Cooldown walk", pace: 10.5, duration: 10, bpm: 110 },
      ],
    },
    Sat: {
      type: "Cardio",
      bodyParts: "Tempo run",
      exercises: [
        { exerciseType: "cardio", name: "Outdoor run", pace: 5.33, duration: 25, bpm: 162 },
      ],
    },
  });

  it("round-trips a week exported by exportFitnessCSV", () => {
    const result = importFitnessCSV(exportFitnessCSV(fullWeek));
    expect(result).toEqual({ ok: true, week: fullWeek });
  });

  it("reports missing required columns", () => {
    const noWeight = exportFitnessCSV(fullWeek)
      .split("\n")
      .map((line) => line.replace(",weight,", ",kilos,"))
      .join("\n");
    const result = importFitnessCSV(noWeight);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/weight/);
  });

  it("reports an unknown exercise_type with its row number", () => {
    const csv = `${HEADER}\nMon,Strength,Back,swimming,Laps,,,,,,,,\n`;
    const result = importFitnessCSV(csv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Row 2.*swimming/);
  });

  it("reports a non-numeric weight instead of importing garbage", () => {
    const csv = `${HEADER}\nMon,Strength,Back,lift,Deadlift,Back,3,5,heavy,—,,,\n`;
    const result = importFitnessCSV(csv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/weight.*heavy/);
  });
});
