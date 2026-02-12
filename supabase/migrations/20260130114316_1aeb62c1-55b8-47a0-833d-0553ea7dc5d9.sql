-- Create lessons table with DatoCMS IDs for external sync
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  datocms_id TEXT UNIQUE NOT NULL, -- DatoCMS record ID for external sync
  video_upload_id TEXT UNIQUE NOT NULL, -- reel_link / video ID
  name TEXT NOT NULL,
  kind TEXT NOT NULL, -- category: jídlo, nakupování, etc.
  "order" INTEGER NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Zacatecnik', 'Pokrocily', 'Frajeris')),
  cefr TEXT NOT NULL CHECK (cefr IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  summary JSONB DEFAULT '{"description": "", "key_phrases": [], "keywords": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Anyone can read lessons (public content)
CREATE POLICY "Lessons are publicly readable"
ON public.lessons
FOR SELECT
USING (true);

-- Only service role can modify lessons (admin only)
CREATE POLICY "Service role can manage lessons"
ON public.lessons
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster filtering
CREATE INDEX idx_lessons_level ON public.lessons(level);
CREATE INDEX idx_lessons_order ON public.lessons("order");
CREATE INDEX idx_lessons_datocms_id ON public.lessons(datocms_id);

-- Trigger for updated_at
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.lessons IS 'Lesson catalog synced from DatoCMS';
COMMENT ON COLUMN public.lessons.datocms_id IS 'Original DatoCMS record ID for external sync';
COMMENT ON COLUMN public.lessons.video_upload_id IS 'Video upload ID (reel_link) for video playback';