# Custom SMTP OTP Setup

## Overview
This application uses a custom SMTP server to send OTP emails during candidate registration, completely bypassing Supabase's built-in email system.

## Architecture

```
User Signup Flow:
1. User fills signup form
2. Frontend calls custom API → /api/send-otp
3. Custom server generates 6-digit OTP
4. OTP stored in memory (10 min expiry)
5. Email sent via your SMTP server
6. User enters OTP
7. Frontend calls custom API → /api/verify-otp
8. If valid, Supabase account created
```

## Setup Instructions

### 1. Configure SMTP Credentials

Edit `.env` file with your SMTP provider details:

```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

### 2. SMTP Provider Examples

#### Gmail
```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password  # Generate from Google Account settings
```

**Note**: Enable 2FA and create an App Password in Google Account settings.

#### SendGrid
```env
VITE_SMTP_HOST=smtp.sendgrid.net
VITE_SMTP_PORT=587
VITE_SMTP_USER=apikey
VITE_SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
VITE_SMTP_HOST=smtp.mailgun.org
VITE_SMTP_PORT=587
VITE_SMTP_USER=postmaster@your-domain.mailgun.org
VITE_SMTP_PASS=your-mailgun-password
```

#### AWS SES
```env
VITE_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-ses-smtp-username
VITE_SMTP_PASS=your-ses-smtp-password
```

### 3. Disable Supabase Email Confirmations

In Supabase Dashboard:
1. Go to **Authentication** > **Settings**
2. Find **Email Auth** section
3. **Uncheck** "Confirm email"
4. Save changes

This prevents Supabase from sending its own verification emails.

### 4. Start the Servers

```bash
# Start both frontend and backend
npm run dev:all

# Or separately:
# Terminal 1
npm run dev

# Terminal 2
npm run server
```

## API Endpoints

### POST /api/send-otp
Send OTP to email address.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

### POST /api/verify-otp
Verify OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

## OTP Features

- **6-digit numeric code**
- **10-minute expiry**
- **3 verification attempts** max
- **In-memory storage** (use Redis in production)
- **Beautiful HTML email template**

## Email Template

The OTP email includes:
- Professional branded header
- Clear OTP display
- Expiry information
- Responsive design
- Company branding

## Security Considerations

### Development
- OTP printed to console for testing
- In-memory storage (lost on restart)

### Production Recommendations
1. **Use Redis** for OTP storage
2. **Remove console.log** statements
3. **Add rate limiting** (max 3 OTPs per hour per email)
4. **Use HTTPS** for API calls
5. **Add CORS restrictions**
6. **Implement IP-based throttling**
7. **Add email verification** before sending OTP
8. **Use environment-specific configs**

## Troubleshooting

### OTP Not Received
1. Check SMTP credentials in `.env`
2. Verify SMTP server is accessible
3. Check spam/junk folder
4. Look at server console for errors
5. Test SMTP connection:
   ```bash
   node server/index.js
   # Check for connection errors
   ```

### Invalid OTP Error
1. Check OTP hasn't expired (10 min)
2. Verify correct email address
3. Check for typos in OTP
4. Maximum 3 attempts allowed

### Server Not Starting
1. Ensure port 3001 is available
2. Check all dependencies installed: `npm install`
3. Verify `.env` file exists
4. Check Node.js version (14+ required)

## Production Deployment

### Environment Variables
Set these in your production environment:
- `VITE_SMTP_HOST`
- `VITE_SMTP_PORT`
- `VITE_SMTP_USER`
- `VITE_SMTP_PASS`
- `VITE_SMTP_FROM`
- `PORT` (for API server, default: 3001)

### Recommended Upgrades
1. Replace in-memory storage with Redis
2. Add request logging
3. Implement rate limiting
4. Add monitoring/alerts
5. Use a process manager (PM2)
6. Set up SSL/TLS
7. Add health check endpoint

## Testing

### Manual Test
1. Start servers: `npm run dev:all`
2. Go to `http://localhost:8082/signup`
3. Fill in registration form
4. Check email for OTP
5. Enter OTP to complete signup

### Check Server Logs
The OTP is printed to console during development:
```
OTP sent to user@example.com: 123456
```

## Support

For issues with:
- **SMTP connection**: Check provider documentation
- **OTP not sending**: Verify SMTP credentials
- **Email not received**: Check spam folder
- **Server errors**: Check console logs
