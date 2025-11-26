interface BaseEmailData {
  appName: string;
  appUrl: string;
}

interface VerificationEmailData extends BaseEmailData {
  userName: string;
  verificationUrl: string;
}

interface PasswordResetEmailData extends BaseEmailData {
  userName: string;
  resetUrl: string;
  expiresInHours: number;
}

interface InvitationEmailData extends BaseEmailData {
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  role: string;
  expiresInDays: number;
}

interface WelcomeEmailData extends BaseEmailData {
  userName: string;
  organizationName: string;
  loginUrl: string;
}

interface AbsenceStatusEmailData extends BaseEmailData {
  userName: string;
  status: 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  reason?: string;
  managerName: string;
}

interface FeedbackReceivedEmailData extends BaseEmailData {
  userName: string;
  fromName: string;
  feedbackPreview: string;
  viewUrl: string;
}

interface AbsenceRequestEmailData extends BaseEmailData {
  managerName: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  reviewUrl: string;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Employee Hub';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Base styles for all emails
const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f5f5f5;
  }
  .email-container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .header {
    text-align: center;
    padding: 30px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .logo {
    font-size: 28px;
    font-weight: bold;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 40px 30px;
  }
  .content h2 {
    margin: 0 0 20px 0;
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .content p {
    margin: 0 0 16px 0;
    color: #4a4a4a;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    transition: transform 0.2s;
  }
  .button:hover {
    transform: translateY(-2px);
  }
  .info-box {
    background-color: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 16px;
    margin: 24px 0;
    border-radius: 4px;
  }
  .info-box p {
    margin: 0;
  }
  .info-box strong {
    color: #1a1a1a;
  }
  .footer {
    text-align: center;
    padding: 24px 30px;
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }
  .footer p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
  }
  .muted {
    color: #6c757d;
    font-size: 14px;
    margin-top: 20px;
  }
  .divider {
    height: 1px;
    background-color: #e9ecef;
    margin: 24px 0;
  }
  ul {
    padding-left: 20px;
    margin: 16px 0;
  }
  ul li {
    margin: 8px 0;
    color: #4a4a4a;
  }
  blockquote {
    border-left: 3px solid #667eea;
    padding-left: 16px;
    margin: 20px 0;
    color: #555;
    font-style: italic;
  }
  .status-approved {
    color: #28a745;
    font-weight: 600;
  }
  .status-rejected {
    color: #dc3545;
    font-weight: 600;
  }
`;

export const emailTemplates = {
  /**
   * Email verification template
   */
  verification: (data: VerificationEmailData): { subject: string; html: string; text: string } => ({
    subject: `Verify your email for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>Verify your email address</h2>
            <p>Hi ${data.userName},</p>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div class="button-container">
              <a href="${data.verificationUrl}" class="button">Verify Email</a>
            </div>
            <p class="muted">This link will expire in 24 hours.</p>
            <div class="divider"></div>
            <p class="muted">If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Verify your email for ${data.appName}

Hi ${data.userName},

Thanks for signing up! Please verify your email address by visiting this link:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * Password reset template
   */
  passwordReset: (data: PasswordResetEmailData): { subject: string; html: string; text: string } => ({
    subject: `Reset your password for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>Reset your password</h2>
            <p>Hi ${data.userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div class="button-container">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            <p class="muted">This link will expire in ${data.expiresInHours} hours.</p>
            <div class="divider"></div>
            <p class="muted">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Reset your password for ${data.appName}

Hi ${data.userName},

We received a request to reset your password. Visit this link to create a new password:

${data.resetUrl}

This link will expire in ${data.expiresInHours} hours.

If you didn't request a password reset, you can safely ignore this email.

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * Team invitation template
   */
  invitation: (data: InvitationEmailData): { subject: string; html: string; text: string } => ({
    subject: `You've been invited to join ${data.organizationName} on ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p>Hi there,</p>
            <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong>.</p>
            <div class="info-box">
              <p><strong>Role:</strong> ${data.role}</p>
            </div>
            <div class="button-container">
              <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
            </div>
            <p class="muted">This invitation will expire in ${data.expiresInDays} days.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
You've been invited to join ${data.organizationName}

${data.inviterName} has invited you to join ${data.organizationName} as a ${data.role}.

Accept the invitation here:
${data.invitationUrl}

This invitation will expire in ${data.expiresInDays} days.

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * Welcome email after registration
   */
  welcome: (data: WelcomeEmailData): { subject: string; html: string; text: string } => ({
    subject: `Welcome to ${data.appName}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>Welcome aboard!</h2>
            <p>Hi ${data.userName},</p>
            <p>Welcome to <strong>${data.organizationName}</strong>! Your account is now set up and ready to go.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li>View and update your profile</li>
              <li>Request time off</li>
              <li>Give and receive feedback</li>
              <li>Track team activities</li>
            </ul>
            <div class="button-container">
              <a href="${data.loginUrl}" class="button">Go to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to ${data.appName}!

Hi ${data.userName},

Welcome to ${data.organizationName}! Your account is now set up and ready to go.

Here's what you can do:
- View and update your profile
- Request time off
- Give and receive feedback
- Track team activities

Go to your dashboard: ${data.loginUrl}

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * Absence status notification (for employees)
   */
  absenceStatus: (data: AbsenceStatusEmailData): { subject: string; html: string; text: string } => ({
    subject: `Your time-off request has been ${data.status}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>Time-off Request <span class="status-${data.status}">${data.status === 'approved' ? 'Approved' : 'Not Approved'}</span></h2>
            <p>Hi ${data.userName},</p>
            <p>Your time-off request has been <strong>${data.status}</strong> by ${data.managerName}.</p>
            <div class="info-box">
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>End Date:</strong> ${data.endDate}</p>
              ${data.reason ? `<p><strong>Manager's Note:</strong> ${data.reason}</p>` : ''}
            </div>
            <div class="button-container">
              <a href="${data.appUrl}/dashboard/absences" class="button">View Details</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your time-off request has been ${data.status}

Hi ${data.userName},

Your time-off request has been ${data.status} by ${data.managerName}.

Start Date: ${data.startDate}
End Date: ${data.endDate}
${data.reason ? `Manager's Note: ${data.reason}` : ''}

View details: ${data.appUrl}/dashboard/absences

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * New absence request notification (for managers)
   */
  absenceRequest: (data: AbsenceRequestEmailData): { subject: string; html: string; text: string } => ({
    subject: `New time-off request from ${data.employeeName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>New Time-off Request</h2>
            <p>Hi ${data.managerName},</p>
            <p><strong>${data.employeeName}</strong> has submitted a time-off request that requires your review.</p>
            <div class="info-box">
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>End Date:</strong> ${data.endDate}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            <div class="button-container">
              <a href="${data.reviewUrl}" class="button">Review Request</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New time-off request from ${data.employeeName}

Hi ${data.managerName},

${data.employeeName} has submitted a time-off request that requires your review.

Start Date: ${data.startDate}
End Date: ${data.endDate}
Reason: ${data.reason}

Review the request: ${data.reviewUrl}

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),

  /**
   * Feedback received notification
   */
  feedbackReceived: (data: FeedbackReceivedEmailData): { subject: string; html: string; text: string } => ({
    subject: `You received new feedback from ${data.fromName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>New Feedback Received</h2>
            <p>Hi ${data.userName},</p>
            <p><strong>${data.fromName}</strong> has given you feedback:</p>
            <blockquote>
              "${data.feedbackPreview}..."
            </blockquote>
            <div class="button-container">
              <a href="${data.viewUrl}" class="button">View Full Feedback</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
You received new feedback from ${data.fromName}

Hi ${data.userName},

${data.fromName} has given you feedback:

"${data.feedbackPreview}..."

View full feedback: ${data.viewUrl}

---
${data.appName} - ${new Date().getFullYear()}
    `.trim(),
  }),
};

// Helper to get app config
export function getEmailConfig(): BaseEmailData {
  return {
    appName: APP_NAME,
    appUrl: APP_URL,
  };
}

// Export types for external use
export type {
  VerificationEmailData,
  PasswordResetEmailData,
  InvitationEmailData,
  WelcomeEmailData,
  AbsenceStatusEmailData,
  AbsenceRequestEmailData,
  FeedbackReceivedEmailData,
};
