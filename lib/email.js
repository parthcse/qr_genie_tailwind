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

/** False when SMTP isn't set up (emails go to the log), so callers don't report a log-only email as a failure */
export const emailConfigured = () => !!getTransporter();

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
    for (const file of message.attachments || []) console.log(`Attachment: ${file.filename} (${Math.round(file.content.length / 1024)} KB)`);
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

const siteUrl = () => (env('NEXT_PUBLIC_APP_URL') || env('NEXT_PUBLIC_BASE_URL') || 'https://qr-genie.co').replace(/\/$/, '');

// Subject lines are plain text: keep user-provided parts on one line
const oneLine = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

/**
 * Branded shell for HTML emails: logo, a white card with a brand-coloured top edge, and a footer.
 * Tables and inline styles only, because email clients ignore stylesheets. `body` must already be escaped.
 */
function emailLayout({ title, preheader, body, footerNote = '' }) {
  const site = siteUrl();
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#334155;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="padding:0 4px 18px;">
<a href="${site}" style="text-decoration:none;color:#4338ca;font-size:20px;font-weight:700;"><img src="${site}/favicon.png" width="32" height="32" alt="" style="vertical-align:middle;border:0;border-radius:8px;margin-right:8px;">QR-Genie</a>
</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;border-top:4px solid #6d28d9;padding:32px 28px;">
${body}
</td></tr>
<tr><td style="padding:20px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#475569;">
${footerNote}${footerNote ? '<br>' : ''}&copy; ${year} QR-Genie &middot; <a href="${site}" style="color:#475569;">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const emailHeading = (text) => `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(text)}</h1>`;
const emailSubheading = (text) => `<h2 style="margin:28px 0 10px;font-size:15px;color:#0f172a;">${escapeHtml(text)}</h2>`;
const emailParagraph = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${html}</p>`;
const emailButton = (href, label) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>`;

/** Label / value table; rows with an empty value are left out. Values are escaped here. */
function emailDetails(rows) {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate;font-size:14px;">${shown
    .map(([label, value], i) => {
      const line = i ? 'border-top:1px solid #e2e8f0;' : '';
      return `<tr><td style="padding:10px 14px;color:#475569;width:40%;vertical-align:top;${line}">${escapeHtml(label)}</td><td style="padding:10px 14px;color:#0f172a;font-weight:600;word-break:break-word;${line}">${escapeHtml(value)}</td></tr>`;
    })
    .join('')}</table>`;
}
const textDetails = (rows) =>
  rows.filter(([, value]) => value !== null && value !== undefined && value !== '').map(([label, value]) => `${label}: ${value}`);

/**
 * The 6-digit code that confirms an email address (lib/emailVerification.js).
 * purpose "signup": a new account; "change": a new address entered on the account page.
 */
export async function sendVerificationCodeEmail({ to, name, code, minutes, purpose = 'signup' }) {
  const site = siteUrl();
  const hello = name ? `Hi ${name},` : 'Hi,';
  const isChange = purpose === 'change';
  const subject = `${code} is your QR-Genie verification code`;
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  const heading = isChange ? 'Confirm your new email address' : 'Confirm your email address';
  const lead = isChange
    ? 'Enter this code on your QR-Genie account page to start signing in with this address:'
    : 'Enter this code on the QR-Genie page you just came from to finish creating your account:';
  const retryPath = isChange ? '/dashboard/account' : '/auth/verify-email';
  const retryLabel = isChange ? 'account page' : 'verification page';
  const ignore = isChange
    ? "Didn't ask to change your QR-Genie email? You can ignore this email; nothing changes without this code."
    : "Didn't sign up for QR-Genie? Someone may have typed your address by mistake. You can ignore this email.";

  const html = emailLayout({
    title: subject,
    preheader: `Your code is ${spaced}. It expires in ${minutes} minutes.`,
    body: [
      emailHeading(heading),
      emailParagraph(escapeHtml(hello)),
      emailParagraph(lead),
      `<div style="margin:24px 0;text-align:center;"><div style="display:inline-block;padding:16px 28px;border-radius:14px;background:#eef2ff;border:1px solid #c7d2fe;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#312e81;">${escapeHtml(code)}</div></div>`,
      emailParagraph(`<span style="font-size:14px;color:#475569;">The code expires in ${minutes} minutes. If it has expired, ask for a new one on the <a href="${site}${retryPath}" style="color:#4338ca;">${retryLabel}</a>.</span>`),
      emailParagraph(`<span style="font-size:13px;color:#475569;">${escapeHtml(ignore)}</span>`),
    ].join('\n'),
  });

  const text = [
    heading,
    '',
    hello,
    '',
    lead,
    '',
    `    ${code}`,
    '',
    `The code expires in ${minutes} minutes. Need a new one? ${site}${retryPath}`,
    '',
    ignore,
  ].join('\n');

  return send({ to, subject, html, text }, isChange ? 'Email change code' : 'Verification code email');
}

/** Sent to the old address after the sign-in email was changed, so an unexpected change gets noticed */
export async function sendEmailChangedNotice({ to, name, newEmail }) {
  const site = siteUrl();
  const hello = name ? `Hi ${name},` : 'Hi,';
  const subject = 'Your QR-Genie sign-in email was changed';
  const contact = `${site}/contact?topic=privacy`;

  const html = emailLayout({
    title: subject,
    preheader: `From now on you sign in with ${newEmail}.`,
    body: [
      emailHeading('Your sign-in email was changed'),
      emailParagraph(escapeHtml(hello)),
      emailParagraph(
        `The email address for your QR-Genie account was changed to <strong style="color:#0f172a;">${escapeHtml(newEmail)}</strong>. From now on, sign in with that address. This address will no longer receive account emails.`
      ),
      emailParagraph(
        `If you made this change, there's nothing else to do. <strong style="color:#0f172a;">If you didn't</strong>, <a href="${contact}" style="color:#4338ca;">contact us</a> straight away.`
      ),
    ].join('\n'),
  });

  const text = [
    'Your sign-in email was changed',
    '',
    hello,
    '',
    `The email address for your QR-Genie account was changed to ${newEmail}. From now on, sign in with that address.`,
    'This address will no longer receive account emails.',
    '',
    `If you made this change, there's nothing else to do. If you didn't, contact us straight away: ${contact}`,
  ].join('\n');

  return send({ to, subject, html, text }, 'Email changed notice');
}

/**
 * Plan email to the customer. kind "new": the Basic Package has just started; kind "renewal": a later monthly
 * payment went through. details: { planName, price, amountPaid, method, paidOn, renewsOn, paymentId,
 * subscriptionId, reactivatedCount, features } (all display strings, any may be missing).
 */
export async function sendPlanEmailToCustomer({ to, name, kind, details, supportEmail }) {
  const site = siteUrl();
  const hello = name ? `Hi ${name},` : 'Hi,';
  const isNew = kind !== 'renewal';
  const subject = isNew ? 'Your QR-Genie Basic Package is active' : 'Payment received: your QR-Genie plan is renewed';
  const heading = isNew ? 'Your Basic Package is active' : 'Your plan has been renewed';
  const lead = isNew
    ? 'Thank you for subscribing to QR-Genie. Your payment went through and your Basic Package is now active.'
    : `We've received your payment${details.amountPaid ? ` of ${details.amountPaid}` : ''}. Your Basic Package carries on without interruption.`;
  const reactivated =
    isNew && details.reactivatedCount > 0
      ? `We've also switched back on ${details.reactivatedCount} QR code${details.reactivatedCount === 1 ? '' : 's'} that ${details.reactivatedCount === 1 ? 'was' : 'were'} paused when your previous plan ended.`
      : '';
  const rows = [
    ['Plan', details.planName],
    ['Price', details.price],
    ['Amount paid', details.amountPaid],
    ['Paid with', details.method],
    [isNew ? 'Started on' : 'Paid on', details.paidOn],
    ['Next renewal', details.renewsOn],
    ['Payment ID', details.paymentId],
    ['Subscription ID', isNew ? details.subscriptionId : null],
  ];
  const features = isNew && details.features?.length ? details.features : [];
  const renewalNote = details.renewsOn
    ? `Your plan renews automatically on ${details.renewsOn}.`
    : 'Your plan renews automatically each billing period.';

  const html = emailLayout({
    title: subject,
    preheader: isNew ? 'Thanks for subscribing. Here are your plan details.' : `Thanks for your payment. Next renewal: ${details.renewsOn || 'next billing period'}.`,
    body: [
      emailHeading(heading),
      emailParagraph(escapeHtml(hello)),
      emailParagraph(escapeHtml(lead)),
      reactivated ? emailParagraph(escapeHtml(reactivated)) : '',
      emailSubheading(isNew ? 'Plan details' : 'Payment details'),
      emailDetails(rows),
      features.length
        ? emailSubheading("What's included") +
          `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">${features
            .map((f) => `<tr><td style="padding:3px 10px 3px 0;color:#059669;font-weight:700;vertical-align:top;">&#10003;</td><td style="padding:3px 0;">${escapeHtml(f)}</td></tr>`)
            .join('')}</table>`
        : '',
      `<div style="margin:28px 0 8px;">${emailButton(`${site}/dashboard`, isNew ? 'Go to your dashboard' : 'Open QR-Genie')}</div>`,
      emailParagraph(
        `<span style="font-size:13px;color:#475569;">${escapeHtml(renewalNote)} See your plan, or cancel it any time, on the <a href="${site}/dashboard/billing" style="color:#4338ca;">billing page</a>; our <a href="${site}/refund-policy" style="color:#4338ca;">refund policy</a> explains what happens to your payment.</span>`
      ),
    ].join('\n'),
    footerNote: `Questions? Reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#475569;">${escapeHtml(supportEmail)}</a>.<br>Payments are processed securely by Razorpay.`,
  });

  const text = [
    heading,
    '',
    hello,
    '',
    lead,
    ...(reactivated ? ['', reactivated] : []),
    '',
    isNew ? 'Plan details' : 'Payment details',
    ...textDetails(rows),
    ...(features.length ? ['', "What's included", ...features.map((f) => `- ${f}`)] : []),
    '',
    `Dashboard: ${site}/dashboard`,
    `Billing: ${site}/dashboard/billing`,
    '',
    `${renewalNote} To cancel, use the billing page: ${site}/dashboard/billing`,
    `Refund policy: ${site}/refund-policy`,
    '',
    `Questions? Reply to this email or write to ${supportEmail}.`,
    'Payments are processed securely by Razorpay.',
  ].join('\n');

  return send({ to, replyTo: supportEmail, subject, html, text }, isNew ? 'Plan activated email' : 'Plan renewed email');
}

