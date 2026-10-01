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
        `<span style="font-size:13px;color:#475569;">${escapeHtml(renewalNote)} See your plan on the <a href="${site}/dashboard/billing" style="color:#4338ca;">billing page</a>. To cancel, <a href="${site}/contact?topic=cancel" style="color:#4338ca;">contact us</a>; our <a href="${site}/refund-policy" style="color:#4338ca;">refund policy</a> explains what happens to your payment.</span>`
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
    `${renewalNote} To cancel, contact us: ${site}/contact?topic=cancel`,
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
