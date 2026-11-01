-- =====================================================
-- PHASE 2: Interview Simulator & AI Features
-- Database Migrations
-- =====================================================

-- =====================================================
-- 1. ENHANCE INTERVIEW_SESSIONS TABLE
-- =====================================================
ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS ai_difficulty_level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS adaptive_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- 2. SESSION_ANSWERS TABLE
-- Store individual answers with AI analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS public.session_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  time_taken_seconds INTEGER,
  word_count INTEGER,
  
  -- AI Feedback Scores
  overall_score DECIMAL(5,2),
  tone_score DECIMAL(5,2),
  sentiment_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  fluency_score DECIMAL(5,2),
  grammar_score DECIMAL(5,2),
  star_score DECIMAL(5,2),
  
  -- AI Analysis Results
  ai_feedback JSONB DEFAULT '{}'::jsonb,
  keywords_found TEXT[],
  keywords_missing TEXT[],
  grammar_issues JSONB DEFAULT '[]'::jsonb,
  star_analysis JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. USER_BADGES TABLE
-- Track earned badges and achievements
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type, badge_name)
);

-- =====================================================
-- 4. USER_STREAKS TABLE
-- Track daily and weekly streaks
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_sessions INTEGER DEFAULT 0,
  weekly_goal INTEGER DEFAULT 3,
  weekly_progress INTEGER DEFAULT 0,
  week_start_date DATE,
  streak_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RECOMMENDATIONS TABLE
-- Store personalized recommendations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  category TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 6. ANSWER_TEMPLATES TABLE
-- Store AI-generated answer templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.answer_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL,
  question_type TEXT NOT NULL,
  title TEXT NOT NULL,
  template_text TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  example_answer TEXT,
  tips TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- Session answers indexes
CREATE INDEX IF NOT EXISTS idx_session_answers_session ON public.session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_question ON public.session_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_created ON public.session_answers(created_at DESC);

-- User badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON public.user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON public.user_badges(earned_at DESC);

-- User streaks indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON public.user_streaks(current_streak DESC);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON public.recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_unread ON public.recommendations(user_id, is_read);

-- Answer templates indexes
CREATE INDEX IF NOT EXISTS idx_answer_templates_type ON public.answer_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_answer_templates_question ON public.answer_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_answer_templates_active ON public.answer_templates(is_active);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

-- Session answers RLS
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session answers"
  ON public.session_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE id = session_id AND candidate_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session answers"
  ON public.session_answers FOR INSERT
  WITH CHECK (
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

-- User badges RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all badges"
  ON public.user_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User streaks RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON public.user_streaks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON public.user_streaks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (true);

-- Recommendations RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON public.recommendations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own recommendations"
  ON public.recommendations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all recommendations"
  ON public.recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Answer templates RLS
ALTER TABLE public.answer_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON public.answer_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON public.answer_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Updated_at trigger for session_answers
CREATE TRIGGER set_updated_at_session_answers
  BEFORE UPDATE ON public.session_answers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Updated_at trigger for user_streaks
CREATE TRIGGER set_updated_at_user_streaks
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 10. SAMPLE DATA - ANSWER TEMPLATES
-- =====================================================

-- STAR Method Templates
INSERT INTO public.answer_templates (template_type, question_type, title, template_text, placeholders, example_answer, tips) VALUES
('star', 'behavioral', 'Leadership Challenge Template', 
'In my role as [POSITION] at [COMPANY], I faced a situation where [SITUATION]. My task was to [TASK]. I took action by [ACTION_1], [ACTION_2], and [ACTION_3]. As a result, [RESULT] which led to [QUANTIFIABLE_OUTCOME].',
'["POSITION", "COMPANY", "SITUATION", "TASK", "ACTION_1", "ACTION_2", "ACTION_3", "RESULT", "QUANTIFIABLE_OUTCOME"]'::jsonb,
'In my role as Team Lead at TechCorp, I faced a situation where our project was falling behind schedule due to unclear requirements. My task was to realign the team and deliver on time. I took action by organizing daily standups, creating a clear roadmap, and delegating tasks based on strengths. As a result, we delivered the project 2 days early which led to a 95% client satisfaction score.',
ARRAY['Be specific with numbers', 'Focus on your actions', 'Quantify results', 'Keep it concise']
);

INSERT INTO public.answer_templates (template_type, question_type, title, template_text, placeholders, example_answer, tips) VALUES
('technical', 'technical', 'Technical Explanation Template',
'[CONCEPT] is [DEFINITION]. It works by [EXPLANATION]. The key benefits are [BENEFIT_1], [BENEFIT_2], and [BENEFIT_3]. A practical example would be [EXAMPLE]. I have used this in [EXPERIENCE].',
'["CONCEPT", "DEFINITION", "EXPLANATION", "BENEFIT_1", "BENEFIT_2", "BENEFIT_3", "EXAMPLE", "EXPERIENCE"]'::jsonb,
'React Hooks are functions that let you use state and lifecycle features in functional components. They work by allowing you to hook into React features without writing a class. The key benefits are cleaner code, better reusability, and easier testing. A practical example would be useState for managing component state. I have used this extensively in building responsive dashboards.',
ARRAY['Start with clear definition', 'Explain the "why"', 'Provide real examples', 'Connect to your experience']
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all new tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('session_answers', 'user_badges', 'user_streaks', 'recommendations', 'answer_templates')
ORDER BY table_name;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('session_answers', 'user_badges', 'user_streaks', 'recommendations', 'answer_templates');
