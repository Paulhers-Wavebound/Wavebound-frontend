-- Drop the restrictive policy on Assets - Reels
DROP POLICY IF EXISTS "Allow public read " ON "0.1. Table 4.2 - Assets - Reels";

-- Create a proper PERMISSIVE policy for public read access
CREATE POLICY "Allow public read access"
ON "0.1. Table 4.2 - Assets - Reels"
FOR SELECT
USING (true);

-- Also fix the same issue on other assets tables if they have the same problem
DROP POLICY IF EXISTS "Allow public read " ON "0.1. Table 4 - Assets - TikTok";
CREATE POLICY "Allow public read access"
ON "0.1. Table 4 - Assets - TikTok"
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public read " ON "0.1. Table 4.1 - Assets - PC - TikTok";
CREATE POLICY "Allow public read access"
ON "0.1. Table 4.1 - Assets - PC - TikTok"
FOR SELECT
USING (true);