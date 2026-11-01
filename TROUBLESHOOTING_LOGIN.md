# Login Troubleshooting Guide

## Issue: User Cannot Login After Signup

### Step 1: Verify Signup Was Completed

The signup process has 2 steps:
1. ✅ Fill form and receive OTP
2. ✅ Enter OTP to verify and create account

**Did you complete BOTH steps?**
- If you only received the OTP but didn't enter it, the account was NOT created
- You must enter the 6-digit OTP code to complete signup

### Step 2: Check User in Supabase

Run this query in Supabase SQL Editor:

```sql
-- Check if user exists
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'YOUR_EMAIL_HERE'; -- Replace with your email
```

**Possible Results:**

#### Result 1: No rows returned
**Problem:** User doesn't exist
**Solution:** Complete the signup process again, including OTP verification

#### Result 2: User exists but `email_confirmed_at` is NULL
**Problem:** Email not confirmed
**Solution:** Run this in Supabase SQL Editor:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE';
```

#### Result 3: User exists but no profile
**Problem:** Profile not created
**Solution:** Run this in Supabase SQL Editor:
```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'candidate'
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';
```

#### Result 4: Everything looks good
**Problem:** Wrong password
**Solution:** Try resetting password or signup again with a new email

### Step 3: Verify Supabase Settings

In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Check **Email Auth** section
3. **"Confirm email"** should be **UNCHECKED** ✅
4. If it's checked, uncheck it and save

### Step 4: Test Login

1. Go to `/login`
2. Enter your email and password
3. Click "Sign In"

**Expected behavior:**
- Admin (`admin@intervisionai.com`) → Redirects to `/admin`
- Candidate → Redirects to `/dashboard`

### Step 5: Check Browser Console

Open browser DevTools (F12) and check for errors:
- Network tab: Look for failed API calls
- Console tab: Look for error messages

### Common Issues

#### Issue: "Invalid email or password"
**Causes:**
- Wrong password
- User doesn't exist
- Email not confirmed

**Solution:**
1. Check user exists in Supabase
2. Confirm email is verified
3. Try signup again if needed

#### Issue: "User already registered"
**Causes:**
- Account exists but you forgot password
- Previous incomplete signup

**Solution:**
1. Try logging in with the password you used
2. If you forgot, you'll need to reset (feature not implemented yet)
3. Or use a different email

#### Issue: Redirects to login after successful login
**Causes:**
- Session not being saved
- Auth context issue

**Solution:**
1. Clear browser cache and cookies
2. Try in incognito mode
3. Check browser console for errors

### Step 6: Manual Account Creation (Last Resort)

If nothing works, create account manually in Supabase:

1. **Go to Authentication → Users**
2. **Click "Add User"**
3. Fill in:
   - Email: your-email@example.com
   - Password: YourPassword123
   - Auto Confirm User: ✅ CHECK THIS
4. **Click "Create User"**
5. **Go to SQL Editor** and run:
```sql
-- Ensure profile exists with candidate role
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'Your Name', 'candidate'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'candidate';
```
6. **Try logging in** with the credentials you just created

### Step 7: Check Server Logs

If using OTP signup, check the backend server console:
- Look for "OTP sent to..." messages
- Check for any error messages
- Verify OTP was generated

### Need More Help?

1. **Check Supabase logs**: Dashboard → Logs
2. **Check browser console**: F12 → Console tab
3. **Check network requests**: F12 → Network tab
4. **Verify .env configuration**: Check Supabase URL and keys

## Quick Fix Commands

### Confirm User Email
```sql
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email = 'YOUR_EMAIL';
```

### Create Missing Profile
```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, 'User Name', 'candidate'
FROM auth.users
WHERE email = 'YOUR_EMAIL'
ON CONFLICT (id) DO NOTHING;
```

### Check All Users
```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
```

### Delete Test User (if needed)
```sql
-- This will cascade delete profile too
DELETE FROM auth.users WHERE email = 'test@example.com';
```
