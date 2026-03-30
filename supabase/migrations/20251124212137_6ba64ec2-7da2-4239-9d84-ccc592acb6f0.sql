-- Create oembed_cache table for caching TikTok oEmbed data
CREATE TABLE IF NOT EXISTS public.oembed_cache (
  video_id TEXT PRIMARY KEY,
  thumbnail_url TEXT,
  embed_html TEXT,
  author_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.oembed_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (thumbnails are public content from TikTok)
CREATE POLICY "Public read access to oembed cache"
  ON public.oembed_cache
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update cache
CREATE POLICY "Authenticated users can update oembed cache"
  ON public.oembed_cache
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oembed_cache_updated_at ON public.oembed_cache(updated_at);