import { API_URL } from "./api";
const OTP_API_URL = `${API_URL}/api`;

export const otpService = {
  async sendOTP(email: string, name: string): Promise<void> {
    const response = await fetch(`${OTP_API_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send OTP');
    }

    return response.json();
  },

  async verifyOTP(email: string, otp: string): Promise<void> {
    const response = await fetch(`${OTP_API_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify OTP');
    }

    return response.json();
  },
};
