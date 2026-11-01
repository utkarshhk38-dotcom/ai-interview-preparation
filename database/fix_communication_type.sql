-- =====================================================
-- Fix Communication Type - Safe Migration
-- =====================================================

-- 1. Update interview_sessions table to allow 'communication' type
ALTER TABLE public.interview_sessions 
DROP CONSTRAINT IF EXISTS interview_sessions_interview_type_check;

ALTER TABLE public.interview_sessions 
ADD CONSTRAINT interview_sessions_interview_type_check 
CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'case_study', 'communication'));

-- 2. Update questions table to allow 'communication' type
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE public.questions 
ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('technical', 'behavioral', 'hr', 'case_study', 'communication'));

-- 3. Add new columns to interview_sessions (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_sessions' AND column_name = 'questions_answered') THEN
        ALTER TABLE public.interview_sessions ADD COLUMN questions_answered INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_sessions' AND column_name = 'total_questions') THEN
        ALTER TABLE public.interview_sessions ADD COLUMN total_questions INTEGER DEFAULT 5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interview_sessions' AND column_name = 'session_data') THEN
        ALTER TABLE public.interview_sessions ADD COLUMN session_data JSONB DEFAULT '{}';
    END IF;
END $$;

-- 4. Create session_answers table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_answers') THEN
        CREATE TABLE public.session_answers (
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
          vocabulary_score DECIMAL(5,2),
          communication_score DECIMAL(5,2),
          pronunciation_score DECIMAL(5,2),
          ai_feedback JSONB DEFAULT '{}',
          keywords_found TEXT[] DEFAULT '{}',
          keywords_missing TEXT[] DEFAULT '{}',
          grammar_issues TEXT[] DEFAULT '{}',
          star_analysis JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Create policies for session_answers (drop existing ones first)
DROP POLICY IF EXISTS "Candidates can view own session answers" ON public.session_answers;
DROP POLICY IF EXISTS "Candidates can create own session answers" ON public.session_answers;
DROP POLICY IF EXISTS "Candidates can update own session answers" ON public.session_answers;
DROP POLICY IF EXISTS "Admins can view all session answers" ON public.session_answers;

-- Create new policies
CREATE POLICY "Candidates can view own session answers"
  ON public.session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can create own session answers"
  ON public.session_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can update own session answers"
  ON public.session_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all session answers"
  ON public.session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create trigger for updated_at (drop existing one first)
DROP TRIGGER IF EXISTS set_updated_at_session_answers ON public.session_answers;

CREATE TRIGGER set_updated_at_session_answers
  BEFORE UPDATE ON public.session_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_session_answers_session ON public.session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_created ON public.session_answers(created_at DESC);

-- 8. Insert sample communication questions (only if they don't exist)
INSERT INTO public.questions (question_text, question_type, difficulty_level, category, tags, evaluation_criteria) 
SELECT * FROM (VALUES
  ('Tell me about yourself and your professional background.', 'communication', 'beginner', 'Introduction', ARRAY['self-introduction', 'background', 'communication'], 
   '{"vocabulary_usage": "Use professional vocabulary", "communication_clarity": "Speak clearly and confidently", "professional_language": "Maintain formal tone"}'::jsonb),
  
  ('Describe a challenging project you worked on and how you overcame obstacles.', 'communication', 'intermediate', 'Problem Solving', ARRAY['project-management', 'problem-solving', 'communication'], 
   '{"vocabulary_usage": "Use technical and professional terms", "communication_clarity": "Structure your answer clearly", "professional_language": "Demonstrate leadership qualities"}'::jsonb),
  
  ('How would you explain a complex technical concept to a non-technical stakeholder?', 'communication', 'intermediate', 'Communication Skills', ARRAY['technical-communication', 'stakeholder-management'], 
   '{"vocabulary_usage": "Balance technical and simple terms", "communication_clarity": "Use analogies and examples", "professional_language": "Show empathy and understanding"}'::jsonb),
  
  ('What are your career goals and how does this position align with them?', 'communication', 'beginner', 'Career Planning', ARRAY['career-goals', 'motivation', 'alignment'], 
   '{"vocabulary_usage": "Use goal-oriented language", "communication_clarity": "Be specific and realistic", "professional_language": "Show enthusiasm and commitment"}'::jsonb),
  
  ('Describe a time when you had to present to senior leadership. How did you prepare?', 'communication', 'advanced', 'Leadership Communication', ARRAY['presentation', 'leadership', 'preparation'], 
   '{"vocabulary_usage": "Use executive-level vocabulary", "communication_clarity": "Show strategic thinking", "professional_language": "Demonstrate confidence and authority"}'::jsonb)
) AS v(question_text, question_type, difficulty_level, category, tags, evaluation_criteria)
WHERE NOT EXISTS (
  SELECT 1 FROM public.questions 
  WHERE question_type = 'communication' 
  AND question_text = v.question_text
);

-- 9. Update existing interview sessions to have proper structure
UPDATE public.interview_sessions 
SET 
  questions_answered = COALESCE(questions_answered, 0),
  total_questions = COALESCE(total_questions, 5),
  session_data = COALESCE(session_data, '{}')
WHERE questions_answered IS NULL OR total_questions IS NULL OR session_data IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Communication type successfully added to database schema!';
  RAISE NOTICE '✅ Tables and constraints updated safely';
  RAISE NOTICE '✅ Sample communication questions inserted';
  RAISE NOTICE '🎤 You can now use Communication Round interviews!';
END $$;