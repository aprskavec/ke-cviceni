-- Create table for storing face analysis results
CREATE TABLE public.face_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id TEXT NOT NULL,
  image_name TEXT NOT NULL,
  image_src TEXT NOT NULL,
  primary_emotion TEXT NOT NULL,
  secondary_tag TEXT NOT NULL,
  energy_level TEXT NOT NULL,
  facial_description TEXT NOT NULL,
  marketing_use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_fit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(image_id)
);

-- Enable RLS
ALTER TABLE public.face_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read face analyses"
  ON public.face_analyses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert face analyses"
  ON public.face_analyses FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update face analyses"
  ON public.face_analyses FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete face analyses"
  ON public.face_analyses FOR DELETE
  TO public
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_face_analyses_updated_at
  BEFORE UPDATE ON public.face_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();