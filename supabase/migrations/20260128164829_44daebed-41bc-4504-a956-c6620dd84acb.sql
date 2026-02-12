-- Create table to cache generated exercises for lessons
CREATE TABLE public.lesson_exercises_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  lesson_name TEXT NOT NULL,
  exercises JSONB NOT NULL,
  lesson_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Unique constraint on lesson_id to prevent duplicates
  CONSTRAINT unique_lesson_exercises UNIQUE (lesson_id)
);

-- Enable RLS (public read, no auth required for this cache)
ALTER TABLE public.lesson_exercises_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached exercises
CREATE POLICY "Anyone can read cached exercises" 
ON public.lesson_exercises_cache 
FOR SELECT 
USING (true);

-- Allow service role to insert/update (edge function will handle this)
CREATE POLICY "Service role can manage exercises cache" 
ON public.lesson_exercises_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_lesson_exercises_lesson_id ON public.lesson_exercises_cache(lesson_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_exercises_cache_updated_at
BEFORE UPDATE ON public.lesson_exercises_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();