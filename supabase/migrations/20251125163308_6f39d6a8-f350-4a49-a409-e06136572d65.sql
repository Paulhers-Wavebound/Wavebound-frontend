-- Create favorite_folders table
CREATE TABLE IF NOT EXISTS public.favorite_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id to user_favorites
ALTER TABLE public.user_favorites 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.favorite_folders(id) ON DELETE SET NULL;

-- Add order column for manual sorting
ALTER TABLE public.user_favorites 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.favorite_folders ENABLE ROW LEVEL SECURITY;

-- Folder policies: users can only manage their own folders
CREATE POLICY "Users can view own folders"
  ON public.favorite_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.favorite_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.favorite_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.favorite_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_favorite_folders_user_id ON public.favorite_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_folder_id ON public.user_favorites(folder_id);