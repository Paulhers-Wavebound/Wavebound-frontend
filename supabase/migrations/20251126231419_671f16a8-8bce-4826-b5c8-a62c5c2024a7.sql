-- Enable Row Level Security on Analysis Profile - sound_analysis table
ALTER TABLE "Analysis Profile - sound_analysis" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view sound analysis data
CREATE POLICY "Anyone can view sound analyses"
ON "Analysis Profile - sound_analysis"
FOR SELECT
USING (true);

-- Add comment explaining the policy
COMMENT ON POLICY "Anyone can view sound analyses" ON "Analysis Profile - sound_analysis" 
IS 'Allows public read access to sound analysis data for profile analyses';