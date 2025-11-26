/**
 * Type definitions for email service
 */

// Re-export types from Resend for convenience
export type { SendEmailOptions, SendEmailResult } from './index';

/**
 * Email template data types
 */
export type {
  VerificationEmailData,
  PasswordResetEmailData,
  InvitationEmailData,
  WelcomeEmailData,
  AbsenceStatusEmailData,
  AbsenceRequestEmailData,
  FeedbackReceivedEmailData,
} from './templates';

/**
 * Email template names
 */
export type EmailTemplateName =
  | 'verification'
  | 'passwordReset'
  | 'invitation'
  | 'welcome'
  | 'absenceStatus'
  | 'absenceRequest'
  | 'feedbackReceived';

/**
 * Email template result
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email job for queue
 */
export interface EmailJob {
  to: string | string[];
  template: EmailTemplateName;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
}

/**
 * Email delivery status
 */
export interface EmailDeliveryStatus {
  id: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';
  timestamp: Date;
  error?: string;
}

/**
 * Verification token types from Prisma
 */
export type TokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';

/**
 * Token verification result
 */
export interface TokenData {
  id: string;
  identifier: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  appName: string;
  appUrl: string;
  from: string;
}

/**
 * Email statistics
 */
export interface EmailStats {
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  complained: number;
  deliveryRate: number;
}

/**
 * Batch email result
 */
export interface BatchEmailResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}

/**
 * Email retry configuration
 */
export interface EmailRetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
}

/**
 * Email queue options
 */
export interface EmailQueueOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  priority?: number;
  delay?: number;
}
