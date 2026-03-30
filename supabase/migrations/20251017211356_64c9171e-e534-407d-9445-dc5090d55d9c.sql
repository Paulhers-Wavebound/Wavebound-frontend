-- Add user_query column to user_uploaded_videos
ALTER TABLE public.user_uploaded_videos 
ADD COLUMN IF NOT EXISTS user_query text;

-- Create enum for analysis status
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create video_analysis_results table
CREATE TABLE IF NOT EXISTS public.video_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.user_uploaded_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status analysis_status NOT NULL DEFAULT 'pending',
  category_style text,
  genre text,
  hooks_captions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_analysis_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analysis results"
  ON public.video_analysis_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis results"
  ON public.video_analysis_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis results"
  ON public.video_analysis_results FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON public.video_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_analysis_results;