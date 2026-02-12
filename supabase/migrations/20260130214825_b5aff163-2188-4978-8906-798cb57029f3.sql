-- Fix RLS policies for marketing_ideas - they were created as RESTRICTIVE instead of PERMISSIVE
DROP POLICY IF EXISTS "Anyone can read marketing ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Anyone can insert marketing ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Anyone can update marketing ideas" ON public.marketing_ideas;
DROP POLICY IF EXISTS "Anyone can delete marketing ideas" ON public.marketing_ideas;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Anyone can read marketing ideas"
  ON public.marketing_ideas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert marketing ideas"
  ON public.marketing_ideas FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update marketing ideas"
  ON public.marketing_ideas FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete marketing ideas"
  ON public.marketing_ideas FOR DELETE
  TO public
  USING (true);