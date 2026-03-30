-- Create content_projects table for organizing plans into folders/projects
CREATE TABLE IF NOT EXISTS content_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add project_id to content_plans for folder organization
ALTER TABLE content_plans 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES content_projects(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_projects
CREATE POLICY "projects_read_own" ON content_projects FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "projects_insert_own" ON content_projects FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_update_own" ON content_projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "projects_delete_own" ON content_projects FOR DELETE USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_plans_project_id ON content_plans(project_id);
CREATE INDEX IF NOT EXISTS idx_content_projects_user_id ON content_projects(user_id);