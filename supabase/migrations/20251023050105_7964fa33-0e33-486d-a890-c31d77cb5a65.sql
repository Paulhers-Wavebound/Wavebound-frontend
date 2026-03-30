-- Create table for shared workspace notes
CREATE TABLE public.shared_workspace_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_id TEXT NOT NULL UNIQUE,
  notes_content TEXT NOT NULL,
  title TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_shared_workspace_notes_share_id ON public.shared_workspace_notes(share_id);
CREATE INDEX idx_shared_workspace_notes_user_id ON public.shared_workspace_notes(user_id);

-- Enable RLS
ALTER TABLE public.shared_workspace_notes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared notes (for public sharing)
CREATE POLICY "Anyone can view shared notes"
ON public.shared_workspace_notes
FOR SELECT
USING (true);

-- Users can create their own shared notes
CREATE POLICY "Users can create their own shared notes"
ON public.shared_workspace_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared notes
CREATE POLICY "Users can update their own shared notes"
ON public.shared_workspace_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shared notes
CREATE POLICY "Users can delete their own shared notes"
ON public.shared_workspace_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updating updated_at timestamp
CREATE TRIGGER update_shared_workspace_notes_updated_at
BEFORE UPDATE ON public.shared_workspace_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();