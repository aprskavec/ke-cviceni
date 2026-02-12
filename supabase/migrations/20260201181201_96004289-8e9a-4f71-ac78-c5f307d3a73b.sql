-- Add inspiration image field to marketing_ideas
ALTER TABLE public.marketing_ideas 
ADD COLUMN inspiration_image_url text DEFAULT NULL;