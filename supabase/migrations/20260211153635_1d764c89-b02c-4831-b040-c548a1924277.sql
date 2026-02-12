
-- Dev assistant conversations
CREATE TABLE public.dev_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  page_context text NOT NULL DEFAULT '',
  lesson_context jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dev conversations" ON public.dev_conversations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert dev conversations" ON public.dev_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update dev conversations" ON public.dev_conversations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete dev conversations" ON public.dev_conversations FOR DELETE USING (true);

-- Dev assistant messages
CREATE TABLE public.dev_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.dev_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dev messages" ON public.dev_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert dev messages" ON public.dev_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete dev messages" ON public.dev_messages FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_dev_conversations_updated_at
  BEFORE UPDATE ON public.dev_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
