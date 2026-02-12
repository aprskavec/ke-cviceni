-- Add notes field to marketing_ideas table
ALTER TABLE public.marketing_ideas 
ADD COLUMN notes text DEFAULT '';