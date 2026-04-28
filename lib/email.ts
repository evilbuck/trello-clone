import { logger } from './logger';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@buckleyrobinson.com';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!BREVO_API_KEY) {
    logger.info({ to, resetUrl }, 'Email not configured (BREVO_API_KEY missing). Reset URL:');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Trello Clone', email: FROM_EMAIL },
        to: [{ email: to }],
        subject: 'Reset your password',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #18181b;">Reset your password</h2>
            <p>You requested a password reset for your Trello Clone account.</p>
            <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
            <p style="color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #71717a; font-size: 14px;">This link expires in 1 hour and can only be used once.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API error ${response.status}: ${errorBody}`);
    }

    logger.info({ to }, 'Password reset email sent via Brevo');
  } catch (error) {
    logger.error({ error, to }, 'Failed to send password reset email');
    throw error;
  }
}
