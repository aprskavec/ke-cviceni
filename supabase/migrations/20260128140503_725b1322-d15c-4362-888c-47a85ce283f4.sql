-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing successful prompt learnings
CREATE TABLE public.prompt_learnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback TEXT NOT NULL,
  word TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  success_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public read/write for this learning feature)
ALTER TABLE public.prompt_learnings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read learnings
CREATE POLICY "Anyone can read prompt learnings" 
ON public.prompt_learnings 
FOR SELECT 
USING (true);

-- Allow anyone to insert learnings (from edge function)
CREATE POLICY "Anyone can insert prompt learnings" 
ON public.prompt_learnings 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update learnings (increment success_count)
CREATE POLICY "Anyone can update prompt learnings" 
ON public.prompt_learnings 
FOR UPDATE 
USING (true);

-- Create unique constraint on feedback to avoid duplicates
CREATE UNIQUE INDEX idx_prompt_learnings_feedback ON public.prompt_learnings(LOWER(feedback));

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_learnings_updated_at
BEFORE UPDATE ON public.prompt_learnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();