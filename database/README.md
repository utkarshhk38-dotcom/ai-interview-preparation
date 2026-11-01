# Database Setup Guide

## Overview
This directory contains SQL scripts to set up the complete database schema for the AI Interview Coach application.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Complete database schema with all tables, functions, triggers, and sample data |
| `admin_setup.sql` | Admin user creation and verification queries |
| `README.md` | This file - setup instructions |

## Database Structure

### Tables

1. **profiles** - User profile information
   - Links to auth.users
   - Stores role (admin/candidate), name, avatar, etc.

2. **interview_sessions** - Interview practice sessions
   - Tracks session status, type, duration, score
   - Links to candidates

3. **questions** - Interview question bank
   - Technical, behavioral, HR, case study questions
   - Difficulty levels and categories

4. **session_questions** - Questions asked in each session
   - Links sessions to questions
   - Stores candidate answers and AI feedback

5. **performance_analytics** - Performance tracking
   - Metrics over time
   - Various performance indicators

6. **feedback** - Detailed session feedback
   - Strengths, improvements, suggestions
   - Ratings and comments

## Setup Instructions

### Step 1: Run Schema Script

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `schema.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

You should see: `Success. No rows returned`

### Step 2: Verify Tables Created

Run this query to check all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- feedback
- interview_sessions
- performance_analytics
- profiles
- questions
- session_questions

### Step 3: Create Admin User

#### Option A: Manual Creation (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Fill in:
   - Email: `admin@intervisionai.com`
   - Password: `Admin@123`
   - Auto Confirm User: ✅ **Check this box**
4. Click **Create User**

5. Go back to **SQL Editor** and run:
```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'admin@intervisionai.com';
```

#### Option B: Using SQL (Alternative)

If you prefer SQL, copy the relevant sections from `admin_setup.sql`

### Step 4: Verify Admin User

Run these verification queries:

```sql
-- Check auth user
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@intervisionai.com';

-- Check profile with admin role
SELECT id, email, full_name, role
FROM public.profiles
WHERE email = 'admin@intervisionai.com';
```

Expected result:
- Email: admin@intervisionai.com
- Role: admin
- Email confirmed: Yes

### Step 5: Disable Email Confirmations

1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth** section
3. **Uncheck** "Confirm email"
4. Click **Save**

This prevents Supabase from sending verification emails (we use custom SMTP).

### Step 6: Test Sample Data

Check if sample questions were inserted:

```sql
SELECT 
  question_type,
  difficulty_level,
  COUNT(*) as count
FROM public.questions
GROUP BY question_type, difficulty_level
ORDER BY question_type, difficulty_level;
```

You should see questions across different types and difficulty levels.

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Profiles
- Users can view/update their own profile
- Admins can view all profiles

### Interview Sessions
- Candidates can manage their own sessions
- Admins can view all sessions

### Questions
- Anyone can view active questions
- Only admins can create/edit questions

### Session Questions
- Candidates can manage questions in their sessions
- Admins can view all session questions

### Performance Analytics
- Candidates can view their own analytics
- Admins can view all analytics

### Feedback
- Candidates can view feedback for their sessions
- Admins can manage all feedback

## Testing the Setup

### Test 1: Create a Test Candidate

```sql
-- This simulates what happens when a user signs up
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('TestPassword123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Test User", "role": "candidate"}'::jsonb,
  NOW(),
  NOW()
);
```

### Test 2: Verify Profile Created

```sql
SELECT * FROM public.profiles
WHERE email = 'test@example.com';
```

### Test 3: Create a Test Session

```sql
INSERT INTO public.interview_sessions (
  candidate_id,
  interview_type,
  difficulty_level,
  status
)
SELECT 
  id,
  'technical',
  'beginner',
  'pending'
FROM public.profiles
WHERE email = 'test@example.com';
```

### Test 4: Check RLS Policies

```sql
-- This should only return the user's own profile
SET request.jwt.claims.sub = (
  SELECT id::text FROM public.profiles WHERE email = 'test@example.com'
);

SELECT * FROM public.profiles;
```

## Common Issues

### Issue: Trigger not creating profile

**Solution:**
```sql
-- Manually create profile for existing user
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'candidate'
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (id) DO NOTHING;
```

### Issue: Admin role not set

**Solution:**
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@intervisionai.com';
```

### Issue: RLS blocking queries

**Solution:**
- Make sure you're authenticated as the correct user
- Check policy definitions
- Admins need the admin role set correctly

### Issue: Sample questions not inserted

**Solution:**
```sql
-- Check if questions table is empty
SELECT COUNT(*) FROM public.questions;

-- If empty, re-run the INSERT statements from schema.sql
```

## Maintenance Queries

### View All Users and Roles
```sql
SELECT 
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;
```

### View Session Statistics
```sql
SELECT 
  p.email,
  p.full_name,
  COUNT(s.id) as total_sessions,
  AVG(s.score) as avg_score,
  MAX(s.completed_at) as last_session
FROM public.profiles p
LEFT JOIN public.interview_sessions s ON s.candidate_id = p.id
WHERE p.role = 'candidate'
GROUP BY p.id, p.email, p.full_name
ORDER BY total_sessions DESC;
```

### View Question Distribution
```sql
SELECT 
  question_type,
  difficulty_level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.questions
WHERE is_active = true
GROUP BY question_type, difficulty_level
ORDER BY question_type, difficulty_level;
```

### Clean Up Test Data
```sql
-- Delete test users (be careful!)
DELETE FROM auth.users
WHERE email LIKE '%test%' OR email LIKE '%example%';

-- This will cascade delete profiles and related data
```

## Backup and Restore

### Backup
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or from Supabase Dashboard
# Settings → Database → Database Backups
```

### Restore
```bash
# Using Supabase CLI
supabase db reset
supabase db push
```

## Next Steps

After setting up the database:

1. ✅ Test admin login at `/login`
2. ✅ Test candidate signup at `/signup`
3. ✅ Verify OTP email delivery
4. ✅ Test candidate login
5. ✅ Check dashboard access

## Support

For issues:
1. Check Supabase logs in Dashboard
2. Verify RLS policies are correct
3. Ensure triggers are active
4. Check foreign key constraints

## Security Checklist

- [ ] Admin user created with strong password
- [ ] Email confirmations disabled in Supabase
- [ ] RLS enabled on all tables
- [ ] Policies tested and working
- [ ] Service role key kept secure
- [ ] Regular backups scheduled
- [ ] Audit logs reviewed regularly
