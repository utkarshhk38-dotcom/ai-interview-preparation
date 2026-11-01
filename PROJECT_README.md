# 🧠 AI Interview Coach - Complete Project Documentation

## 📋 Project Overview

AI Interview Coach is a comprehensive interview preparation platform that uses artificial intelligence to help candidates practice and improve their interview skills. The platform provides realistic interview simulations, AI-powered feedback, progress tracking, and personalized recommendations to enhance interview performance.

## ✨ Key Features

### 🎯 AI-Powered Interview Simulator
- **Dynamic Question Generation**: AI creates unique questions based on interview type and difficulty level
- **Multiple Interview Types**: Technical, Behavioral, and HR interviews
- **Adaptive Difficulty**: Questions adjust based on your performance in real-time
- **Real-time Analysis**: Comprehensive scoring across multiple dimensions
- **STAR Method Evaluation**: Structured feedback for behavioral questions

### 📊 Comprehensive Feedback System
- **Multi-dimensional Scoring**: Fluency, confidence, grammar, tone, sentiment analysis
- **Keyword Analysis**: Industry-specific term usage and relevance
- **Detailed Breakdown**: Question-by-question performance analysis
- **Strengths & Improvements**: AI-generated actionable feedback
- **Performance Metrics**: Visual score indicators and progress tracking

### 📈 Progress Tracking & Analytics
- **Score Trends**: Line charts showing improvement over time
- **Skills Assessment**: Radar charts for different skill areas
- **Category Performance**: Bar charts comparing interview types
- **Historical Data**: Complete session history and analytics
- **Weekly Reports**: Automated progress summaries

### 🏆 Gamification System
- **Achievement Badges**: 8 different badges to earn based on performance
- **Progress Tracking**: Visual indicators for badge requirements
- **Streak System**: Daily practice consistency tracking
- **Milestone Rewards**: Special achievements for long-term engagement

### 🎯 Personalized Recommendations
- **AI-Generated Tips**: Based on individual performance analysis
- **Priority Levels**: High, medium, and low priority suggestions
- **Answer Templates**: STAR method and other proven frameworks
- **Resource Links**: Additional learning materials and guides

### 🔐 Secure Authentication System
- **Dual Role System**: Admin and Candidate roles with different access levels
- **Custom SMTP Integration**: OTP verification via your own email server
- **Secure Login**: Password-based authentication with role-based access control
- **Email Verification**: OTP-based account verification during signup

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **shadcn/ui** for beautiful, accessible UI components
- **Radix UI** for headless component primitives
- **React Router** for client-side routing
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **Lucide React** for consistent iconography

### Backend
- **Node.js** with Express.js for API server
- **Supabase** for database and authentication
- **OpenAI GPT-4** for AI-powered features
- **Nodemailer** for custom SMTP email delivery
- **CORS** for cross-origin resource sharing

### Database
- **PostgreSQL** (via Supabase) with Row Level Security
- **Comprehensive Schema**: Users, sessions, answers, badges, recommendations
- **Optimized Indexes**: For fast query performance
- **Data Integrity**: Foreign key constraints and validation

### AI & Analytics
- **OpenAI GPT-4**: Question generation, answer analysis, feedback
- **Natural Language Processing**: Sentiment analysis, tone detection
- **Custom Scoring Algorithms**: Multi-dimensional performance evaluation
- **Adaptive Learning**: Dynamic difficulty adjustment

## 📁 Project Structure

