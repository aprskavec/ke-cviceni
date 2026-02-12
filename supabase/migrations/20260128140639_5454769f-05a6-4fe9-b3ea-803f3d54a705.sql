-- Allow anyone to delete prompt learnings
CREATE POLICY "Anyone can delete prompt learnings" 
ON public.prompt_learnings 
FOR DELETE 
USING (true);