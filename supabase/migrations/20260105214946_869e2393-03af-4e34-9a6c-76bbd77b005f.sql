-- Add is_presave column to bio_links
ALTER TABLE public.bio_links ADD COLUMN is_presave BOOLEAN NOT NULL DEFAULT false;

-- Add presave fields to bio_profiles
ALTER TABLE public.bio_profiles 
ADD COLUMN presave_mode BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN presave_release_date DATE,
ADD COLUMN presave_isrc TEXT,
ADD COLUMN presave_spotify_uri TEXT;

-- Create presave_queue table
CREATE TABLE public.presave_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  user_spotify_id TEXT NOT NULL,
  user_refresh_token TEXT,
  song_isrc TEXT NOT NULL,
  release_date DATE NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presave_queue ENABLE ROW LEVEL SECURITY;

-- Policies for presave_queue
-- Artists can view presaves for their own profiles
CREATE POLICY "Artists can view their presaves"
ON public.presave_queue FOR SELECT
USING (
  profile_id IN (SELECT id FROM public.bio_profiles WHERE user_id = auth.uid())
);

-- Anyone can insert a presave (fans signing up)
CREATE POLICY "Anyone can create a presave"
ON public.presave_queue FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_presave_queue_profile ON public.presave_queue(profile_id);
CREATE INDEX idx_presave_queue_release_date ON public.presave_queue(release_date) WHERE processed = false;