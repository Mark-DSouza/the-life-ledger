CREATE TABLE public.offloader_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.offloader_items(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offloader_items TO authenticated;
GRANT ALL ON public.offloader_items TO service_role;
CREATE INDEX idx_offloader_items_user ON public.offloader_items(user_id);
CREATE INDEX idx_offloader_items_parent ON public.offloader_items(parent_id);
CREATE INDEX idx_offloader_items_user_parent_position
  ON public.offloader_items(user_id, parent_id, position);
ALTER TABLE public.offloader_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.offloader_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.offloader_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.offloader_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.offloader_items FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_offloader_items_touch BEFORE UPDATE ON public.offloader_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();