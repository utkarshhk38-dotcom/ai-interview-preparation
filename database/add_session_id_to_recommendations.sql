-- Add session_id to recommendations table
ALTER TABLE public.recommendations
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE;

-- Create index for session_id
CREATE INDEX IF NOT EXISTS idx_recommendations_session ON public.recommendations(session_id);
