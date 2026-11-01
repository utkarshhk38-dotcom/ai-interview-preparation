# Quick Start Guide

## Prerequisites
- Node.js 14+ installed
- Supabase account created
- SMTP server credentials (Gmail, SendGrid, etc.)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env` file with your credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://rjqkvproiplpvpoodshu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Custom SMTP (example with Gmail)
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

### 3. Test SMTP Configuration
```bash
npm run test:smtp
```

You should see:
```
✅ SMTP connection successful!
✅ Test email sent successfully!
```

### 4. Configure Supabase

#### Create Admin User
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `admin@intervisionai.com`
4. Password: `Admin@123`
5. Confirm email automatically
6. Save

#### Disable Email Confirmations
1. Go to Authentication → Settings
2. Find "Email Auth" section
3. **Uncheck** "Confirm email"
4. Save

### 5. Start the Application
```bash
npm run dev:all
```

This starts:
- Frontend: `http://localhost:8082` (or next available)
- Backend API: `http://localhost:3001`

## Test the Application

### Test Admin Login
1. Go to `http://localhost:8082/login`
2. Email: `admin@intervisionai.com`
3. Password: `Admin@123`
4. Should redirect to admin dashboard

### Test Candidate Signup
1. Go to `http://localhost:8082/signup`
2. Fill in the form
3. Click "Create Account"
4. Check your email for OTP
5. Enter OTP to verify
6. Should redirect to login

### Test Candidate Login
1. Go to `http://localhost:8082/login`
2. Enter your email and password
3. Should redirect to candidate dashboard

## Common Issues

### SMTP Connection Failed
- Check SMTP credentials in `.env`
- For Gmail: Enable 2FA and create App Password
- Verify SMTP host and port are correct

### OTP Not Received
- Check spam/junk folder
- Run `npm run test:smtp` to verify SMTP works
- Check server console for errors

### Port Already in Use
- Frontend: Vite will automatically use next available port
- Backend: Change PORT in `.env` or kill process on 3001

### Supabase Connection Error
- Verify SUPABASE_URL and ANON_KEY in `.env`
- Check Supabase project is active

## Project Structure

```
ai-interview-master/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # Auth context
│   ├── lib/             # Utilities (Supabase, OTP service)
│   ├── pages/           # Page components
│   └── App.tsx          # Main app
├── server/
│   ├── index.js         # OTP API server
│   └── test-smtp.js     # SMTP test script
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Next Steps

1. Customize email template in `server/index.js`
2. Add more features to dashboards
3. Implement forgot password
4. Add user profile management
5. Deploy to production

## Documentation

- [Supabase Setup](./SUPABASE_SETUP.md) - Detailed Supabase configuration
- [Custom SMTP Setup](./CUSTOM_SMTP_SETUP.md) - SMTP and OTP details

## Support

For issues:
1. Check console logs (browser and server)
2. Verify all environment variables are set
3. Test SMTP connection: `npm run test:smtp`
4. Check Supabase dashboard for errors
