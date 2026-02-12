-- Job queue for image generation
CREATE TABLE public.generation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idiom_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index for efficient queue processing
CREATE INDEX idx_generation_queue_status ON public.generation_queue(status, created_at);
CREATE INDEX idx_generation_queue_idiom ON public.generation_queue(idiom_id);

-- Enable RLS
ALTER TABLE public.generation_queue ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view queue" ON public.generation_queue FOR SELECT USING (true);
CREATE POLICY "Anyone can insert to queue" ON public.generation_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update queue" ON public.generation_queue FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete from queue" ON public.generation_queue FOR DELETE USING (true);