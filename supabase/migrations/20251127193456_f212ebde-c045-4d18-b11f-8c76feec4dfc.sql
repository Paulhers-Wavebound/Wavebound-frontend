-- Add SELECT policy for Analysis Profile 2 - analysis_jobs
CREATE POLICY "Anyone can view analysis jobs"
ON public."Analysis Profile 2 - analysis_jobs"
FOR SELECT
USING (true);