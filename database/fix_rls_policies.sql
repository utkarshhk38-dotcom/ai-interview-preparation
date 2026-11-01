-- Fix RLS Policies for Profiles Table
-- This script fixes the infinite recursion issue

-- First, disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix interview_sessions RLS policies
ALTER TABLE interview_sessions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON interview_sessions;

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_policy" ON interview_sessions
  FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "sessions_insert_policy" ON interview_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "sessions_update_policy" ON interview_sessions
  FOR UPDATE
  USING (auth.uid() = candidate_id)
  WITH CHECK (auth.uid() = candidate_id);

-- Fix session_answers RLS policies
ALTER TABLE session_answers DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own answers" ON session_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON session_answers;

ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_select_policy" ON session_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_answers.session_id
      AND interview_sessions.candidate_id = auth.uid()
    )
  );

CREATE POLICY "answers_insert_policy" ON session_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = session_answers.session_id
      AND interview_sessions.candidate_id = auth.uid()
    )
  );

-- Fix user_badges RLS policies
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_policy" ON user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "badges_insert_policy" ON user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fix user_streaks RLS policies
ALTER TABLE user_streaks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_policy" ON user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streaks_insert_policy" ON user_streaks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update_policy" ON user_streaks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix recommendations RLS policies
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON recommendations;

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_select_policy" ON recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recommendations_insert_policy" ON recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Questions and answer_templates should be readable by all authenticated users
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_policy" ON questions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

ALTER TABLE answer_templates DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Templates are viewable by authenticated users" ON answer_templates;
ALTER TABLE answer_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_policy" ON answer_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
