# Harden saveUserData and ignore .env

## 1. Add `.env` to `.gitignore`

Append a small section to `.gitignore`:

```
# Local env files
.env
.env.*
!.env.example
```

This prevents future accidental commits if a real secret is ever added (today the file only holds publishable keys, so nothing needs to be removed from git history).

## 2. Replace `z.unknown()` in `saveUserData` with strict per-key schemas

In `src/lib/user-data.functions.ts`, define a Zod schema for each `key` (fitness, meals, sleep, mental, personal/career/work) and validate the inner `data` payload before any DB write. Use a discriminated dispatch keyed off `key` so each branch parses with the correct schema.

### Schemas (one per feature)

All free-text strings get `.trim().max(...)`, all numbers get `min/max` ranges matching DB/UI semantics, all arrays get `.max(...)` caps. Unknown extra fields are stripped (Zod default).

- **FitnessWeekSchema** — `Record<Weekday, { type: enum(Strength|Hypertrophy|Cardio|Rest), bodyParts: string≤200, lifts: array(≤50) of { bodyPart≤100, name≤200, reps int 0–1000, weight 0–10000, seat≤50 }, cardio: array(≤20) of { name≤200, pace≤50, duration int 0–1440, bpm int 0–300 } }>`
- **MealsWeekSchema** — `Record<Weekday, { goal int 0–20000, meals: array(≤30) of { name≤200, calories 0–10000, protein 0–1000, carb 0–1000, fat 0–1000 } }>`
- **SleepWeekSchema** — `Record<Weekday, { start: HH:MM regex, end: HH:MM regex, interruptions: array(≤20) of { time: HH:MM, reason≤500 } }>`
- **MentalWeekSchema** — `Record<Weekday, { happiness 1–10, productivity 1–10, stress 1–10, therapy≤2000, notes≤2000, actions: array(≤30) of { text≤500, done: boolean } }>`
- **BoardSchema** (personal/career/work) — `{ goals: array(≤50) of { title≤200, horizon≤100, progress 0–100, notes≤2000 }, thisWeek: array(≤200) of { text≤500, done: boolean }, later: array(≤200) of { text≤500, done: boolean } }`

Build the weekday schemas with a helper that maps over `WEEKDAYS` so all 7 days are required and validated identically.

### Validator wiring

Replace the current validator:

```ts
.inputValidator((input) => {
  const outer = z.object({ key: KEY, data: z.unknown() }).parse(input);
  switch (outer.key) {
    case "fitness": return { key: outer.key, data: FitnessWeekSchema.parse(outer.data) };
    case "meals":   return { key: outer.key, data: MealsWeekSchema.parse(outer.data) };
    case "sleep":   return { key: outer.key, data: SleepWeekSchema.parse(outer.data) };
    case "mental":  return { key: outer.key, data: MentalWeekSchema.parse(outer.data) };
    case "personal":
    case "career":
    case "work":    return { key: outer.key, data: BoardSchema.parse(outer.data) };
  }
})
```

Keep handler dispatch as-is; the inner save helpers (`saveFitness`, `saveMeals`, …) keep their `data: unknown` signatures and `as` casts so no other code changes. The cast is now safe because data is pre-validated.

## 3. Mark security finding fixed

After the change lands, call `manage_security_finding` with `mark_as_fixed` on `agent_security` / `SERVER_FN_UNVALIDATED_INPUT` so it drops off the Security tab.

## Files touched

- `.gitignore` — append env-file rules
- `src/lib/user-data.functions.ts` — add 5 schemas + discriminated validator

No DB migrations, no client changes.