
-- Enums
CREATE TYPE public.weekday_enum AS ENUM ('Mon','Tue','Wed','Thu','Fri','Sat','Sun');
CREATE TYPE public.workout_type AS ENUM ('Strength','Hypertrophy','Cardio','Rest');
CREATE TYPE public.life_area AS ENUM ('personal','career','work');
CREATE TYPE public.task_bucket AS ENUM ('this_week','later');

-- ============ FITNESS ============
CREATE TABLE public.fitness_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekday weekday_enum NOT NULL,
  type workout_type NOT NULL DEFAULT 'Rest',
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday)
);
CREATE INDEX idx_fitness_days_user ON public.fitness_days(user_id);
ALTER TABLE public.fitness_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.fitness_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.fitness_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.fitness_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.fitness_days FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_fitness_days_touch BEFORE UPDATE ON public.fitness_days
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.fitness_lifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.fitness_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  body_part text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  reps int NOT NULL DEFAULT 0,
  weight numeric(6,2) NOT NULL DEFAULT 0,
  seat text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fitness_lifts_day ON public.fitness_lifts(day_id);
CREATE INDEX idx_fitness_lifts_user ON public.fitness_lifts(user_id);
ALTER TABLE public.fitness_lifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.fitness_lifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.fitness_lifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.fitness_lifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.fitness_lifts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_fitness_lifts_touch BEFORE UPDATE ON public.fitness_lifts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.fitness_cardio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.fitness_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  name text NOT NULL DEFAULT '',
  pace text NOT NULL DEFAULT '',
  duration_min int NOT NULL DEFAULT 0,
  bpm int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fitness_cardio_day ON public.fitness_cardio(day_id);
CREATE INDEX idx_fitness_cardio_user ON public.fitness_cardio(user_id);
ALTER TABLE public.fitness_cardio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.fitness_cardio FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.fitness_cardio FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.fitness_cardio FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.fitness_cardio FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_fitness_cardio_touch BEFORE UPDATE ON public.fitness_cardio
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MEALS ============
CREATE TABLE public.meal_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekday weekday_enum NOT NULL,
  calorie_goal int NOT NULL DEFAULT 2200,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday)
);
CREATE INDEX idx_meal_days_user ON public.meal_days(user_id);
ALTER TABLE public.meal_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meal_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meal_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meal_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meal_days FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_meal_days_touch BEFORE UPDATE ON public.meal_days
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.meal_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  name text NOT NULL DEFAULT '',
  calories int NOT NULL DEFAULT 0,
  protein_g int NOT NULL DEFAULT 0,
  carb_g int NOT NULL DEFAULT 0,
  fat_g int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_meal_entries_day ON public.meal_entries(day_id);
CREATE INDEX idx_meal_entries_user ON public.meal_entries(user_id);
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meal_entries FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_meal_entries_touch BEFORE UPDATE ON public.meal_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SLEEP ============
CREATE TABLE public.sleep_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekday weekday_enum NOT NULL,
  bedtime time NOT NULL DEFAULT '23:00',
  wake_time time NOT NULL DEFAULT '07:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday)
);
CREATE INDEX idx_sleep_days_user ON public.sleep_days(user_id);
ALTER TABLE public.sleep_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.sleep_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.sleep_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.sleep_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.sleep_days FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sleep_days_touch BEFORE UPDATE ON public.sleep_days
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.sleep_interruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.sleep_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  at time NOT NULL DEFAULT '03:00',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sleep_interruptions_day ON public.sleep_interruptions(day_id);
CREATE INDEX idx_sleep_interruptions_user ON public.sleep_interruptions(user_id);
ALTER TABLE public.sleep_interruptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.sleep_interruptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.sleep_interruptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.sleep_interruptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.sleep_interruptions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_sleep_interruptions_touch BEFORE UPDATE ON public.sleep_interruptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MENTAL ============
CREATE TABLE public.mental_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weekday weekday_enum NOT NULL,
  happiness smallint NOT NULL DEFAULT 7 CHECK (happiness BETWEEN 1 AND 10),
  productivity smallint NOT NULL DEFAULT 6 CHECK (productivity BETWEEN 1 AND 10),
  stress smallint NOT NULL DEFAULT 4 CHECK (stress BETWEEN 1 AND 10),
  therapy text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday)
);
CREATE INDEX idx_mental_days_user ON public.mental_days(user_id);
ALTER TABLE public.mental_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.mental_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.mental_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.mental_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.mental_days FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_mental_days_touch BEFORE UPDATE ON public.mental_days
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.mental_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.mental_days(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position int NOT NULL DEFAULT 0,
  text text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mental_actions_day ON public.mental_actions(day_id);
CREATE INDEX idx_mental_actions_user ON public.mental_actions(user_id);
ALTER TABLE public.mental_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.mental_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.mental_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.mental_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.mental_actions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_mental_actions_touch BEFORE UPDATE ON public.mental_actions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ GOALS / TASKS (personal, career, work) ============
CREATE TABLE public.life_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  area life_area NOT NULL,
  position int NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  horizon text NOT NULL DEFAULT '',
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_life_goals_user_area ON public.life_goals(user_id, area);
ALTER TABLE public.life_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.life_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.life_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.life_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.life_goals FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_life_goals_touch BEFORE UPDATE ON public.life_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.life_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  area life_area NOT NULL,
  bucket task_bucket NOT NULL,
  position int NOT NULL DEFAULT 0,
  text text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_life_tasks_user_area_bucket ON public.life_tasks(user_id, area, bucket);
ALTER TABLE public.life_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.life_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.life_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.life_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.life_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_life_tasks_touch BEFORE UPDATE ON public.life_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
