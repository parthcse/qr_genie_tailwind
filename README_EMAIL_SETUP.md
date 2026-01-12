# Email Setup for Password Reset

## Development Mode (Localhost)

By default, the password reset system works in **development mode** without any email service configuration. When you request a password reset:

1. The reset token is generated and saved to the database
2. The reset link is **logged to the console** (check your terminal/server logs)
3. You can copy the link from the console and use it to reset your password

**Example console output:**
```
📧 ===== PASSWORD RESET EMAIL (Development Mode) =====
To: user@example.com
Subject: Reset Your Password - QR-Genie
Reset Link: http://localhost:3000/auth/reset-password?token=abc123...
Note: Copy this link and paste it in your browser to reset password
==================================================
```

### ⚠️ About HTTP vs HTTPS on Localhost

- **Email sending works fine on localhost** - The Resend API uses HTTPS to send emails
- **Reset links can be HTTP for localhost** - `http://localhost:3000` works perfectly for development
- **Some email clients may warn** about HTTP links, but they still work
- **For production**, always use HTTPS URLs in your `NEXT_PUBLIC_APP_URL`

## Production Mode (Real Emails)

To send actual emails in production, you need to set up **Resend**:

### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com) (free tier available)
2. Go to API Keys section
3. Create a new API key
4. Copy the API key

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=QR-Genie <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Note:** 
- `RESEND_FROM_EMAIL` must be a verified domain in Resend (or use their default `onboarding@resend.dev` for testing)
- `NEXT_PUBLIC_APP_URL` should be your production domain

### Step 3: Verify Domain (Production)

For production, you'll need to:
1. Add your domain in Resend dashboard
2. Add the DNS records they provide
3. Wait for verification
4. Update `RESEND_FROM_EMAIL` to use your verified domain

## Testing

### Localhost Testing
- No setup needed! Just check console logs for reset links
- The system automatically falls back to console logging if `RESEND_API_KEY` is not set

### Production Testing
- Set `RESEND_API_KEY` in your environment
- Use Resend's test mode or verify your domain
- Test the full email flow

## Alternative Email Services

If you prefer a different email service, you can modify `lib/email.js` to use:
- **SendGrid** - `@sendgrid/mail`
- **AWS SES** - `@aws-sdk/client-ses`
- **Mailgun** - `mailgun.js`
- **Nodemailer** - Works with Gmail, SMTP, etc.

The `sendPasswordResetEmail` function in `lib/email.js` is the only place you need to modify.

