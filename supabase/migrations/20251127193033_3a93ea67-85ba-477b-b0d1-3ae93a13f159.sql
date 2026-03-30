-- Add UPDATE policy for saved_profile_analyses
CREATE POLICY "Users can update their own saved analyses"
ON public.saved_profile_analyses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);