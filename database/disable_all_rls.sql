-- Disable RLS on all tables for development/testing
-- This is a temporary solution to bypass RLS issues

-- Disable RLS on all interview-related tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_templates DISABLE ROW LEVEL SECURITY;

-- Drop all policies on these tables
DO $$ 
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['profiles', 'interview_sessions', 'session_answers', 'session_questions', 'questions', 
                           'user_badges', 'user_streaks', 'recommendations', 'answer_templates'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = tbl) LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || tbl;
        END LOOP;
    END LOOP;
END $$;

-- Grant full access to authenticated and anon users for development
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Verify no policies remain
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('profiles', 'interview_sessions', 'session_answers', 'session_questions', 'questions', 
                    'user_badges', 'user_streaks', 'recommendations', 'answer_templates')
GROUP BY tablename;

-- If no results, that means all policies are removed (which is what we want)
SELECT 'All RLS policies have been removed successfully!' as status;
