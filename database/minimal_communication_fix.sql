-- =====================================================
-- Minimal Communication Fix - Essential Only
-- =====================================================

-- 1. Fix interview_sessions constraint
ALTER TABLE public.interview_sessions 
DROP CONSTRAINT IF EXISTS interview_sessions_interview_type_check;

ALTER TABLE public.interview_sessions 
ADD CONSTRAINT interview_sessions_interview_type_check 
CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'case_study', 'communication'));

-- 2. Add required columns to interview_sessions if missing
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 5;

-- 3. Create session_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.session_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  time_taken_seconds INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  overall_score DECIMAL(5,2) DEFAULT 0,
  tone_score DECIMAL(5,2) DEFAULT 0,
  sentiment_score DECIMAL(5,2) DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  fluency_score DECIMAL(5,2) DEFAULT 0,
  grammar_score DECIMAL(5,2) DEFAULT 0,
  star_score DECIMAL(5,2),
  ai_feedback JSONB DEFAULT '{}',
  keywords_found TEXT[] DEFAULT '{}',
  keywords_missing TEXT[] DEFAULT '{}',
  grammar_issues TEXT[] DEFAULT '{}',
  star_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on session_answers
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies for session_answers
DROP POLICY IF EXISTS "session_answers_select_policy" ON public.session_answers;
DROP POLICY IF EXISTS "session_answers_insert_policy" ON public.session_answers;

CREATE POLICY "session_answers_select_policy"
  ON public.session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "session_answers_insert_policy"
  ON public.session_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

-- 6. Insert one sample communication question
INSERT INTO public.questions (question_text, question_type, difficulty_level, category, tags) 
VALUES (
  'Tell me about yourself and your professional background.',
  'communication',
  'beginner',
  'Introduction',
  ARRAY['self-introduction', 'background', 'communication']
) ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Communication setup completed successfully!' as result;