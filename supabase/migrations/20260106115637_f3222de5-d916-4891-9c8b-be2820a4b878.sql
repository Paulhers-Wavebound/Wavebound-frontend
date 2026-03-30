-- Create pre_release_subscribers table for email signups
CREATE TABLE public.pre_release_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  song_title TEXT,
  profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.pre_release_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can subscribe to pre-release" 
ON public.pre_release_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Only profile owners can view their subscribers
CREATE POLICY "Profile owners can view their subscribers" 
ON public.pre_release_subscribers 
FOR SELECT 
USING (
  profile_id IN (
    SELECT id FROM public.bio_profiles WHERE user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_pre_release_subscribers_profile_id ON public.pre_release_subscribers(profile_id);
CREATE INDEX idx_pre_release_subscribers_email ON public.pre_release_subscribers(email);