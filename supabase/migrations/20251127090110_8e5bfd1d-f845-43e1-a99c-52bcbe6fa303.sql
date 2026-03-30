-- Create table to track user analysis limits
CREATE TABLE public.user_analysis_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  analysis_type text NOT NULL, -- 'content' or 'profile'
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_analysis_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.user_analysis_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own usage"
ON public.user_analysis_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient counting
CREATE INDEX idx_user_analysis_usage_user_type ON public.user_analysis_usage(user_id, analysis_type);