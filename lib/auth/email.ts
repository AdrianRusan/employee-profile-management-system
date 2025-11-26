/**
 * Email service for authentication flows
 *
 * TODO: Integrate with a real email service provider:
 * - SendGrid
 * - AWS SES
 * - Postmark
 * - Resend
 * - Mailgun
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@yourapp.com';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email (currently logs to console in development)
 */
async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('\n=== Email ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || 'N/A'}`);
    console.log(`HTML: ${html}`);
    console.log('=============\n');
    return;
  }

  // TODO: Implement real email sending
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to,
  //   from: FROM_EMAIL,
  //   subject,
  //   html,
  //   text,
  // });

  throw new Error('Email sending not configured. Please set up an email provider.');
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  const html = `
    <h1>Verify your email address</h1>
    <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
    <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;

  const text = `
Verify your email address

Thanks for signing up! Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const html = `
    <h1>Reset your password</h1>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;

  const text = `
Reset your password

You requested to reset your password. Click the link below to reset it:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
    text,
  });
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  token: string,
  inviterName: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/invite/${token}`;

  const html = `
    <h1>You've been invited to join ${organizationName}</h1>
    <p>${inviterName} has invited you to join ${organizationName}.</p>
    <p>Click the link below to accept the invitation and create your account:</p>
    <p><a href="${inviteUrl}">${inviteUrl}</a></p>
    <p>This invitation will expire in 7 days.</p>
  `;

  const text = `
You've been invited to join ${organizationName}

${inviterName} has invited you to join ${organizationName}.

Click the link below to accept the invitation and create your account:

${inviteUrl}

This invitation will expire in 7 days.
  `;

  await sendEmail({
    to: email,
    subject: `Invitation to join ${organizationName}`,
    html,
    text,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const html = `
    <h1>Welcome!</h1>
    <p>Hi ${name},</p>
    <p>Your account has been created successfully. You can now log in and start using the platform.</p>
    <p><a href="${APP_URL}/login">Log in to your account</a></p>
  `;

  const text = `
Welcome!

Hi ${name},

Your account has been created successfully. You can now log in and start using the platform.

Log in at: ${APP_URL}/login
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome!',
    html,
    text,
  });
}
