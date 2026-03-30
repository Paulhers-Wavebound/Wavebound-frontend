-- Add duration column to user_uploaded_videos table
ALTER TABLE public.user_uploaded_videos 
ADD COLUMN duration real;