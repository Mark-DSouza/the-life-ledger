-- Global per-user preferences. weight_unit applies to the weight field on all
-- lift Exercises; it is a single user-level setting, not a per-exercise column.

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY,
  weight_unit text NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_touch BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
