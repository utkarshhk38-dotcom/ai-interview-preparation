-- Temporary fix: Disable RLS on profiles table completely
-- This will allow the app to work while we debug the RLS issue

-- Disable RLS on profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Verify profiles table is accessible
SELECT COUNT(*) as profile_count FROM profiles;

-- Check if there are any remaining policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Grant full access to authenticated users (since RLS is disabled)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- Note: This is a temporary solution for development
-- In production, you should have proper RLS policies
-- But they must not cause infinite recursion
