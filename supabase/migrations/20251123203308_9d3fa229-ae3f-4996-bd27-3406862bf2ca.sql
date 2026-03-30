-- Enable Row Level Security on the Analysis Profile - video_analysis table (if not already enabled)
ALTER TABLE "public"."Analysis Profile - video_analysis" ENABLE ROW LEVEL SECURITY;

-- Allow any client (authenticated or anon) to read video analysis rows
-- Access is still scoped by job_id in the application layer
CREATE POLICY "Anyone can view profile video analyses"
ON "public"."Analysis Profile - video_analysis"
FOR SELECT
USING (true);