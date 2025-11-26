import { Resend } from 'resend';

// Lazy-initialized Resend client (avoids build-time errors when API key is not set)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Default sender - uses verified Resend domain
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Employee Hub <noreply@resend.adrian-rusan.com>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 *
 * @param options - Email sending options
 * @returns Result object with success status, email ID, or error message
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   html: '<p>Welcome to our app</p>',
 *   text: 'Welcome to our app'
 * });
 *
 * if (result.success) {
 *   console.log('Email sent:', result.id);
 * } else {
 *   console.error('Email failed:', result.error);
 * }
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // Get Resend client (lazy initialization)
    const resend = getResendClient();
    if (!resend) {
      console.error('RESEND_API_KEY is not configured');
      return {
        success: false,
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.'
      };
    }

    // Validate required fields
    if (!options.to || !options.subject || !options.html) {
      return {
        success: false,
        error: 'Missing required email fields: to, subject, and html are required'
      };
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred while sending email'
    };
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send multiple emails in batch (with rate limiting consideration)
 *
 * @param emails - Array of email options
 * @returns Array of results for each email
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];

  // Send emails sequentially to avoid rate limiting
  for (const emailOptions of emails) {
    const result = await sendEmail(emailOptions);
    results.push(result);

    // Small delay between emails to avoid rate limiting
    if (results.length < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
