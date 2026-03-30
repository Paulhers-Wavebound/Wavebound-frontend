-- Enable public read access to Analysis Profile - Profiles table
CREATE POLICY "Anyone can view profile data"
ON "Analysis Profile - Profiles"
FOR SELECT
USING (true);