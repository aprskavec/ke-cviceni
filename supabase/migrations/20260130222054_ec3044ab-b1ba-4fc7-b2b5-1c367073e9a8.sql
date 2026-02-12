-- Add extended emotional and directional analysis columns to face_analyses
ALTER TABLE public.face_analyses
ADD COLUMN IF NOT EXISTS mouth_state text DEFAULT 'closed',
ADD COLUMN IF NOT EXISTS eye_expression text DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS expression_intensity integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS sarcasm_level text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS gaze_direction text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS chin_direction text DEFAULT 'center';

-- Add comments for documentation
COMMENT ON COLUMN public.face_analyses.mouth_state IS 'State of mouth: closed, open, screaming, smiling, speaking';
COMMENT ON COLUMN public.face_analyses.eye_expression IS 'Eye expression: neutral, skeptical, excited, angry, surprised, tired, focused';
COMMENT ON COLUMN public.face_analyses.expression_intensity IS 'Intensity of expression from 1 (subtle) to 10 (extreme)';
COMMENT ON COLUMN public.face_analyses.sarcasm_level IS 'Level of sarcasm: none, mild, heavy';
COMMENT ON COLUMN public.face_analyses.gaze_direction IS 'Where eyes are looking: left, right, center, up, down, camera';
COMMENT ON COLUMN public.face_analyses.chin_direction IS 'Where chin/head is pointing: left, right, center, up, down';