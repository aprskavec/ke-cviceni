
CREATE TABLE public.component_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  file_path text NOT NULL,
  source_code text NOT NULL,
  category text NOT NULL DEFAULT 'practice',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.component_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read component sources" ON public.component_sources FOR SELECT USING (true);
CREATE POLICY "Anyone can insert component sources" ON public.component_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update component sources" ON public.component_sources FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete component sources" ON public.component_sources FOR DELETE USING (true);

CREATE TRIGGER update_component_sources_updated_at
  BEFORE UPDATE ON public.component_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_component_sources_category ON public.component_sources(category);
