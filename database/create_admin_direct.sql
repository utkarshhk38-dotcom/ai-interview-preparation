-- =====================================================
-- CREATE ADMIN USER DIRECTLY VIA SQL
-- =====================================================
-- This creates the admin user programmatically
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Create the auth user
-- Note: You need to use Supabase Dashboard's "Add User" feature
-- OR use the Supabase Admin API (not possible via SQL alone)

-- Since we can't create auth.users directly via SQL in Supabase,
-- here's what you need to do:

-- MANUAL STEPS (REQUIRED):
-- 1. Go to Authentication → Users in Supabase Dashboard
-- 2. Click "Add User"
-- 3. Email: admin@intervisionai.com
-- 4. Password: Admin@123
-- 5. Check "Auto Confirm User"
-- 6. Click "Create User"

-- Step 2: After creating the user manually, run this to set admin role:
UPDATE public.profiles
SET 
  role = 'admin',
  full_name = 'Admin User',
  updated_at = NOW()
WHERE email = 'admin@intervisionai.com';

-- Step 3: If profile doesn't exist (trigger didn't fire), create it:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@intervisionai.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'admin@intervisionai.com'
  );

-- Step 4: Ensure email is confirmed
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'admin@intervisionai.com';

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
  '=== ADMIN USER VERIFICATION ===' as check_section;

-- Check auth.users
SELECT 
  'Auth User' as table_name,
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status,
  created_at
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- Check profiles
SELECT 
  'Profile' as table_name,
  id,
  email,
  full_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin Role'
    ELSE '❌ Wrong Role: ' || role
  END as status,
  created_at
FROM public.profiles
WHERE email = 'admin@intervisionai.com';

-- Combined check
SELECT 
  'Combined Check' as check_type,
  u.email,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL AND p.role = 'admin' 
    THEN '✅ READY TO LOGIN'
    WHEN u.email_confirmed_at IS NULL 
    THEN '❌ Email not confirmed'
    WHEN p.role != 'admin' 
    THEN '❌ Role is not admin'
    WHEN p.id IS NULL 
    THEN '❌ Profile does not exist'
    ELSE '❌ Unknown issue'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@intervisionai.com';

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If you see "Profile does not exist", run this:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT id, email, 'Admin User', 'admin'
-- FROM auth.users
-- WHERE email = 'admin@intervisionai.com';

-- If you see "Email not confirmed", run this:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(), confirmed_at = NOW()
-- WHERE email = 'admin@intervisionai.com';

-- If you see "Role is not admin", run this:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@intervisionai.com';
