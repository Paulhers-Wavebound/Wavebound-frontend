-- Add sub_genre column to video_analysis_results table
ALTER TABLE public.video_analysis_results
ADD COLUMN IF NOT EXISTS sub_genre text;