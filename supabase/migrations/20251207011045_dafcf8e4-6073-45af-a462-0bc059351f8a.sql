-- Add exclude_pinned column to analysis_jobs table to track if pinned posts were excluded
ALTER TABLE "Analysis Profile 2 - analysis_jobs" 
ADD COLUMN exclude_pinned boolean DEFAULT false;