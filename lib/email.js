import { Resend } from 'resend';

// Initialize Resend (will be null if API key not set)
let resend = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.warn('Resend initialization failed:', error.message);
  resend = null;
}

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset URL with token
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
export async function sendPasswordResetEmail(to, resetUrl, userName = null) {
  // If Resend is not configured (no API key), log to console for development
  if (!resend) {
    console.log('\n📧 ===== PASSWORD RESET EMAIL (Development Mode) =====');
    console.log('To:', to);
    console.log('Subject: Reset Your Password - QR-Genie');
    console.log('Reset Link:', resetUrl);
    console.log('Note: Copy this link and paste it in your browser to reset password');
    console.log('==================================================\n');
    return true; // Return true so the flow continues normally
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'QR-Genie <onboarding@resend.dev>',
      to: [to],
      subject: 'Reset Your Password - QR-Genie',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; margin-top: 0;">Reset Your Password</h1>
            <p>Hello${userName ? ` ${userName}` : ''},</p>
            <p>We received a request to reset your password for your QR-Genie account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #64748b; font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} QR-Genie. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - QR-Genie
        
        Hello${userName ? ` ${userName}` : ''},
        
        We received a request to reset your password for your QR-Genie account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, you can safely ignore this email.
        
        © ${new Date().getFullYear()} QR-Genie. All rights reserved.
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

