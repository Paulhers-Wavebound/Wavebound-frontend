-- Create storage bucket for user uploaded videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_videos', 'user_videos', false);

-- Create storage policies for user videos
CREATE POLICY "Users can upload their own videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user_videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own videos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user_videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user_videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create user_uploaded_videos table
CREATE TABLE public.user_uploaded_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_url text NOT NULL,
  storage_path text NOT NULL,
  content_category text NOT NULL,
  music_genre text NOT NULL,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_uploaded_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own uploaded videos"
ON public.user_uploaded_videos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploaded videos"
ON public.user_uploaded_videos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploaded videos"
ON public.user_uploaded_videos
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploaded videos"
ON public.user_uploaded_videos
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_uploaded_videos_updated_at
BEFORE UPDATE ON public.user_uploaded_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();