```
ai-interview-master/
├── 📂 src/                           # Frontend source code
│   ├── 📂 components/
│   │   ├── 📂 interview/             # Interview simulator components
│   │   │   ├── InterviewSetup.tsx    # Interview configuration
│   │   │   ├── InterviewSession.tsx  # Live interview session
│   │   │   └── InterviewResults.tsx  # Results and feedback
│   │   ├── 📂 progress/              # Analytics components
│   │   │   └── ProgressCharts.tsx    # Data visualization
│   │   ├── 📂 gamification/          # Gamification features
│   │   │   └── BadgeSystem.tsx       # Achievement badges
│   │   ├── 📂 recommendations/       # AI recommendations
│   │   │   └── RecommendationPanel.tsx
│   │   ├── 📂 landing/               # Landing page components
│   │   └── 📂 ui/                    # Reusable UI components
│   ├── 📂 pages/                     # Page components
│   │   ├── Index.tsx                 # Landing page
│   │   ├── Login.tsx                 # Authentication
│   │   ├── Signup.tsx                # User registration
│   │   ├── Interview.tsx             # Interview simulator
│   │   ├── Progress.tsx              # Analytics dashboard
│   │   ├── AdminDashboard.tsx        # Admin interface
│   │   └── CandidateDashboard.tsx    # User dashboard
│   ├── 📂 contexts/                  # React contexts
│   │   └── AuthContext.tsx           # Authentication state
│   ├── 📂 lib/                       # Utilities and services
│   │   ├── supabase.ts               # Database client
│   │   └── otpService.ts             # OTP API service
│   └── App.tsx                       # Main application
├── 📂 backend/                       # Backend API server
│   ├── 📂 routes/                    # API route handlers
│   │   └── interview.routes.js       # Interview endpoints
│   ├── 📂 services/                  # Business logic
│   │   └── openai.service.js         # AI integration
│   ├── server.js                     # Express server
│   └── test-smtp.js                  # SMTP testing utility
├── 📂 database/                      # Database schema and migrations
│   ├── schema.sql                    # Initial database schema
│   ├── migrations_phase2.sql         # Feature enhancements
│   ├── admin_setup.sql               # Admin user creation
│   └── README.md                     # Database documentation
├── 📂 public/                        # Static assets
├── 📂 dist/                          # Production build output
├── 📄 .env                           # Environment configuration
├── 📄 package.json                   # Dependencies and scripts
├── 📄 vite.config.ts                 # Vite configuration
├── 📄 tailwind.config.ts             # Tailwind CSS configuration
├── 📄 tsconfig.json                  # TypeScript configuration
└── 📄 start-servers.bat              # Windows startup script
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **Supabase account** for database and authentication
- **OpenAI API key** for AI features
- **SMTP server credentials** (Gmail, SendGrid, Mailgun, etc.)

### Installation Steps

#### 1. Clone and Install
```bash
cd ai-interview-master
npm install
```

#### 2. Environment Configuration
Create/edit `.env` file with your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-key

# Custom SMTP Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

#### 3. Database Setup
Execute the following SQL files in your Supabase SQL Editor:
1. `database/schema.sql` - Initial database structure
2. `database/migrations_phase2.sql` - Enhanced features
3. `database/admin_setup.sql` - Create admin user

#### 4. Test Configuration
```bash
# Test SMTP connection
npm run test:smtp

# Should show: ✅ SMTP connection successful!
```

#### 5. Start Development Servers

**Option 1: Use batch file (Windows)**
```bash
start-servers.bat
```

**Option 2: Run manually**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend API
npm run server
```

**Option 3: Concurrent (single terminal)**
```bash
npm run dev:all
```

#### 6. Access the Application
- **Frontend**: http://localhost:8080 (or next available port)
- **Backend API**: http://localhost:3001
- **Admin Login**: admin@intervisionai.com / Admin@123

## 📱 User Workflows

### 👤 Candidate Journey

#### Registration & Verification
1. Visit `/signup` and fill registration form
2. Receive OTP via email (custom SMTP)
3. Enter 6-digit verification code
4. Account created and verified
5. Redirected to login page

#### Interview Practice Session
1. Login and access candidate dashboard
2. Click "Start Practice Interview"
3. Select interview type (Technical/Behavioral/HR)
4. Choose difficulty level (Beginner/Intermediate/Advanced)
5. Answer AI-generated questions (50-200 words each)
6. Receive real-time difficulty adjustments
7. Complete session and view detailed results

