
-- Remove the foreign key constraint that prevents storing instagram_idiom references
ALTER TABLE public.marketing_creatives 
DROP CONSTRAINT IF EXISTS marketing_creatives_idea_id_fkey;
