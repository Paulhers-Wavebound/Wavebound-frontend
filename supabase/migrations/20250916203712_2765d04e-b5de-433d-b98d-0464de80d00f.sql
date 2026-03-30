-- Add archived functionality to content_plans table
ALTER TABLE public.content_plans 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance on archived plans
CREATE INDEX idx_content_plans_archived_at ON public.content_plans(archived_at);

-- Create function to permanently delete archived plans older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_archived_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.content_plans 
    WHERE archived_at IS NOT NULL 
    AND archived_at < (now() - interval '7 days');
END;
$$;