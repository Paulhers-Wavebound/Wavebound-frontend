-- Create table for saved TikTok profile analyses
CREATE TABLE IF NOT EXISTS public.saved_profile_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id BIGINT NOT NULL,
  handle TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES public."Analysis Profile - analysis_jobs"(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.saved_profile_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see and manage their own saved analyses
CREATE POLICY "Users can view their own saved analyses"
  ON public.saved_profile_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved analyses"
  ON public.saved_profile_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved analyses"
  ON public.saved_profile_analyses
  FOR DELETE
  USING (auth.uid() = user_id);