-- Create shared_content_plans table for publicly accessible shared plans
CREATE TABLE IF NOT EXISTS public.shared_content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.content_plans(id) ON DELETE CASCADE,
  share_id text NOT NULL UNIQUE,
  view_count integer NOT NULL DEFAULT 0,
  plan_data jsonb NOT NULL,
  plan_name text NOT NULL
);

-- Enable RLS
ALTER TABLE public.shared_content_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for shared plans
CREATE POLICY "Anyone can view shared plans"
  ON public.shared_content_plans
  FOR SELECT
  USING (true);

-- Users can create their own shared plans
CREATE POLICY "Users can create their own shared plans"
  ON public.shared_content_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared plans
CREATE POLICY "Users can update their own shared plans"
  ON public.shared_content_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own shared plans
CREATE POLICY "Users can delete their own shared plans"
  ON public.shared_content_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster share_id lookups
CREATE INDEX idx_shared_content_plans_share_id ON public.shared_content_plans(share_id);

-- Create index for user_id lookups
CREATE INDEX idx_shared_content_plans_user_id ON public.shared_content_plans(user_id);