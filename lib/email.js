import nodemailer from 'nodemailer';

/**
 * Outgoing email over SMTP (AWS SES in production).
 * Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM. Without them, emails are printed to the
 * server log instead, so password resets and contact messages still work in development.
 */

const env = (name) => (process.env[name] || '').trim().replace(/^["']|["']$/g, '');

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  if (!host || !user || !pass) {
    transporter = null;
    return transporter;
  }
  const port = Number(env('SMTP_PORT') || 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = TLS from the start; 587 = STARTTLS, required below
    requireTLS: port !== 465,
    auth: { user, pass },
  });
  return transporter;
}

const fromAddress = () => env('EMAIL_FROM') || 'QR-Genie <noreply@qr-genie.co>';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Send one email; returns true when the SMTP server accepted it */
async function send(message, label) {
  const smtp = getTransporter();
  if (!smtp) {
    console.log(`\n📧 ===== ${label} (SMTP not configured, not sent) =====`);
    console.log('To:', message.to);
    if (message.replyTo) console.log('Reply-To:', message.replyTo);
    console.log('Subject:', message.subject);
    console.log(message.text);
    console.log('==================================================\n');
    return false;
  }
  try {
    const info = await smtp.sendMail({ from: fromAddress(), ...message });
    console.log(`${label} sent:`, info.messageId);
    return true;
  } catch (error) {
    console.error(`${label} failed:`, error.message);
    return false;
  }
}

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset URL with token
 * @param {string} userName - User's name (optional)
 * @returns {Promise<boolean>} - true if the email was sent
 */
export async function sendPasswordResetEmail(to, resetUrl, userName = null) {
  const greeting = userName ? `Hello ${userName},` : 'Hello,';
  const year = new Date().getFullYear();

  return send(
    {
      to,
      subject: 'Reset your password - QR-Genie',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e293b; margin-top: 0;">Reset your password</h1>
            <p>${escapeHtml(greeting)}</p>
            <p>We received a request to reset the password for your QR-Genie account.</p>
            <p>Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Reset password</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #64748b; font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">${escapeHtml(resetUrl)}</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">This link expires in 1 hour.</p>
            <p style="color: #64748b; font-size: 14px;">If you didn't ask to reset your password, you can ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${year} QR-Genie. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
      text: [
        'Reset your password - QR-Genie',
        '',
        greeting,
        '',
        'We received a request to reset the password for your QR-Genie account.',
        'Open this link to choose a new password:',
        resetUrl,
        '',
        'This link expires in 1 hour.',
        "If you didn't ask to reset your password, you can ignore this email.",
        '',
        `© ${year} QR-Genie. All rights reserved.`,
      ].join('\n'),
    },
    'Password reset email'
  );
}

/**
 * Forward a contact-form message to the support inbox. Plain text only, because the content is user input;
 * replying goes straight to the sender. Returns false (the message stays in the database) if it can't be sent.
 */
export async function sendContactNotification({ to, name, email, topicLabel, message, messageId }) {
  return send(
    {
      to,
      replyTo: `${name} <${email}>`,
      subject: `[QR-Genie] ${topicLabel} from ${name}`,
      text: [
        'New message from the QR-Genie contact form',
        '',
        `From: ${name} <${email}>`,
        `Topic: ${topicLabel}`,
        `Reference: ${messageId}`,
        '',
        message,
      ].join('\n'),
    },
    'Contact form notification'
  );
}