/**
 * Plan email to the admin: a new subscriber (kind "new") or a renewal payment (kind "renewal").
 * customer: { name, email, company, telephone, country, signedUpOn, previousPlan }. Replying goes to the customer.
 */
export async function sendPlanEmailToAdmin({ to, kind, customer, details, activeSubscribers, source }) {
  const isNew = kind !== 'renewal';
  const who = customer.name ? `${customer.name} (${customer.email})` : customer.email;
  const subject = isNew
    ? `[QR-Genie] New subscriber: ${oneLine(who)}${details.price ? ` - ${details.price}` : ''}`
    : `[QR-Genie] Renewal: ${oneLine(customer.email)}${details.amountPaid ? ` - ${details.amountPaid}` : ''}`;
  const heading = isNew ? 'New subscriber' : 'Subscription renewed';
  const lead = isNew ? `${who} has just subscribed to the Basic Package.` : `${who} has paid for another period of the Basic Package.`;
  const customerRows = [
    ['Name', customer.name],
    ['Email', customer.email],
    ['Company', customer.company],
    ['Phone', customer.telephone],
    ['Country', customer.country],
    ['Signed up', customer.signedUpOn],
    ['Plan before', isNew ? customer.previousPlan : null],
  ];
  const paymentRows = [
    ['Plan', details.planName],
    ['Price', details.price],
    ['Amount paid', details.amountPaid],
    ['Paid with', details.method],
    ['Paid on', details.paidOn],
    ['Next renewal', details.renewsOn],
    ['Payment ID', details.paymentId],
    ['Subscription ID', details.subscriptionId],
    ['Razorpay customer ID', details.customerId],
    ['Confirmed by', source === 'webhook' ? 'Razorpay webhook' : 'Checkout'],
    ['QR codes switched back on', details.reactivatedCount > 0 ? String(details.reactivatedCount) : null],
  ];
  const dashboard = 'https://dashboard.razorpay.com/app';
  const links = [
    details.paymentId ? emailButton(`${dashboard}/payments/${details.paymentId}`, 'Payment in Razorpay') : '',
    details.subscriptionId
      ? `<a href="${escapeHtml(`${dashboard}/subscriptions/${details.subscriptionId}`)}" style="display:inline-block;margin-left:8px;padding:12px 4px;color:#4338ca;font-weight:600;font-size:14px;">Subscription in Razorpay</a>`
      : '',
  ].join('');

  const html = emailLayout({
    title: subject,
    preheader: lead,
    body: [
      emailHeading(heading),
      emailParagraph(escapeHtml(lead)),
      emailSubheading('Customer'),
      emailDetails(customerRows),
      emailSubheading('Payment'),
      emailDetails(paymentRows),
      typeof activeSubscribers === 'number'
        ? emailParagraph(`<span style="display:inline-block;margin-top:20px;font-size:14px;">Paying subscribers now: <strong style="color:#0f172a;">${activeSubscribers}</strong></span>`)
        : '',
      links ? `<div style="margin:12px 0 4px;">${links}</div>` : '',
    ].join('\n'),
    footerNote: 'Sent to the QR-Genie admin inbox. Reply to answer the customer directly.',
  });

  const text = [
    heading,
    '',
    lead,
    '',
    'Customer',
    ...textDetails(customerRows),
    '',
    'Payment',
    ...textDetails(paymentRows),
    ...(typeof activeSubscribers === 'number' ? ['', `Paying subscribers now: ${activeSubscribers}`] : []),
    ...(details.paymentId ? ['', `Payment: ${dashboard}/payments/${details.paymentId}`] : []),
    ...(details.subscriptionId ? [`Subscription: ${dashboard}/subscriptions/${details.subscriptionId}`] : []),
  ].join('\n');

  return send(
    // Address object, so a comma or "<" in the customer's name can't break the header
    { to, replyTo: { name: oneLine(customer.name || customer.email), address: customer.email }, subject, html, text },
    isNew ? 'New subscriber email' : 'Renewal admin email'
  );
}

