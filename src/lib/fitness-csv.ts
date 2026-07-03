import type { FitnessWeek } from "./fitness-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const CSV_COLUMNS = [
  "day",
  "day_type",
  "summary",
  "exercise_type",
  "name",
  "body_part",
  "sets",
  "reps",
  "weight",
  "seat",
  "pace",
  "duration_min",
  "bpm",
] as const;

function esc(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(cells: (string | number)[]): string {
  return cells.map(esc).join(",");
}

/** Serialise a Training Week to a flat CSV string — one row per Exercise. */
export function exportFitnessCSV(week: FitnessWeek): string {
  const rows: string[] = [CSV_COLUMNS.join(",")];
  for (const day of WEEKDAYS) {
    const d = week[day];
    if (d.exercises.length === 0) {
      rows.push(row([day, d.type, d.bodyParts, "", "", "", "", "", "", "", "", "", ""]));
      continue;
    }
    for (const e of d.exercises) {
      if (e.exerciseType === "lift") {
        rows.push(
          row([
            day,
            d.type,
            d.bodyParts,
            "lift",
            e.name,
            e.bodyPart,
            e.sets,
            e.reps,
            e.weight,
            e.seat,
            "",
            "",
            "",
          ]),
        );
      } else {
        rows.push(
          row([
            day,
            d.type,
            d.bodyParts,
            "cardio",
            e.name,
            "",
            "",
            "",
            "",
            "",
            e.pace,
            e.duration,
            e.bpm,
          ]),
        );
      }
    }
  }
  return rows.join("\n") + "\n";
}
