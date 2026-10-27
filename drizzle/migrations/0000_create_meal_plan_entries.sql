CREATE TABLE public.meal_plan_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_entries TO authenticated;
GRANT ALL ON public.meal_plan_entries TO service_role;

ALTER TABLE public.meal_plan_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own plan entries"
  ON public.meal_plan_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own plan entries"
  ON public.meal_plan_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can move own plan entries"
  ON public.meal_plan_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own plan entries"
  ON public.meal_plan_entries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX meal_plan_entries_user_day_idx ON public.meal_plan_entries (user_id, day_of_week);