/** Sent when a customer cancels the Basic Package on the billing page. endsOn: the last day of the paid period. */
export async function sendCancellationEmailToCustomer({ to, name, endsOn, supportEmail }) {
  const site = siteUrl();
  const hello = name ? `Hi ${name},` : 'Hi,';
  const subject = 'Your QR-Genie subscription is cancelled';
  const until = endsOn ? ` until ${endsOn}` : ' until the end of the period you have paid for';
  const lead = "We've cancelled your Basic Package as you asked. You won't be charged again.";

  const html = emailLayout({
    title: subject,
    preheader: `Your plan stays active${until}. You won't be charged again.`,
    body: [
      emailHeading('Your subscription is cancelled'),
      emailParagraph(escapeHtml(hello)),
      emailParagraph(escapeHtml(lead)),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;border:1px solid #fde68a;border-radius:14px;border-collapse:separate;background:#fffbeb;"><tr><td style="padding:18px 20px;">
<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#b45309;">Your plan stays active until</div>
<div style="margin-top:6px;font-size:24px;font-weight:800;color:#0f172a;">${escapeHtml(endsOn || 'the end of your paid period')}</div>
<div style="margin-top:8px;font-size:14px;line-height:1.6;color:#475569;">Until then everything works as usual. After that date your QR codes are paused. Nothing is deleted: if you subscribe again, they work straight away with the same links.</div>
</td></tr></table>`,
      `<div style="margin:22px 0 8px;">${emailButton(`${site}/dashboard/billing`, 'View billing')}</div>`,
      emailParagraph(
        `<span style="font-size:13px;color:#475569;">Changed your mind? You can subscribe again on the billing page once this period ends. If you'd like a refund for the days you won't use, see our <a href="${site}/refund-policy" style="color:#4338ca;">refund policy</a>.</span>`
      ),
    ].join('\n'),
    footerNote: `Questions? Reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#475569;">${escapeHtml(supportEmail)}</a>.`,
  });

  const text = [
    'Your subscription is cancelled',
    '',
    hello,
    '',
    lead,
    '',
    `Your plan stays active${until}. Until then everything works as usual. After that date your QR codes are paused.`,
    'Nothing is deleted: if you subscribe again, they work straight away with the same links.',
    '',
    `Billing: ${site}/dashboard/billing`,
    `Refund policy: ${site}/refund-policy`,
    '',
    `Questions? Reply to this email or write to ${supportEmail}.`,
  ].join('\n');

  return send({ to, replyTo: supportEmail, subject, html, text }, 'Cancellation email');
}

/** Admin notice that a customer cancelled; replying goes to the customer */
export async function sendCancellationEmailToAdmin({ to, customer, endsOn, reason, subscriptionId }) {
  const who = customer.name ? `${customer.name} (${customer.email})` : customer.email;
  const subject = `[QR-Genie] Cancelled: ${oneLine(customer.email)}${endsOn ? ` - ends ${endsOn}` : ''}`;
  const lead = `${who} has cancelled the Basic Package on the billing page. It won't renew.`;
  const rows = [
    ['Name', customer.name],
    ['Email', customer.email],
    ['Company', customer.company],
    ['Plan ends on', endsOn],
    ['Reason given', reason || 'None given'],
    ['Subscription ID', subscriptionId],
  ];
  const dashboard = 'https://dashboard.razorpay.com/app';

  const html = emailLayout({
    title: subject,
    preheader: lead,
    body: [
      emailHeading('Subscription cancelled'),
      emailParagraph(escapeHtml(lead)),
      emailDetails(rows),
      subscriptionId ? `<div style="margin:20px 0 4px;">${emailButton(`${dashboard}/subscriptions/${subscriptionId}`, 'Subscription in Razorpay')}</div>` : '',
    ].join('\n'),
    footerNote: 'Sent to the QR-Genie admin inbox. Reply to answer the customer directly.',
  });

  const text = [
    'Subscription cancelled',
    '',
    lead,
    '',
    ...textDetails(rows),
    ...(subscriptionId ? ['', `Subscription: ${dashboard}/subscriptions/${subscriptionId}`] : []),
  ].join('\n');

  return send(
    { to, replyTo: { name: oneLine(customer.name || customer.email), address: customer.email }, subject, html, text },
    'Cancellation admin email'
  );
}

/**
 * The GST tax invoice for a payment (lib/invoices/invoices.js), with the PDF attached. invoice: the display text from
 * describeInvoice (lib/invoices/invoiceFormat.js) plus method and paymentId.
 */
export async function sendInvoiceEmail({ to, name, invoice, pdf, supportEmail }) {
  const site = siteUrl();
  const hello = name ? `Hi ${name},` : 'Hi,';
  const subject = `Your QR-Genie invoice ${invoice.number}`;
  const lead = 'Here is your tax invoice for the QR-Genie Basic Package. The PDF is attached to this email, so you can save it for your records.';
  const sizeKb = Math.max(1, Math.round(pdf.length / 1024));
  const accountLink = `${site}/dashboard/account?tab=billing`;
  const billingNote = 'The name, address and GSTIN on your invoices come from Billing information on your account page. Changes there apply to your next invoice.';

  const line = (label, value, { total = false } = {}) => {
    const edge = total ? 'border-top:1px solid #e2e8f0;padding-top:12px;' : '';
    return `<tr><td style="padding:6px 0;font-size:14px;color:${total ? '#0f172a' : '#475569'};font-weight:${total ? 700 : 400};${edge}">${escapeHtml(label)}</td><td align="right" style="padding:6px 0;font-size:${total ? 17 : 14}px;color:#0f172a;font-weight:${total ? 800 : 600};white-space:nowrap;${edge}">${escapeHtml(value)}</td></tr>`;
  };
  const details = [
    ['Service period', invoice.period],
    ['Paid with', invoice.method],
    ['Payment ID', invoice.paymentId],
  ].filter(([, value]) => value);
  const breakdown = [[invoice.taxableLabel, invoice.taxable], ...invoice.taxRows.map((row) => [row.label, row.amount])];

  const receipt = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:14px;border-collapse:separate;">
<tr><td style="background:#f5f3ff;border-radius:14px 14px 0 0;border-bottom:1px solid #ede9fe;padding:20px 22px;">
<div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6d28d9;">Amount paid</div>
<div style="margin-top:6px;"><span style="font-size:30px;line-height:1.2;font-weight:800;color:#0f172a;vertical-align:middle;">${escapeHtml(invoice.total)}</span><span style="display:inline-block;margin-left:10px;padding:3px 10px;border-radius:999px;background:#d1fae5;color:#047857;font-size:11px;font-weight:700;letter-spacing:0.5px;vertical-align:middle;">PAID</span></div>
<div style="margin-top:6px;font-size:13px;color:#475569;">Invoice ${escapeHtml(invoice.number)} &middot; ${escapeHtml(invoice.issuedOn)}</div>
</td></tr>
<tr><td style="padding:10px 22px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${details.map(([label, value]) => line(label, value)).join('')}</table></td></tr>
<tr><td style="padding:4px 22px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed #cbd5e1;margin-top:6px;">
<tr><td colspan="2" style="padding:12px 0 2px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#475569;">Price breakdown</td></tr>
${breakdown.map(([label, value]) => line(label, value)).join('')}
${line(invoice.totalLabel, invoice.total, { total: true })}
</table></td></tr>
</table>`;

  const attachment = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate;">
<tr><td width="48" style="padding:12px 0 12px 14px;vertical-align:middle;"><div style="width:34px;height:40px;border-radius:6px;background:#fee2e2;color:#b91c1c;font-size:10px;font-weight:800;line-height:40px;text-align:center;">PDF</div></td>
<td style="padding:12px 14px;vertical-align:middle;"><div style="font-size:14px;font-weight:600;color:#0f172a;word-break:break-all;">${escapeHtml(invoice.filename)}</div><div style="font-size:12px;color:#475569;">Tax invoice &middot; ${sizeKb} KB &middot; attached to this email</div></td></tr>
</table>`;

  const html = emailLayout({
    title: subject,
    preheader: `${invoice.total} paid on ${invoice.paidOn}. Your GST invoice is attached as a PDF.`,
    body: [
      emailHeading('Thanks for your payment'),
      emailParagraph(escapeHtml(hello)),
      emailParagraph(escapeHtml(lead)),
      receipt,
      attachment,
      `<div style="margin:26px 0 8px;">${emailButton(`${site}/dashboard/billing`, 'View billing')}</div>`,
      emailParagraph(`<span style="font-size:13px;color:#475569;">The name, address and GSTIN on your invoices come from <a href="${accountLink}" style="color:#4338ca;">Billing information</a> on your account page. Changes there apply to your next invoice.</span>`),
    ].join('\n'),
    footerNote: `Questions about this invoice? Reply to this email or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#475569;">${escapeHtml(supportEmail)}</a>.<br>Payments are processed securely by Razorpay.`,
  });

  const text = [
    'Thanks for your payment',
    '',
    hello,
    '',
    lead,
    '',
    `Invoice: ${invoice.number}`,
    `Invoice date: ${invoice.issuedOn}`,
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    ...breakdown.map(([label, value]) => `${label}: ${value}`),
    `${invoice.totalLabel}: ${invoice.total}`,
    '',
    `Attached: ${invoice.filename}`,
    `Billing: ${site}/dashboard/billing`,
    '',
    `${billingNote} ${accountLink}`,
    '',
    `Questions about this invoice? Reply to this email or write to ${supportEmail}.`,
  ].join('\n');

  return send(
    {
      to,
      replyTo: supportEmail,
      subject,
      html,
      text,
      attachments: [{ filename: invoice.filename, content: pdf, contentType: 'application/pdf' }],
    },
    'Invoice email'
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
