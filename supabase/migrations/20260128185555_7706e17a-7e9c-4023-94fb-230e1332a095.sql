-- Create table for storing sticker variants
CREATE TABLE public.sticker_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  image_url TEXT NOT NULL,
  lesson_name TEXT,
  lesson_kind TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by word
CREATE INDEX idx_sticker_variants_word ON public.sticker_variants(word);

-- Create composite index for word + lesson context
CREATE INDEX idx_sticker_variants_word_lesson ON public.sticker_variants(word, lesson_name, lesson_kind);

-- Enable RLS
ALTER TABLE public.sticker_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access (stickers are not user-specific)
CREATE POLICY "Anyone can view sticker variants"
ON public.sticker_variants
FOR SELECT
USING (true);

-- Allow public insert (edge functions insert without auth)
CREATE POLICY "Anyone can insert sticker variants"
ON public.sticker_variants
FOR INSERT
WITH CHECK (true);

-- Allow public update for is_selected flag
CREATE POLICY "Anyone can update sticker variants"
ON public.sticker_variants
FOR UPDATE
USING (true);