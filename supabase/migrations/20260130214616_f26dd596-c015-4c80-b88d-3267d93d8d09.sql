-- Create marketing_ideas table for persisting banner ideas
CREATE TABLE public.marketing_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  target_format text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'idea',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_ideas ENABLE ROW LEVEL SECURITY;

-- Anyone can read ideas (no auth in this app)
CREATE POLICY "Anyone can read marketing ideas"
  ON public.marketing_ideas FOR SELECT
  USING (true);

-- Anyone can insert ideas
CREATE POLICY "Anyone can insert marketing ideas"
  ON public.marketing_ideas FOR INSERT
  WITH CHECK (true);

-- Anyone can update ideas
CREATE POLICY "Anyone can update marketing ideas"
  ON public.marketing_ideas FOR UPDATE
  USING (true);

-- Anyone can delete ideas
CREATE POLICY "Anyone can delete marketing ideas"
  ON public.marketing_ideas FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_marketing_ideas_updated_at
  BEFORE UPDATE ON public.marketing_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();