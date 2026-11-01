-- =====================================================
-- Verify Communication Setup - Quick Check
-- =====================================================

-- Check if communication type is allowed in interview_sessions
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'interview_sessions_interview_type_check';

-- Check if session_answers table exists
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'session_answers' 
ORDER BY ordinal_position;

-- Check if communication questions exist
SELECT 
  COUNT(*) as communication_questions_count
FROM public.questions 
WHERE question_type = 'communication';

-- Test inserting a communication session (will fail if constraint is wrong)
DO $$
DECLARE
  test_session_id UUID;
BEGIN
  -- Try to insert a test communication session
  INSERT INTO public.interview_sessions (
    candidate_id, 
    interview_type, 
    difficulty_level, 
    status,
    questions_answered,
    total_questions
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, -- dummy UUID
    'communication', 
    'beginner', 
    'completed',
    0,
    5
  ) RETURNING id INTO test_session_id;
  
  RAISE NOTICE '✅ Communication session insert test: SUCCESS (ID: %)', test_session_id;
  
  -- Clean up test data
  DELETE FROM public.interview_sessions WHERE id = test_session_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Communication session insert test: FAILED - %', SQLERRM;
END $$;

-- Show current interview types allowed
SELECT 
  'Current allowed interview types:' as info,
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%interview_type_check%';

RAISE NOTICE 'Database verification complete. Check the results above.';