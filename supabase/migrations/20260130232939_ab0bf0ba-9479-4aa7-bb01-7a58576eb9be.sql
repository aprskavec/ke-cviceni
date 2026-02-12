-- Add is_selected column to marketing_creatives
ALTER TABLE public.marketing_creatives 
ADD COLUMN is_selected BOOLEAN NOT NULL DEFAULT false;