-- Add category column to kuba_base_images for different asset types
ALTER TABLE public.kuba_base_images 
ADD COLUMN category text NOT NULL DEFAULT 'face';

-- Add comment for documentation
COMMENT ON COLUMN public.kuba_base_images.category IS 'Type of image: face, mockup, graphic, photo, other';