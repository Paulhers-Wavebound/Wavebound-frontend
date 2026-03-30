-- Ensure tiktok_videos_all is publicly readable (it should already have this)
DROP POLICY IF EXISTS "Public can view tiktok videos" ON tiktok_videos_all;
CREATE POLICY "Public can view tiktok videos" ON tiktok_videos_all
FOR SELECT
TO public
USING (true);

-- Ensure media_assets_gif_thumbnail is publicly readable  
DROP POLICY IF EXISTS "Public can view gif thumbnails" ON media_assets_gif_thumbnail;
CREATE POLICY "Public can view gif thumbnails" ON media_assets_gif_thumbnail
FOR SELECT
TO public
USING (true);