-- =====================================================
-- CHECK USER STATUS
-- =====================================================
-- Replace 'user@example.com' with the actual email

-- Check if user exists in auth.users
SELECT 
  'Auth User' as table_name,
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Confirmed'
    ELSE '❌ Email NOT Confirmed'
  END as email_status,
  created_at
FROM auth.users
WHERE email = 'sidharthlburaj181@gmail.com'; -- Replace with actual email

-- Check if profile exists
SELECT 
  'Profile' as table_name,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'sidharthlburaj181@gmail.com'; -- Replace with actual email

-- If user doesn't exist, they need to complete signup
-- If user exists but email not confirmed, run this:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(), confirmed_at = NOW()
-- WHERE email = 'sidharthlburaj181@gmail.com';

-- If profile doesn't exist but auth user does, run this:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- SELECT id, email, raw_user_meta_data->>'full_name', 'candidate'
-- FROM auth.users
-- WHERE email = 'sidharthlburaj181@gmail.com';
