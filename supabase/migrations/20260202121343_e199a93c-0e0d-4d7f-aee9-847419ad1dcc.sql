-- Create table for Instagram idiom ideas
CREATE TABLE public.instagram_idioms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL REFERENCES public.marketing_ideas(id) ON DELETE CASCADE,
  idiom TEXT NOT NULL,
  scene TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_idioms ENABLE ROW LEVEL SECURITY;

-- RLS policies - public access (same as other marketing tables)
CREATE POLICY "Anyone can read instagram idioms" 
  ON public.instagram_idioms FOR SELECT USING (true);

CREATE POLICY "Anyone can insert instagram idioms" 
  ON public.instagram_idioms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete instagram idioms" 
  ON public.instagram_idioms FOR DELETE USING (true);

CREATE POLICY "Anyone can update instagram idioms" 
  ON public.instagram_idioms FOR UPDATE USING (true);