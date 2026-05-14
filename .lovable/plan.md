
# Normalize LifeOS data into per-feature schemas

Today every feature (fitness, meals, sleep, mental, personal, career, work) stores its entire weekly state as one JSON blob in `public.user_data`. That works but is opaque to SQL — we can't filter, aggregate, index, or evolve fields safely. This plan replaces it with one schema per feature, each with proper columns, foreign keys, and RLS.

## Tables to create

All tables: `user_id uuid not null` (references `auth.users` logically — no FK, per project rules), `created_at`, `updated_at` with `touch_updated_at` trigger, RLS `auth.uid() = user_id` for select/insert/update/delete, and an index on `user_id` (plus extras noted).

### Fitness (3 tables)
- **`fitness_days`** — one row per (user_id, weekday)
  - `weekday` (enum `weekday_enum`: Mon…Sun), `type` (enum `workout_type`: Strength, Hypertrophy, Cardio, Rest), `summary text`
  - unique `(user_id, weekday)`
- **`fitness_lifts`** — child of `fitness_days`
  - `day_id uuid` FK, `position int`, `body_part text`, `name text`, `reps int`, `weight numeric(6,2)`, `seat text`
- **`fitness_cardio`** — child of `fitness_days`
  - `day_id uuid` FK, `position int`, `name text`, `pace text`, `duration_min int`, `bpm int`

### Meals (2 tables)
- **`meal_days`** — `(user_id, weekday) unique`, `calorie_goal int default 2200`
- **`meal_entries`** — `day_id` FK, `position int`, `name text`, `calories int`, `protein_g int`, `carb_g int`, `fat_g int`

### Sleep (2 tables)
- **`sleep_days`** — `(user_id, weekday) unique`, `bedtime time`, `wake_time time`
- **`sleep_interruptions`** — `day_id` FK, `position int`, `at time`, `reason text`

### Mental health (3 tables)
- **`mental_days`** — `(user_id, weekday) unique`, `happiness smallint check 1..10`, `productivity smallint check 1..10`, `stress smallint check 1..10`, `therapy text`, `notes text`
- **`mental_actions`** — `day_id` FK, `position int`, `text text`, `done bool`

### Goals & tasks (shared by Personal / Career / Work) (2 tables)
- **`life_goals`** — `area text check in ('personal','career','work')`, `title text`, `horizon text`, `progress smallint check 0..100`, `notes text`, `position int`
  - index `(user_id, area)`
- **`life_tasks`** — `area text` (same check), `bucket text check in ('this_week','later')`, `text text`, `done bool`, `position int`
  - index `(user_id, area, bucket)`

Total: **12 new tables**, 2 enums (`weekday_enum`, `workout_type`), 1 reused trigger function (`touch_updated_at` already exists).

## Why this shape

- One row per (user, weekday) for the day-keyed features matches the UI exactly and lets us upsert a single day cheaply.
- Children (lifts, cardio, meals, interruptions, actions) are separate rows so we can add/remove/reorder without rewriting a JSON document, and so future features (history, charts, weekly trends) can aggregate with SQL.
- Personal/Career/Work share `life_goals` + `life_tasks` with an `area` discriminator — they're structurally identical and this avoids 6 near-duplicate tables.
- Enums for `weekday` and `workout_type` keep values constrained without check-constraint maintenance.
- Validation lives in CHECK constraints for static ranges (1..10, 0..100) — these are immutable, which is the safe case for CHECK per project rules.

## Code changes (after migration approval)

1. Regenerate `src/integrations/supabase/types.ts` (automatic).
2. Replace `src/lib/user-data.functions.ts` with feature-specific server functions:
   - `fitness.functions.ts` — `getFitnessWeek`, `upsertFitnessDay`, `addLift/updateLift/deleteLift`, `addCardio/updateCardio/deleteCardio`
   - `meals.functions.ts` — `getMealsWeek`, `updateMealDay`, `addMeal/updateMeal/deleteMeal`
   - `sleep.functions.ts` — analogous
   - `mental.functions.ts` — analogous + `addAction/updateAction/deleteAction`
   - `goals.functions.ts` — `getBoard(area)`, goal + task CRUD
3. Refactor each route (`fitness.tsx`, `meals.tsx`, `sleep.tsx`, `mental.tsx`, `personal.tsx`, `career.tsx`, `work.tsx`) and `goals-and-tasks.tsx` to call the new server fns instead of `useUserData`. Use TanStack Query (`useQuery` + `useMutation` with optimistic updates) so per-row edits don't refetch the whole week.
4. Backfill: write a one-shot server fn that reads existing `user_data` rows for the signed-in user and inserts into the new tables, then deletes the old rows. Triggered automatically on first load of each page (idempotent: skip if normalized rows already exist).
5. Drop `public.user_data` table after backfill is verified (separate follow-up migration so we can roll back).
6. Delete `src/lib/storage.ts` `useUserData` once nothing references it.

## Open questions

1. Are you OK sharing one `life_goals` + `life_tasks` table across Personal / Career / Work via an `area` column, or do you want three separate table pairs?
2. Should the backfill run automatically on first load, or do you want a one-time migration script you trigger explicitly?
3. Drop `user_data` immediately after backfill, or keep it around for one release as a safety net?

Reply with answers (or "go ahead with defaults: shared goals tables, automatic backfill, keep `user_data` for one release") and I'll write the migration + code.
