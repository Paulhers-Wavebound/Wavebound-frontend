-- Create workspace_notes table for user planning
CREATE TABLE public.workspace_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workspace_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for workspace_notes
CREATE POLICY "Users can view their own workspace notes" 
ON public.workspace_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workspace notes" 
ON public.workspace_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workspace notes" 
ON public.workspace_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workspace notes" 
ON public.workspace_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workspace_notes_updated_at
BEFORE UPDATE ON public.workspace_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();