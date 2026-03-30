-- Add is_favorite column to content_plans table
ALTER TABLE public.content_plans 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster favorite queries
CREATE INDEX idx_content_plans_favorite ON public.content_plans(user_id, is_favorite) WHERE is_favorite = true;