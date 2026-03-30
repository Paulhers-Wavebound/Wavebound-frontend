-- Feature suggestions table
CREATE TABLE public.feature_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT, -- for anonymous users (fingerprint/session)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'planned', 'in_progress', 'completed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votes table (supports both upvote and downvote)
CREATE TABLE public.feature_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.feature_suggestions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT, -- for anonymous users
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure one vote per user/anonymous per suggestion
  UNIQUE(suggestion_id, user_id),
  UNIQUE(suggestion_id, anonymous_id)
);

-- Enable RLS
ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

-- Suggestions policies
-- Anyone can view public suggestions
CREATE POLICY "Anyone can view public suggestions"
ON public.feature_suggestions
FOR SELECT
USING (is_public = true);

-- Authenticated users can view their own private suggestions
CREATE POLICY "Users can view own suggestions"
ON public.feature_suggestions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anyone can insert suggestions
CREATE POLICY "Anyone can insert suggestions"
ON public.feature_suggestions
FOR INSERT
WITH CHECK (true);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions"
ON public.feature_suggestions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Votes policies
-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
ON public.feature_votes
FOR SELECT
USING (true);

-- Anyone can insert votes
CREATE POLICY "Anyone can insert votes"
ON public.feature_votes
FOR INSERT
WITH CHECK (true);

-- Anyone can update their own votes (for changing vote)
CREATE POLICY "Anyone can update own votes"
ON public.feature_votes
FOR UPDATE
USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR
  (anonymous_id IS NOT NULL)
);

-- Anyone can delete their own votes
CREATE POLICY "Anyone can delete own votes"
ON public.feature_votes
FOR DELETE
USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) OR
  (anonymous_id IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_suggestions_public_created ON public.feature_suggestions(is_public, created_at DESC);
CREATE INDEX idx_votes_suggestion ON public.feature_votes(suggestion_id);

-- Function to get vote count for a suggestion
CREATE OR REPLACE FUNCTION public.get_suggestion_vote_count(p_suggestion_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(vote_type), 0)::INTEGER
  FROM public.feature_votes
  WHERE suggestion_id = p_suggestion_id;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_feature_suggestions_updated_at
BEFORE UPDATE ON public.feature_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();