-- =====================================================
-- ADMIN USER DIAGNOSTIC SCRIPT
-- =====================================================
-- Run this to diagnose admin login issues
-- =====================================================

-- 1. Check if admin user exists in auth.users
SELECT 
  '1. Auth User Check' as step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Admin user exists in auth.users'
    ELSE '❌ Admin user NOT found in auth.users - CREATE USER FIRST'
  END as status,
  COUNT(*) as count
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- 2. Check admin user details
SELECT 
  '2. Admin User Details' as step,
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmed'
    ELSE '❌ Email NOT confirmed - Check "Auto Confirm User" when creating'
  END as email_status,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Password set'
    ELSE '❌ Password NOT set'
  END as password_status
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- 3. Check if profile exists
SELECT 
  '3. Profile Check' as step,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Profile exists'
    ELSE '❌ Profile NOT found - Trigger may not have fired'
  END as status,
  COUNT(*) as count
FROM public.profiles
WHERE email = 'admin@intervisionai.com';

-- 4. Check profile role
SELECT 
  '4. Profile Role Check' as step,
  id,
  email,
  full_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Role is admin'
    ELSE '❌ Role is NOT admin - Run UPDATE query'
  END as role_status,
  created_at
FROM public.profiles
WHERE email = 'admin@intervisionai.com';

-- 5. Check if user is confirmed
SELECT 
  '5. Confirmation Status' as step,
  CASE 
    WHEN confirmation_sent_at IS NOT NULL THEN '⚠️ Confirmation email was sent'
    ELSE '✅ No confirmation needed'
  END as confirmation_status,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ User is confirmed'
    ELSE '❌ User is NOT confirmed'
  END as confirmed_status
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- =====================================================
-- FIXES
-- =====================================================

-- If profile doesn't exist, create it:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT id, email, 'Admin User', 'admin'
-- FROM auth.users
-- WHERE email = 'admin@intervisionai.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- If role is not admin, update it:
-- UPDATE public.profiles
-- SET role = 'admin', full_name = 'Admin User'
-- WHERE email = 'admin@intervisionai.com';

-- If email is not confirmed, confirm it:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(),
--     confirmed_at = NOW()
-- WHERE email = 'admin@intervisionai.com';

-- =====================================================
-- COMPLETE FIX (Run if needed)
-- =====================================================
-- This will fix all common issues:

-- Step 1: Confirm the email
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email = 'admin@intervisionai.com';

-- Step 2: Ensure profile exists with admin role
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@intervisionai.com'
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin',
  full_name = COALESCE(profiles.full_name, 'Admin User');

-- Step 3: Verify everything
SELECT 
  'VERIFICATION' as check_type,
  u.email,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as email_confirmed,
  CASE WHEN p.role = 'admin' THEN '✅' ELSE '❌' END as is_admin,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@intervisionai.com';
