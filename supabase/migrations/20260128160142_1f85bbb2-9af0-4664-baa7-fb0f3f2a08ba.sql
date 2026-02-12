-- Create storage bucket for word audio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('word-audio', 'word-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Word audio is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'word-audio');

-- Create policy for service role to insert
CREATE POLICY "Service role can upload word audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'word-audio');

-- Create table to cache word -> audio URL mappings
CREATE TABLE IF NOT EXISTS public.word_audio_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  voice_id TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on word + language + voice
CREATE UNIQUE INDEX IF NOT EXISTS word_audio_cache_unique 
ON public.word_audio_cache (word, language, voice_id);

-- Enable RLS but allow public read (it's just cached audio)
ALTER TABLE public.word_audio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Word audio cache is publicly readable" 
ON public.word_audio_cache 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert word audio cache" 
ON public.word_audio_cache 
FOR INSERT 
WITH CHECK (true);