# AI Interview Coach - Authentication System

A modern interview preparation platform with role-based authentication using Supabase and custom SMTP for OTP verification.

## 🚀 Features

- **Dual Role System**
  - Admin: Direct login with email/password
  - Candidate: Registration with OTP verification

- **Custom SMTP Integration**
  - OTP sent via your own SMTP server
  - No dependency on Supabase email system
  - Beautiful HTML email templates

- **Secure Authentication**
  - Supabase backend
  - Password-based login for both roles
  - OTP verification during signup only

- **Modern UI**
  - Gradient backgrounds
  - Glass-morphism design
  - Smooth animations
  - Fully responsive

## � Prerequisites

- Node.js 14 or higher
- Supabase account
- SMTP server credentials (Gmail, SendGrid, Mailgun, etc.)

## 🛠️ Installation

```bash
# Clone the repository
cd ai-interview-master

# Install dependencies
npm install
```

## ⚙️ Configuration

### 1. Environment Variables

Create/edit `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rjqkvproiplpvpoodshu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Custom SMTP Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

### 2. Test SMTP Connection

```bash
npm run test:smtp
```

### 3. Supabase Setup

1. **Create Admin User**
   - Email: `admin@intervisionai.com`
   - Password: `Admin@123`

2. **Disable Email Confirmations**
   - Go to Authentication → Settings
   - Uncheck "Confirm email"

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 🚀 Running the Application

### Start Both Servers

```bash
npm run dev:all
```

This starts:
- **Frontend**: http://localhost:8082
- **Backend API**: http://localhost:3001

### Or Run Separately

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

## 📱 User Flows

### Admin Login
1. Visit `/login`
2. Email: `admin@intervisionai.com`
3. Password: `Admin@123`
4. → Redirects to `/admin`

### Candidate Registration
1. Visit `/signup`
2. Fill registration form
3. Click "Create Account"
4. **OTP sent to email via custom SMTP**
5. Enter 6-digit OTP
6. Account created
7. → Redirects to `/login`

### Candidate Login
1. Visit `/login`
2. Enter email and password
3. → Redirects to `/dashboard`

## 📁 Project Structure

```
ai-interview-master/
├── src/
│   ├── components/
│   │   ├── landing/          # Landing page components
│   │   └── ui/               # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── otpService.ts     # OTP API service
│   ├── pages/
│   │   ├── Index.tsx         # Landing page
│   │   ├── Login.tsx         # Login page
│   │   ├── Signup.tsx        # Signup page
│   │   ├── AdminDashboard.tsx
│   │   └── CandidateDashboard.tsx
│   └── App.tsx
├── server/
│   ├── index.js              # OTP API server
│   └── test-smtp.js          # SMTP test script
├── .env                      # Environment variables
├── package.json
└── README.md
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend API only |
| `npm run dev:all` | Start both frontend and backend |
| `npm run test:smtp` | Test SMTP configuration |
| `npm run build` | Build for production |

## � Documentation

- [Quick Start Guide](./QUICK_START.md) - Get started quickly
- [Supabase Setup](./SUPABASE_SETUP.md) - Detailed Supabase configuration
- [Custom SMTP Setup](./CUSTOM_SMTP_SETUP.md) - SMTP and OTP details

## 🔐 Security Features

- Password validation (min 8 characters)
- OTP expiry (10 minutes)
- Maximum 3 OTP verification attempts
- Role-based access control
- Protected routes

## 🎨 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Authentication**: Supabase
- **Email**: Nodemailer with custom SMTP
- **Backend**: Express.js
- **Routing**: React Router

## 🐛 Troubleshooting

### SMTP Issues
```bash
# Test your SMTP configuration
npm run test:smtp
```

### Port Conflicts
- Frontend: Vite auto-selects next available port
- Backend: Change PORT in `.env` or kill process on 3001

### OTP Not Received
- Check spam/junk folder
- Verify SMTP credentials
- Check server console logs

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `VITE_SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `VITE_SMTP_PORT` | SMTP server port | `587` |
| `VITE_SMTP_USER` | SMTP username | `user@gmail.com` |
| `VITE_SMTP_PASS` | SMTP password | `app-password` |
| `VITE_SMTP_FROM` | Sender email | `noreply@domain.com` |

## 🚀 Production Deployment

1. Set environment variables in your hosting platform
2. Build the frontend: `npm run build`
3. Deploy backend API to a Node.js server
4. Update API_URL in `src/lib/otpService.ts`
5. Use Redis for OTP storage (replace in-memory)
6. Add rate limiting and security headers

## 📄 License

This project is private and confidential.

## 👥 Support

For issues or questions, check the documentation files or contact the development team.

---

**Admin Credentials (Default)**
- Email: admin@intervisionai.com
- Password: Admin@123

**Note**: Change admin password after first login in production!
