# Supabase Authentication Setup Guide

## Overview
This application uses Supabase for authentication with two user roles:
- **Admin**: Logs in with email/password (admin@intervisionai.com)
- **Candidate**: Registers and authenticates via OTP sent through custom SMTP

## Configuration

### Environment Variables
The `.env` file has been configured with your Supabase credentials:
```
VITE_SUPABASE_URL=https://rjqkvproiplpvpoodshu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Supabase Dashboard Setup

### 1. Create Admin User
In your Supabase dashboard:
1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Email: `admin@intervisionai.com`
4. Password: `Admin@123`
5. Confirm email automatically
6. Save

### 2. Disable Supabase Email Confirmations
Since we're using custom SMTP for OTP:

1. Go to **Authentication** > **Settings**
2. Scroll to **Email Auth**
3. **Disable** "Confirm email" option
4. This allows users to be created without Supabase sending verification emails

### 3. Configure Custom SMTP Server
Update your `.env` file with your SMTP credentials:

```env
VITE_SMTP_HOST=smtp.your-provider.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_smtp_username
VITE_SMTP_PASS=your_smtp_password
VITE_SMTP_FROM=noreply@intervisionai.com
```

Common SMTP providers:
- **Gmail**: smtp.gmail.com (port 587)
- **SendGrid**: smtp.sendgrid.net (port 587)
- **Mailgun**: smtp.mailgun.org (port 587)
- **AWS SES**: email-smtp.region.amazonaws.com (port 587)

### 4. Set Up Row Level Security (Optional)
Create a `profiles` table to store user metadata:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'candidate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## User Flows

### Admin Login Flow
1. Admin visits `/login`
2. Enters email: `admin@intervisionai.com`
3. Enters password: `Admin@123`
4. Clicks "Sign In"
5. Redirected to `/admin` dashboard

### Candidate Registration Flow (with Custom SMTP OTP)
1. Candidate visits `/signup`
2. Fills in: Full Name, Email, Password, Confirm Password
3. Accepts Terms of Service
4. Clicks "Create Account"
5. **Custom SMTP server sends OTP email** (not Supabase)
6. Enters 6-digit OTP to verify email
7. OTP verified via custom API
8. Supabase account created (without email confirmation)
9. Redirected to `/login`

### Candidate Login Flow
1. Candidate visits `/login`
2. Enters email and password
3. Clicks "Sign In"
4. Credentials verified against database
5. Redirected to `/dashboard`

## Running the Application

### Start Both Frontend and Backend
```bash
npm run dev:all
```

This will start:
- Vite dev server on `http://localhost:5173` (or next available port)
- OTP API server on `http://localhost:3001`

### Or Run Separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend OTP Server
npm run server
```

## Testing

### Test Admin Login
1. Go to `http://localhost:8082/login`
2. Email: `admin@intervisionai.com`
3. Password: `Admin@123`
4. Should redirect to admin dashboard

### Test Candidate Registration
1. Go to `http://localhost:8082/signup`
2. Fill in the form with test data
3. Check email for verification link
4. Verify account

### Test Candidate OTP Login
1. Go to `http://localhost:8082/login`
2. Enter candidate email
3. Click "Send OTP"
4. Check email for OTP code
5. Enter OTP and verify

## Troubleshooting

### OTP Not Received
- Check SMTP settings in Supabase dashboard
- Verify email template is configured correctly
- Check spam folder
- Ensure custom SMTP server is working

### Admin Cannot Login
- Verify admin user exists in Supabase dashboard
- Check email and password are correct
- Ensure user is confirmed

### Environment Variables Not Loading
- Restart the dev server after creating `.env` file
- Verify `.env` file is in the root directory
- Check variable names start with `VITE_`

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to version control
- The `.env` file is already in `.gitignore`
- Service role key should only be used server-side
- Use anon key for client-side operations
