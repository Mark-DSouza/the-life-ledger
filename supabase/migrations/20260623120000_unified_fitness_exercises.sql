-- Unify fitness_lifts + fitness_cardio into a single fitness_exercises table,
-- discriminated by exercise_type. See docs/adr/0001-unified-exercises-table.md.
-- Lift-only fields (body_part, sets, reps, weight, seat) are null on cardio rows;
-- cardio-only fields (pace, duration_min, bpm) are null on lift rows.
-- pace is stored as decimal minutes (e.g. 6.50 for 6:30/km); the UI labels it min/km.

CREATE TYPE public.exercise_type_enum AS ENUM ('lift', 'cardio');

CREATE TABLE public.fitness_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.fitness_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  exercise_type exercise_type_enum NOT NULL,
  name text NOT NULL DEFAULT '',
  -- lift-only fields
  body_part text,
  sets int,
  reps int,
  weight numeric(6, 2),
  seat text,
  -- cardio-only fields
  pace numeric(5, 2),
  duration_min int,
  bpm int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fitness_exercises_day ON public.fitness_exercises(day_id);
CREATE INDEX idx_fitness_exercises_user ON public.fitness_exercises(user_id);
ALTER TABLE public.fitness_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.fitness_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.fitness_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.fitness_exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.fitness_exercises FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_fitness_exercises_touch BEFORE UPDATE ON public.fitness_exercises
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- The split tables are replaced by fitness_exercises.
DROP TABLE public.fitness_lifts;
DROP TABLE public.fitness_cardio;
