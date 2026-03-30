-- Enable public read access for photo carousel analysis (matching video_analysis table)
CREATE POLICY "Anyone can view photo carousel analyses"
ON "Analysis Profile - photo_carousel_analysis"
FOR SELECT
USING (true);