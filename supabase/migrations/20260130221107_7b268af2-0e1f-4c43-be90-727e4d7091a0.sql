-- Create storage bucket for kuba base images
INSERT INTO storage.buckets (id, name, public)
VALUES ('kuba-originals', 'kuba-originals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for kuba-originals bucket
CREATE POLICY "Anyone can view kuba originals"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'kuba-originals');

CREATE POLICY "Anyone can upload kuba originals"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'kuba-originals');

CREATE POLICY "Anyone can delete kuba originals"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'kuba-originals');

-- Create table for tracking uploaded kuba images
CREATE TABLE public.kuba_base_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kuba_base_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read kuba base images"
  ON public.kuba_base_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert kuba base images"
  ON public.kuba_base_images FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete kuba base images"
  ON public.kuba_base_images FOR DELETE
  TO public
  USING (true);