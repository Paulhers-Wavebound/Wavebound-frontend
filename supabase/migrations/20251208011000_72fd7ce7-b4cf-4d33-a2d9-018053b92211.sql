-- Create session_ideas table to store ideas per chat session
CREATE TABLE public.session_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL,
  video_embed_id TEXT,
  title TEXT NOT NULL,
  why_it_works TEXT,
  content_type TEXT,
  video_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster session lookups
CREATE INDEX idx_session_ideas_session_id ON public.session_ideas(session_id);

-- Enable RLS
ALTER TABLE public.session_ideas ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_ideas
CREATE POLICY "Users can view ideas in own sessions" 
ON public.session_ideas 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM chat_sessions 
  WHERE chat_sessions.id = session_ideas.session_id 
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create ideas in own sessions" 
ON public.session_ideas 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM chat_sessions 
  WHERE chat_sessions.id = session_ideas.session_id 
  AND chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete ideas in own sessions" 
ON public.session_ideas 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM chat_sessions 
  WHERE chat_sessions.id = session_ideas.session_id 
  AND chat_sessions.user_id = auth.uid()
));