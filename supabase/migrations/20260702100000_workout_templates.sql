-- Template catalog for the fitness Onboarding Flow and Change Plan picker.
-- A Workout Plan Template is a fully-specified weekly schedule. Public
-- templates (is_public = true, owner_user_id null) are inserted by admins and
-- visible to everyone; Personal Templates belong to a single user.

CREATE TYPE public.workout_goal AS ENUM ('Hypertrophy', 'Cardio');

CREATE TABLE public.workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal workout_goal NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (is_public AND owner_user_id IS NULL)
    OR (NOT is_public AND owner_user_id IS NOT NULL)
  )
);
CREATE INDEX idx_workout_templates_owner ON public.workout_templates(owner_user_id);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public or own select" ON public.workout_templates FOR SELECT
  USING (is_public OR owner_user_id = auth.uid());
CREATE POLICY "own insert" ON public.workout_templates FOR INSERT
  WITH CHECK (NOT is_public AND owner_user_id = auth.uid());
CREATE POLICY "own update" ON public.workout_templates FOR UPDATE
  USING (owner_user_id = auth.uid());
CREATE POLICY "own delete" ON public.workout_templates FOR DELETE
  USING (owner_user_id = auth.uid());
CREATE TRIGGER trg_workout_templates_touch BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.workout_template_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  weekday weekday_enum NOT NULL,
  type workout_type NOT NULL DEFAULT 'Rest',
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, weekday)
);
CREATE INDEX idx_workout_template_days_template ON public.workout_template_days(template_id);
ALTER TABLE public.workout_template_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "via template select" ON public.workout_template_days FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates t
    WHERE t.id = template_id AND (t.is_public OR t.owner_user_id = auth.uid())
  ));
CREATE POLICY "via template insert" ON public.workout_template_days FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_templates t
    WHERE t.id = template_id AND t.owner_user_id = auth.uid()
  ));
CREATE POLICY "via template update" ON public.workout_template_days FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates t
    WHERE t.id = template_id AND t.owner_user_id = auth.uid()
  ));
CREATE POLICY "via template delete" ON public.workout_template_days FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_templates t
    WHERE t.id = template_id AND t.owner_user_id = auth.uid()
  ));
CREATE TRIGGER trg_workout_template_days_touch BEFORE UPDATE ON public.workout_template_days
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Mirrors fitness_exercises, keyed by template day. Ownership lives on the
-- workout_templates row, so there is no user_id column here.
CREATE TABLE public.workout_template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_day_id uuid NOT NULL REFERENCES public.workout_template_days(id) ON DELETE CASCADE,
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
CREATE INDEX idx_workout_template_exercises_day ON public.workout_template_exercises(template_day_id);
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "via template select" ON public.workout_template_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON t.id = d.template_id
    WHERE d.id = template_day_id AND (t.is_public OR t.owner_user_id = auth.uid())
  ));
CREATE POLICY "via template insert" ON public.workout_template_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON t.id = d.template_id
    WHERE d.id = template_day_id AND t.owner_user_id = auth.uid()
  ));
CREATE POLICY "via template update" ON public.workout_template_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON t.id = d.template_id
    WHERE d.id = template_day_id AND t.owner_user_id = auth.uid()
  ));
CREATE POLICY "via template delete" ON public.workout_template_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workout_template_days d
    JOIN public.workout_templates t ON t.id = d.template_id
    WHERE d.id = template_day_id AND t.owner_user_id = auth.uid()
  ));
CREATE TRIGGER trg_workout_template_exercises_touch BEFORE UPDATE ON public.workout_template_exercises
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
