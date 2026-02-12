-- Create table for storing generated marketing creatives
CREATE TABLE public.marketing_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.marketing_ideas(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  transparent_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;

-- Allow public access (same as marketing_ideas)
CREATE POLICY "Allow public read access to marketing_creatives"
  ON public.marketing_creatives FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to marketing_creatives"
  ON public.marketing_creatives FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to marketing_creatives"
  ON public.marketing_creatives FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to marketing_creatives"
  ON public.marketing_creatives FOR DELETE
  USING (true);

-- Add index for faster lookups by idea
CREATE INDEX idx_marketing_creatives_idea_id ON public.marketing_creatives(idea_id);