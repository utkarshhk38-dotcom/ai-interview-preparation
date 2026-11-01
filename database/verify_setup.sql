-- =====================================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- =====================================================
-- Run this script after setting up the database to verify everything is working
-- =====================================================

-- =====================================================
-- 1. CHECK TABLES EXIST
-- =====================================================
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'interview_sessions', 'questions', 'session_questions', 'performance_analytics', 'feedback');

-- =====================================================
-- 2. CHECK FUNCTIONS EXIST
-- =====================================================
SELECT 
  'Functions Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing functions'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'handle_updated_at');

-- =====================================================
-- 3. CHECK TRIGGERS EXIST
-- =====================================================
SELECT 
  'Triggers Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ PASS'
    ELSE '❌ FAIL - Missing triggers'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- =====================================================
-- 4. CHECK RLS ENABLED
-- =====================================================
SELECT 
  'RLS Check' as check_type,
  COUNT(*) as tables_with_rls,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ PASS'
    ELSE '❌ FAIL - RLS not enabled on all tables'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- =====================================================
-- 5. CHECK ADMIN USER EXISTS
-- =====================================================
SELECT 
  'Admin User Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users 
      WHERE email = 'admin@intervisionai.com'
    ) THEN '✅ PASS - Admin user exists'
    ELSE '❌ FAIL - Admin user not found'
  END as status;

-- =====================================================
-- 6. CHECK ADMIN PROFILE WITH CORRECT ROLE
-- =====================================================
SELECT 
  'Admin Profile Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = 'admin@intervisionai.com' AND role = 'admin'
    ) THEN '✅ PASS - Admin profile with admin role'
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = 'admin@intervisionai.com'
    ) THEN '⚠️ WARNING - Admin profile exists but role is not admin'
    ELSE '❌ FAIL - Admin profile not found'
  END as status;

-- =====================================================
-- 7. CHECK SAMPLE QUESTIONS LOADED
-- =====================================================
SELECT 
  'Sample Questions Check' as check_type,
  COUNT(*) as question_count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS - Sample questions loaded'
    WHEN COUNT(*) > 0 THEN '⚠️ WARNING - Some questions loaded'
    ELSE '❌ FAIL - No questions found'
  END as status
FROM public.questions;

-- =====================================================
-- 8. DETAILED TABLE INFORMATION
-- =====================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 9. RLS POLICIES COUNT
-- =====================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 10. ADMIN USER DETAILS
-- =====================================================
SELECT 
  'Admin User Details' as info_type,
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@intervisionai.com';

-- =====================================================
-- 11. QUESTION DISTRIBUTION
-- =====================================================
SELECT 
  question_type,
  difficulty_level,
  COUNT(*) as count
FROM public.questions
GROUP BY question_type, difficulty_level
ORDER BY question_type, difficulty_level;

-- =====================================================
-- 12. INDEXES CHECK
-- =====================================================
SELECT 
  'Indexes Check' as check_type,
  COUNT(*) as index_count,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS - Indexes created'
    ELSE '⚠️ WARNING - Some indexes may be missing'
  END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 
  '===================' as separator,
  'SETUP VERIFICATION COMPLETE' as message,
  '===================' as separator2;

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- If all checks pass:
-- 1. Test admin login at /login
-- 2. Test candidate signup at /signup
-- 3. Verify OTP email delivery
-- 4. Test candidate login
-- 
-- If any checks fail:
-- 1. Review the specific error
-- 2. Re-run the relevant section from schema.sql
-- 3. Check admin_setup.sql for admin user creation
-- 4. Run this verification script again
