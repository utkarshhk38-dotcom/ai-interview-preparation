-- =====================================================
-- AI Interview Coach - Database Schema
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- Store user profile information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('admin', 'candidate')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 2. INTERVIEW SESSIONS TABLE
-- Store interview practice sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'hr', 'case_study')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER,
  score DECIMAL(5,2),
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Candidates can view own sessions"
  ON public.interview_sessions FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can create own sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Candidates can update own sessions"
  ON public.interview_sessions FOR UPDATE
  USING (candidate_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON public.interview_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. QUESTIONS TABLE
-- Store interview questions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('technical', 'behavioral', 'hr', 'case_study')),
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT,
  tags TEXT[],
  sample_answer TEXT,
  evaluation_criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active questions"
  ON public.questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. SESSION QUESTIONS TABLE
-- Link questions to interview sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.session_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  question_order INTEGER NOT NULL,
  candidate_answer TEXT,
  ai_feedback TEXT,
  score DECIMAL(5,2),
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Enable RLS
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Candidates can view own session questions"
  ON public.session_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can update own session questions"
  ON public.session_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all session questions"
  ON public.session_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. PERFORMANCE ANALYTICS TABLE
-- Track candidate performance over time
-- =====================================================
CREATE TABLE IF NOT EXISTS public.performance_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('overall_score', 'communication', 'technical_accuracy', 'problem_solving', 'confidence')),
  metric_value DECIMAL(5,2) NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.performance_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Candidates can view own analytics"
  ON public.performance_analytics FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY "Admins can view all analytics"
  ON public.performance_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. FEEDBACK TABLE
-- Store detailed feedback for sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('strengths', 'improvements', 'suggestions', 'overall')),
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Candidates can view feedback for own sessions"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all feedback"
  ON public.feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_interview_sessions
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_questions
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_session_questions
  BEFORE UPDATE ON public.session_questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 9. INDEXES
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Interview sessions indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON public.interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON public.interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_type ON public.interview_sessions(interview_type);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created ON public.interview_sessions(created_at DESC);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active);

-- Session questions indexes
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON public.session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_question ON public.session_questions(question_id);

-- Performance analytics indexes
CREATE INDEX IF NOT EXISTS idx_performance_candidate ON public.performance_analytics(candidate_id);
CREATE INDEX IF NOT EXISTS idx_performance_session ON public.performance_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_recorded ON public.performance_analytics(recorded_at DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_session ON public.feedback(session_id);

-- =====================================================
-- 10. SAMPLE DATA - QUESTIONS
-- =====================================================

-- Insert sample technical questions
INSERT INTO public.questions (question_text, question_type, difficulty_level, category, tags, sample_answer) VALUES
('Explain the difference between var, let, and const in JavaScript.', 'technical', 'beginner', 'JavaScript', ARRAY['javascript', 'variables', 'es6'], 'var is function-scoped, let and const are block-scoped. const cannot be reassigned.'),
('What is the difference between == and === in JavaScript?', 'technical', 'beginner', 'JavaScript', ARRAY['javascript', 'operators'], '== performs type coercion, === checks both value and type without coercion.'),
('Explain closures in JavaScript with an example.', 'technical', 'intermediate', 'JavaScript', ARRAY['javascript', 'closures', 'functions'], 'A closure is a function that has access to variables in its outer scope, even after the outer function has returned.'),
('What is the Virtual DOM in React?', 'technical', 'intermediate', 'React', ARRAY['react', 'virtual-dom'], 'Virtual DOM is a lightweight copy of the actual DOM that React uses to optimize updates.'),
('Explain the concept of promises in JavaScript.', 'technical', 'intermediate', 'JavaScript', ARRAY['javascript', 'async', 'promises'], 'Promises represent the eventual completion or failure of an asynchronous operation.');

-- Insert sample behavioral questions
INSERT INTO public.questions (question_text, question_type, difficulty_level, category, tags) VALUES
('Tell me about a time when you faced a challenging problem at work.', 'behavioral', 'intermediate', 'Problem Solving', ARRAY['problem-solving', 'experience']),
('Describe a situation where you had to work with a difficult team member.', 'behavioral', 'intermediate', 'Teamwork', ARRAY['teamwork', 'conflict-resolution']),
('How do you handle tight deadlines and pressure?', 'behavioral', 'beginner', 'Stress Management', ARRAY['time-management', 'pressure']),
('Tell me about a time you failed and what you learned from it.', 'behavioral', 'intermediate', 'Learning', ARRAY['failure', 'growth-mindset']),
('Describe your greatest professional achievement.', 'behavioral', 'beginner', 'Achievements', ARRAY['success', 'accomplishments']);

-- Insert sample HR questions
INSERT INTO public.questions (question_text, question_type, difficulty_level, category, tags) VALUES
('Why do you want to work for our company?', 'hr', 'beginner', 'Motivation', ARRAY['motivation', 'company-fit']),
('Where do you see yourself in 5 years?', 'hr', 'beginner', 'Career Goals', ARRAY['career-planning', 'goals']),
('What are your salary expectations?', 'hr', 'intermediate', 'Compensation', ARRAY['salary', 'negotiation']),
('Why are you leaving your current job?', 'hr', 'intermediate', 'Career Change', ARRAY['job-change', 'motivation']),
('What are your strengths and weaknesses?', 'hr', 'beginner', 'Self-Assessment', ARRAY['self-awareness', 'strengths']);

-- =====================================================
-- NOTES:
-- =====================================================
-- After running this schema, you need to:
-- 1. Create the admin user manually in Supabase Dashboard
-- 2. Or use the admin_setup.sql file to create it programmatically
