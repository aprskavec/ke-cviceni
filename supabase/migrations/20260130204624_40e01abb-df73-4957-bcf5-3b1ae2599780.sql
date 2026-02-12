-- Create storage bucket for marketing inspiration images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-inspiration', 'marketing-inspiration', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public can view inspiration images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-inspiration');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload inspiration images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketing-inspiration');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own inspiration images"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketing-inspiration');

-- Create table to track inspiration uploads per idea
CREATE TABLE public.marketing_inspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_inspirations ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (no auth in marketing page)
CREATE POLICY "Anyone can view inspirations"
ON public.marketing_inspirations FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert inspirations"
ON public.marketing_inspirations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete inspirations"
ON public.marketing_inspirations FOR DELETE
USING (true);