-- Create storage bucket for vocabulary stickers
INSERT INTO storage.buckets (id, name, public)
VALUES ('vocabulary-stickers', 'vocabulary-stickers', true);

-- Allow public read access to stickers
CREATE POLICY "Public can view stickers"
ON storage.objects FOR SELECT
USING (bucket_id = 'vocabulary-stickers');

-- Allow authenticated users to upload stickers (for edge function with service role)
CREATE POLICY "Service role can upload stickers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vocabulary-stickers');

-- Create table to cache sticker URLs
CREATE TABLE public.vocabulary_stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vocabulary_stickers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view stickers"
ON public.vocabulary_stickers FOR SELECT
USING (true);

-- Allow insert from edge function (service role bypasses RLS)
CREATE POLICY "Service role can insert stickers"
ON public.vocabulary_stickers FOR INSERT
WITH CHECK (true);