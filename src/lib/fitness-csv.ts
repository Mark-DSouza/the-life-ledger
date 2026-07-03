import { FitnessWeekSchema } from "./fitness-data";
import type { FitnessDay, FitnessWeek } from "./fitness-data";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Weekday = (typeof WEEKDAYS)[number];

const DAY_TYPES = ["Strength", "Hypertrophy", "Cardio", "Rest"] as const;

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

export type ImportResult = { ok: true; week: FitnessWeek } | { ok: false; errors: string[] };

/** RFC-4180-style parser: quoted fields, doubled quotes, embedded commas/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Parse a Fitness CSV back into a Training Week. Returns the parsed week or a
 * list of validation errors — never touches the database.
 */
export function importFitnessCSV(csv: string): ImportResult {
  const records = parseCSV(csv).filter((r) => !(r.length === 1 && r[0].trim() === ""));
  if (records.length === 0) return { ok: false, errors: ["The file is empty."] };

  const header = records[0].map((h) => h.trim());
  const idx = new Map(header.map((h, i) => [h, i]));
  const missing = CSV_COLUMNS.filter((c) => !idx.has(c));
  if (missing.length > 0) {
    return { ok: false, errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const errors: string[] = [];
  const days = new Map<Weekday, FitnessDay>();

  for (let r = 1; r < records.length; r++) {
    const rowNo = r + 1;
    const get = (col: (typeof CSV_COLUMNS)[number]) => records[r][idx.get(col)!] ?? "";
    const num = (col: (typeof CSV_COLUMNS)[number]): number | null => {
      const raw = get(col).trim();
      if (raw === "") return 0;
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        errors.push(`Row ${rowNo}: ${col} must be a number, got "${raw}".`);
        return null;
      }
      return n;
    };

    const day = get("day") as Weekday;
    if (!WEEKDAYS.includes(day)) {
      errors.push(`Row ${rowNo}: unknown day "${get("day")}".`);
      continue;
    }
    const dayType = get("day_type") as FitnessDay["type"];
    if (!DAY_TYPES.includes(dayType)) {
      errors.push(`Row ${rowNo}: unknown day_type "${get("day_type")}".`);
      continue;
    }

    const d = days.get(day) ?? { type: dayType, bodyParts: get("summary"), exercises: [] };
    d.type = dayType;
    d.bodyParts = get("summary");
    days.set(day, d);

    const exerciseType = get("exercise_type");
    if (exerciseType === "") continue; // day-only row
    if (exerciseType === "lift") {
      const sets = num("sets");
      const reps = num("reps");
      const weight = num("weight");
      if (sets === null || reps === null || weight === null) continue;
      d.exercises.push({
        exerciseType: "lift",
        name: get("name"),
        bodyPart: get("body_part"),
        sets,
        reps,
        weight,
        seat: get("seat"),
      });
    } else if (exerciseType === "cardio") {
      const pace = num("pace");
      const duration = num("duration_min");
      const bpm = num("bpm");
      if (pace === null || duration === null || bpm === null) continue;
      d.exercises.push({ exerciseType: "cardio", name: get("name"), pace, duration, bpm });
    } else {
      errors.push(`Row ${rowNo}: unknown exercise_type "${exerciseType}".`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const full = WEEKDAYS.reduce(
    (acc, d) => ({
      ...acc,
      [d]: days.get(d) ?? { type: "Rest" as const, bodyParts: "", exercises: [] },
    }),
    {} as FitnessWeek,
  );
  const parsed = FitnessWeekSchema.safeParse(full);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, week: parsed.data };
}
