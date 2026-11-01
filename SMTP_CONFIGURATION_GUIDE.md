# SMTP Configuration Guide

## Current Issue
Your `.env` file has incorrect SMTP configuration:
```
VITE_SMTP_HOST=noreply@intervisionai.com  ❌ This is an email, not a host
```

## How to Fix

### Option 1: Using Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Update `.env` file**:
```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-gmail@gmail.com
VITE_SMTP_PASS=your-16-char-app-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

### Option 2: Using Your Domain Email

If you have email hosting for `intervisionai.com`, you need:

1. **Find your SMTP server** (contact your hosting provider):
   - cPanel/WHM: Usually `mail.yourdomain.com` or `smtp.yourdomain.com`
   - Google Workspace: `smtp.gmail.com`
   - Microsoft 365: `smtp.office365.com`
   - Other providers: Check their documentation

2. **Update `.env` file**:
```env
VITE_SMTP_HOST=mail.intervisionai.com  # Your actual SMTP server
VITE_SMTP_PORT=587  # or 465 for SSL
VITE_SMTP_USER=noreply@intervisionai.com
VITE_SMTP_PASS=your-email-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

### Option 3: Using SendGrid (Free Tier Available)

1. **Sign up**: https://sendgrid.com/
2. **Create API Key**: Settings → API Keys
3. **Update `.env` file**:
```env
VITE_SMTP_HOST=smtp.sendgrid.net
VITE_SMTP_PORT=587
VITE_SMTP_USER=apikey
VITE_SMTP_PASS=your-sendgrid-api-key
VITE_SMTP_FROM=noreply@intervisionai.com
```

### Option 4: Using Mailgun

1. **Sign up**: https://www.mailgun.com/
2. **Get SMTP credentials**: Sending → Domain Settings → SMTP Credentials
3. **Update `.env` file**:
```env
VITE_SMTP_HOST=smtp.mailgun.org
VITE_SMTP_PORT=587
VITE_SMTP_USER=postmaster@your-domain.mailgun.org
VITE_SMTP_PASS=your-mailgun-password
VITE_SMTP_FROM=noreply@intervisionai.com
```

## Testing Your Configuration

After updating `.env`, test it:

```bash
npm run test:smtp
```

You should see:
```
✅ SMTP connection successful!
✅ Test email sent successfully!
```

## Common SMTP Ports

- **587**: TLS/STARTTLS (recommended)
- **465**: SSL (older, but still used)
- **25**: Plain (usually blocked by ISPs)

## Troubleshooting

### Error: "Invalid login"
- Check username and password
- For Gmail: Use App Password, not regular password
- Verify 2FA is enabled (for Gmail)

### Error: "Connection timeout"
- Check SMTP host is correct
- Try different port (587 or 465)
- Check firewall settings

### Error: "Authentication failed"
- Verify credentials are correct
- Check if "Less secure app access" is enabled (Gmail legacy)
- Use App Password instead of regular password

### Error: "Sender address rejected"
- Verify the FROM email is allowed by your SMTP provider
- Some providers require FROM to match authenticated user

## Current Configuration Status

Run the server to see your configuration status:
```bash
npm run server
```

Look for:
```
✅ SMTP Configuration loaded:
   Host: smtp.gmail.com
   Port: 587
   User: your-email@gmail.com
   From: noreply@intervisionai.com
```

## Next Steps

1. Choose an SMTP provider (Gmail recommended for testing)
2. Update your `.env` file with correct values
3. Restart the server: `npm run dev:all`
4. Test signup with OTP
5. Check your email for the OTP code

## Need Help?

If you're still having issues:
1. Share the server console output
2. Verify your SMTP provider's documentation
3. Test with Gmail first (easiest to set up)