#### Progress Tracking
1. Access "View Analytics" from dashboard
2. Review score trends over time
3. Analyze skills assessment radar chart
4. Check category performance comparisons
5. View earned badges and progress
6. Read personalized AI recommendations

### 👨‍💼 Admin Features
1. Direct login with admin credentials
2. Access admin dashboard with system overview
3. Manage users and view system statistics
4. Monitor interview sessions and performance
5. Configure system settings and parameters

## 🤖 AI Features Deep Dive

### Question Generation
- **Context-Aware**: Questions based on interview type and user background
- **Difficulty Adaptation**: Real-time adjustment based on performance
- **Industry-Specific**: Tailored to different job roles and sectors
- **Variety**: Ensures no repetition across sessions

### Answer Analysis
The AI evaluates answers across multiple dimensions:

#### Scoring Metrics (0-100 scale)
- **Fluency**: Clarity, flow, and coherence of response
- **Confidence**: Assertiveness and conviction in answers
- **Grammar**: Language correctness and structure
- **Tone**: Professional and appropriate communication style
- **Sentiment**: Positive and constructive attitude

#### STAR Method Evaluation (for behavioral questions)
- **Situation** (0-25 points): Context clearly described
- **Task** (0-25 points): Responsibility identified
- **Action** (0-25 points): Steps taken explained
- **Result** (0-25 points): Outcome quantified

#### Keyword Analysis
- Industry-specific terminology usage
- Role-relevant keyword density
- Missing important keywords identification
- Technical term accuracy assessment

### Adaptive Difficulty Algorithm
```
Score ≥ 80 on Beginner → Move to Intermediate
Score ≥ 85 on Intermediate → Move to Advanced
Score < 60 on Advanced → Move to Intermediate
Score < 50 on Intermediate → Move to Beginner
```

## 📊 API Documentation

### Authentication Endpoints
```
POST   /api/send-otp          # Send OTP for email verification
POST   /api/verify-otp        # Verify OTP code
GET    /api/health            # Server health check
```

### Interview Endpoints
```
POST   /api/interview/start                # Start new interview session
POST   /api/interview/next-question        # Get next question
POST   /api/interview/submit-answer        # Submit and analyze answer
POST   /api/interview/complete             # Complete session
GET    /api/interview/session/:id          # Get session details
POST   /api/interview/recommendations      # Get personalized tips
```

### Request/Response Examples

#### Start Interview Session
```javascript
// Request
POST /api/interview/start
{
  "userId": "uuid",
  "interviewType": "technical",
  "difficulty": "intermediate"
}

// Response
{
  "sessionId": "uuid",
  "firstQuestion": {
    "id": 1,
    "text": "Explain the difference between...",
    "type": "technical",
    "difficulty": "intermediate"
  }
}
```

#### Submit Answer
```javascript
// Request
POST /api/interview/submit-answer
{
  "sessionId": "uuid",
  "questionId": 1,
  "answer": "The main difference is...",
  "timeSpent": 120
}

// Response
{
  "feedback": {
    "overallScore": 85,
    "fluency": 88,
    "confidence": 82,
    "grammar": 90,
    "tone": 85,
    "sentiment": 87,
    "keywords": ["technical", "difference", "implementation"],
    "strengths": ["Clear explanation", "Good examples"],
    "improvements": ["Add more specific details"]
  },
  "nextQuestion": { ... }
}
```

## 🎮 Gamification System

### Achievement Badges
1. **🎯 First Steps** - Complete your first interview
2. **🔥 Consistent Learner** - Complete 5 sessions in a week
3. **🌟 High Achiever** - Score 90+ in any session
4. **📈 Improvement Master** - Show 10% improvement
5. **💪 Technical Expert** - Excel in technical interviews
6. **🗣️ Communication Pro** - Master behavioral interviews
7. **🎓 STAR Method Expert** - Perfect STAR structure scores
8. **🏆 Dedicated Practitioner** - Answer 100+ questions

