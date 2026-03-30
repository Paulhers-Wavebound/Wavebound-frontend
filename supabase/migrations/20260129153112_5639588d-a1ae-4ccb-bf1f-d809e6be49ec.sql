-- Create table for calendar items to replace localStorage persistence
CREATE TABLE public.calendar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo', 'idea')),
  description TEXT,
  time TIME,
  source_id BIGINT,
  thumbnail_url TEXT,
  project_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own calendar items" 
ON public.calendar_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar items" 
ON public.calendar_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar items" 
ON public.calendar_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar items" 
ON public.calendar_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calendar_items_updated_at
BEFORE UPDATE ON public.calendar_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries by user and date
CREATE INDEX idx_calendar_items_user_date ON public.calendar_items (user_id, date);