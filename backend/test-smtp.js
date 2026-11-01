import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function testSMTP() {
  console.log('Testing SMTP configuration...\n');
  
  console.log('SMTP Settings:');
  console.log(`Host: ${process.env.VITE_SMTP_HOST}`);
  console.log(`Port: ${process.env.VITE_SMTP_PORT}`);
  console.log(`User: ${process.env.VITE_SMTP_USER}`);
  console.log(`From: ${process.env.VITE_SMTP_FROM}\n`);

  const transporter = nodemailer.createTransport({
    host: process.env.VITE_SMTP_HOST,
    port: parseInt(process.env.VITE_SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.VITE_SMTP_USER,
      pass: process.env.VITE_SMTP_PASS,
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    const testEmail = process.env.VITE_SMTP_USER;
    console.log(`Sending test email to: ${testEmail}`);
    
    await transporter.sendMail({
      from: process.env.VITE_SMTP_FROM,
      to: testEmail,
      subject: 'SMTP Test - AI Interview Coach',
      html: `
        <h2>SMTP Configuration Test</h2>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <p><strong>Test OTP:</strong> 123456</p>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('\nYour SMTP configuration is working correctly.');
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
    console.log('\nPlease check your SMTP credentials in the .env file.');
  }
}

testSMTP();