### Progress Tracking
- **Daily Streaks**: Consecutive days of practice
- **Weekly Goals**: Target sessions per week
- **Milestone Rewards**: Special achievements for consistency
- **Performance Trends**: Visual progress indicators

## 🔧 Configuration & Customization

### Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `VITE_SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `VITE_SMTP_PORT` | SMTP server port | `587` |
| `VITE_SMTP_USER` | SMTP username | `user@gmail.com` |
| `VITE_SMTP_PASS` | SMTP password/app password | `app-password` |
| `VITE_SMTP_FROM` | Sender email address | `noreply@domain.com` |

### OpenAI Configuration
- **Model**: GPT-4 for optimal performance
- **Temperature**: 0.7 for balanced creativity and consistency
- **Max Tokens**: Varies by function (500-1500)
- **Rate Limiting**: Built-in error handling and retries

### Database Configuration
- **Row Level Security**: Enabled for data protection
- **Indexes**: Optimized for query performance
- **Constraints**: Data integrity and validation
- **Policies**: Role-based access control

## 🚀 Deployment Guide

### Production Checklist
- [ ] Set all environment variables in hosting platform
- [ ] Configure production database (Supabase)
- [ ] Set up production SMTP service
- [ ] Configure OpenAI API with proper rate limits
- [ ] Enable HTTPS for secure communication
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Update CORS settings for production domain

### Build Commands
```bash
# Frontend build
npm run build

# Backend deployment
# Deploy backend/server.js to Node.js hosting service
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Railway, Render, Heroku, or AWS EC2
- **Database**: Supabase (managed PostgreSQL)
- **Email**: SendGrid, Mailgun, or AWS SES

## 🐛 Troubleshooting

### Common Issues

#### SMTP Connection Failed
```bash
# Test SMTP configuration
npm run test:smtp

# Common solutions:
# - Enable 2FA and create App Password (Gmail)
# - Check firewall settings
# - Verify SMTP host and port
# - Ensure credentials are correct
```

#### OpenAI API Errors
- Verify API key is valid and has credits
- Check rate limits on your OpenAI account
- Review error messages in backend console
- Ensure proper error handling in requests

#### Database Connection Issues
- Verify Supabase URL and keys in `.env`
- Check RLS policies are properly configured
- Ensure migrations have been executed
- Verify user authentication is working

#### Frontend Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear TypeScript cache: Delete `.vite` folder
- Restart development server
- Check for TypeScript errors in IDE

### Performance Optimization
- Enable gzip compression on server
- Implement caching for API responses
- Optimize database queries with proper indexes
- Use CDN for static assets
- Implement lazy loading for components

## 📚 Documentation Files

The project includes comprehensive documentation:

- **[FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md)** - Detailed feature requirements
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Implementation status
- **[QUICK_START.md](./QUICK_START.md)** - Quick setup guide
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database configuration
- **[CUSTOM_SMTP_SETUP.md](./CUSTOM_SMTP_SETUP.md)** - Email configuration
- **[TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md)** - Authentication issues
- **[database/README.md](./database/README.md)** - Database documentation

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes with proper testing
4. Follow the existing code style and conventions
5. Update documentation as needed
6. Submit a pull request with detailed description

### Code Standards
- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Implement proper error handling
- Write meaningful commit messages
- Add comments for complex logic
- Ensure responsive design for all components

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API and AI capabilities
- **Supabase** for backend infrastructure and database
- **shadcn/ui** for beautiful component library
- **Recharts** for data visualization components
- **React** and **TypeScript** communities for excellent tooling

## 📞 Support

For technical support or questions:
1. Check the troubleshooting documentation
2. Review console logs (browser and server)
3. Verify all environment variables are configured
4. Test individual components (SMTP, database, API)
5. Contact the development team with detailed error information

---

**Project Status**: ✅ Complete and Production Ready

**Version**: 2.0.0 - Full AI Interview Simulator

**Last Updated**: December 2024

**Default Admin Credentials**:
- Email: admin@intervisionai.com
- Password: Admin@123

> **Note**: Change admin credentials after first login in production environment!