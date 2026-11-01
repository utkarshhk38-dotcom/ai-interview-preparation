# Backend API Server

This is the backend API server for AI Interview Coach, handling OTP generation and email delivery.

## Structure

```
backend/
├── server.js          # Main API server
├── test-smtp.js       # SMTP configuration test script
├── package.json       # Backend dependencies
└── README.md          # This file
```

## Features

- **OTP Generation**: Generates 6-digit OTP codes
- **Email Delivery**: Sends OTP via custom SMTP server
- **OTP Verification**: Validates OTP codes with expiry and attempt limits
- **Health Check**: API endpoint to check server status

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

### GET /api/health
Check server health status.

**Response:**
```json
{
  "status": "OK",
  "message": "OTP server is running",
  "smtp": "configured"
}
```

### GET /
Root endpoint with API information.

## Running the Server

### Option 1: From Backend Directory (Recommended)
```bash
cd backend
node server.js
```

### Option 2: From Project Root
```bash
npm run server
```

### Option 3: Use Start Script
```bash
# From project root - starts both frontend and backend
.\start-servers.bat
```

### Test SMTP Configuration

From backend directory:
```bash
cd backend
node test-smtp.js
```

Or from project root:
```bash
npm run test:smtp
```

**Note:** Dependencies are installed in the parent directory (`node_modules`), so you don't need to run `npm install` in the backend folder.

## Configuration

The server reads SMTP configuration from the `.env` file in the project root:

```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASS=your-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

## OTP Features

- **6-digit numeric code**
- **10-minute expiry**
- **3 verification attempts maximum**
- **In-memory storage** (use Redis in production)
- **Beautiful HTML email template**

## Security

- CORS enabled for all origins (configure for production)
- Request logging for debugging
- Error handling with specific messages
- Process signal handling for graceful shutdown

## Production Recommendations

1. Use Redis for OTP storage instead of in-memory Map
2. Add rate limiting (max 3 OTPs per hour per email)
3. Configure CORS for specific origins only
4. Use environment-specific configurations
5. Add request validation middleware
6. Implement proper logging (Winston, Morgan)
7. Use PM2 or similar for process management
8. Set up SSL/TLS
9. Add monitoring and alerts

## Dependencies

The backend uses the following npm packages (installed in project root):
- `express` - Web framework
- `cors` - CORS middleware
- `nodemailer` - Email sending
- `dotenv` - Environment variables

## Port

Default port: **3001**

Can be changed via `PORT` environment variable.

## Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify Node.js is installed (v14+)
- Check `.env` file exists in project root

### SMTP errors
- Verify SMTP credentials in `.env`
- Test with `node test-smtp.js`
- Check Gmail App Password is correct
- Ensure 2FA is enabled on Gmail account

### OTP not received
- Check spam/junk folder
- Verify SMTP configuration
- Check server console for errors
- Test SMTP connection

## Development

The server includes:
- Request logging middleware
- Detailed error messages
- Console logging for debugging
- Graceful shutdown handling

## Support

For issues, check:
1. Server console logs
2. SMTP configuration in `.env`
3. Network connectivity
4. Email provider settings
