-- Create bio_profiles table
CREATE TABLE public.bio_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio_name TEXT,
  bio_text TEXT,
  profile_image_url TEXT,
  theme_settings JSONB DEFAULT '{"primaryColor": "#6366f1", "backgroundColor": "#0f172a", "textColor": "#ffffff", "fontFamily": "Inter"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bio_links table
CREATE TABLE public.bio_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  platform_type TEXT DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;

-- Bio profiles policies
CREATE POLICY "Users can view their own bio profile" 
ON public.bio_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bio profile" 
ON public.bio_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bio profile" 
ON public.bio_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bio profile" 
ON public.bio_profiles FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view bio profiles by slug" 
ON public.bio_profiles FOR SELECT 
USING (true);

-- Bio links policies
CREATE POLICY "Users can manage links for their own profile" 
ON public.bio_links FOR ALL 
USING (
  profile_id IN (SELECT id FROM public.bio_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Anyone can view active links" 
ON public.bio_links FOR SELECT 
USING (is_active = true);

-- Function to increment click count (callable by anyone)
CREATE OR REPLACE FUNCTION public.increment_link_click(link_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.bio_links 
  SET click_count = click_count + 1 
  WHERE id = link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_bio_profiles_updated_at
BEFORE UPDATE ON public.bio_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_bio_profiles_slug ON public.bio_profiles(slug);
CREATE INDEX idx_bio_links_profile_id ON public.bio_links(profile_id);