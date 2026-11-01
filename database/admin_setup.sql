-- =====================================================
-- ADMIN USER SETUP
-- =====================================================
-- This script creates the admin user with credentials:
-- Email: admin@intervisionai.com
-- Password: Admin@123
-- =====================================================

-- IMPORTANT: This must be run AFTER the schema.sql
-- You have two options to create the admin user:

-- =====================================================
-- OPTION 1: Manual Creation (RECOMMENDED)
-- =====================================================
-- Go to Supabase Dashboard:
-- 1. Navigate to Authentication → Users
-- 2. Click "Add User" button
-- 3. Fill in:
--    - Email: admin@intervisionai.com
--    - Password: Admin@123
--    - Auto Confirm User: YES (check this box)
-- 4. Click "Create User"
-- 5. The trigger will automatically create the profile with role 'candidate'
-- 6. Run the UPDATE query below to change role to 'admin'

-- Update the user role to admin (run this after creating user manually)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@intervisionai.com';

-- =====================================================
-- OPTION 2: Using Supabase Service Role (Advanced)
-- =====================================================
-- If you have access to Supabase service role key, you can use this approach
-- This requires using Supabase Admin API or running from a secure backend

-- Note: The following is a reference for programmatic creation
-- You would need to use Supabase Admin SDK or API to execute this

/*
Example using Supabase Admin SDK (Node.js):

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // Use service role key, not anon key
)

async function createAdminUser() {
  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@intervisionai.com',
    password: 'Admin@123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin User',
      role: 'admin'
    }
  })

  if (authError) {
    console.error('Error creating admin user:', authError)
    return
  }

  console.log('Admin user created:', authData.user.id)

  // Update profile role to admin
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authData.user.id)

  if (profileError) {
    console.error('Error updating profile:', profileError)
    return
  }

  console.log('Admin profile updated successfully')
}

createAdminUser()
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if admin user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- Check if admin profile exists with correct role
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'admin@intervisionai.com';

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If the profile was created with 'candidate' role, update it:
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'admin@intervisionai.com';

-- If profile doesn't exist but auth user does, create it manually:
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@intervisionai.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- =====================================================
-- SECURITY NOTES
-- =====================================================
-- 1. Change the admin password after first login in production
-- 2. Never commit service role keys to version control
-- 3. Use environment variables for sensitive credentials
-- 4. Enable 2FA for admin accounts in production
-- 5. Regularly audit admin access logs
