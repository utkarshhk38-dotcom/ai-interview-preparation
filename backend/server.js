import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import interviewRoutes from './routes/interview.routes.js';
import transcriptionRoutes from './routes/transcription.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import userRoutes from './routes/user.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const app = express();
app.use(cors());
app.use(express.json());

// Make supabase available to routes
app.locals.supabase = supabase;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate SMTP configuration
const validateSMTPConfig = () => {
  const required = ['VITE_SMTP_HOST', 'VITE_SMTP_PORT', 'VITE_SMTP_USER', 'VITE_SMTP_PASS', 'VITE_SMTP_FROM'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing SMTP configuration:', missing.join(', '));
    console.error('Please configure these in your .env file');
    return false;
  }
  
  console.log('✅ SMTP Configuration loaded:');
  console.log(`   Host: ${process.env.VITE_SMTP_HOST}`);
  console.log(`   Port: ${process.env.VITE_SMTP_PORT}`);
  console.log(`   User: ${process.env.VITE_SMTP_USER}`);
  console.log(`   From: ${process.env.VITE_SMTP_FROM}`);
  return true;
};

// Create SMTP transporter
let transporter = null;

try {
  if (validateSMTPConfig()) {
    transporter = nodemailer.createTransport({
      host: process.env.VITE_SMTP_HOST,
      port: parseInt(process.env.VITE_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.VITE_SMTP_USER,
        pass: process.env.VITE_SMTP_PASS,
      },
    });
    console.log('✅ SMTP transporter created successfully');
  }
} catch (error) {
  console.error('❌ Error creating SMTP transporter:', error.message);
}

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!transporter) {
      console.error('❌ SMTP transporter not configured');
      return res.status(500).json({ 
        error: 'SMTP server not configured. Please check server logs.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 10 minute expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });

    // Send email
    console.log(`📧 Attempting to send OTP to: ${email}`);
    await transporter.sendMail({
      from: process.env.VITE_SMTP_FROM,
      to: email,
      subject: 'Verify Your Email - AI Interview Coach',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 AI Interview Coach</h1>
            </div>
            <div class="content">
              <h2>Hello ${name || 'there'}!</h2>
              <p>Thank you for signing up with AI Interview Coach. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Your verification code</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p>If you didn't request this code, please ignore this email.</p>
              
              <div class="footer">
                <p>© 2024 AI Interview Coach. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`); // For development only
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Error sending OTP:', error.message);
    console.error('Full error:', error);
    
    // Return more specific error message
    let errorMessage = 'Failed to send OTP';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP Authentication failed. Please check your email and password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Please check your host and port.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Invalid credentials. Please use a valid Gmail account and App Password.';
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check attempts
    if (stored.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many failed attempts' });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Success - remove OTP
    otpStore.delete(email);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Use interview routes
app.use('/api/interview', interviewRoutes);

// Use transcription routes
app.use('/api', transcriptionRoutes);

// Use resume routes
app.use('/api/resume', resumeRoutes);

// Use user routes
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'OTP server is running',
    version: 'V4-RESUME',
    smtp: transporter ? 'configured' : 'not configured'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Interview Coach API Server',
    endpoints: {
      health: '/api/health',
      sendOtp: 'POST /api/send-otp',
      verifyOtp: 'POST /api/verify-otp',
      interview: {
        start: 'POST /api/interview/start',
        nextQuestion: 'POST /api/interview/next-question',
        submitAnswer: 'POST /api/interview/submit-answer',
        complete: 'POST /api/interview/complete',
        session: 'GET /api/interview/session/:id',
        recommendations: 'POST /api/interview/recommendations'
      },
      resume: {
        upload: 'POST /api/resume/upload',
        questions: 'GET /api/resume/questions/:userId'
      }
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected error occurred on the server'
  });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 OTP Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📧 SMTP Status: ${transporter ? '✅ Configured' : '❌ Not Configured'}`);
  console.log('='.repeat(50) + '\n');
  
  if (!transporter) {
    console.log('⚠️  WARNING: SMTP not configured!');
    console.log('Please update your .env file with correct SMTP settings:');
    console.log('');
    console.log('Example for Gmail:');
    console.log('VITE_SMTP_HOST=smtp.gmail.com');
    console.log('VITE_SMTP_PORT=587');
    console.log('VITE_SMTP_USER=your-email@gmail.com');
    console.log('VITE_SMTP_PASS=your-app-password');
    console.log('VITE_SMTP_FROM=noreply@intervisionai.com');
    console.log('');
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
