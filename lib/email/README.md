# Email Service

Transactional email service built with Resend for the Employee Management System.

## Features

- **Professional Email Templates**: Pre-built templates for common workflows
- **Type-Safe API**: Full TypeScript support with proper error handling
- **Token Management**: Secure token generation and verification for email flows
- **Batch Support**: Send multiple emails with rate limiting consideration
- **Multi-Tenant Ready**: Supports organization-specific branding

## Setup

### 1. Install Resend

```bash
npm install resend
```

### 2. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in your dashboard
3. Verify your sending domain

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
EMAIL_FROM=Employee Hub <noreply@yourdomain.com>
NEXT_PUBLIC_APP_NAME=Employee Hub
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### 4. Update Database Schema

Run Prisma migration to add the VerificationToken model:

```bash
npx prisma migrate dev --name add_verification_tokens
npx prisma generate
```

## Usage

### Sending Basic Emails

```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our app</h1>',
  text: 'Welcome to our app',
});

if (result.success) {
  console.log('Email sent:', result.id);
} else {
  console.error('Failed to send:', result.error);
}
```

### Using Pre-built Email Functions

```typescript
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAbsenceStatusEmail,
  sendAbsenceRequestEmail,
  sendFeedbackReceivedEmail,
} from '@/lib/email/send-emails';

// Email verification
await sendVerificationEmail('user@example.com', 'John Doe');

// Password reset
await sendPasswordResetEmail('user@example.com', 'John Doe');

// Welcome new user
await sendWelcomeEmail('user@example.com', 'John Doe', 'Acme Corp');

// Notify employee of absence status
await sendAbsenceStatusEmail(
  'employee@example.com',
  'John Doe',
  'approved',
  new Date('2025-12-01'),
  new Date('2025-12-05'),
  'Jane Manager',
  'Enjoy your vacation!'
);

// Notify manager of new absence request
await sendAbsenceRequestEmail(
  'manager@example.com',
  'Jane Manager',
  'John Doe',
  new Date('2025-12-01'),
  new Date('2025-12-05'),
  'Family vacation',
  'request_id_123'
);

// Notify user of feedback received
await sendFeedbackReceivedEmail(
  'user@example.com',
  'John Doe',
  'Jane Manager',
  'Great work on the project! Your attention to detail was excellent.'
);
```

### Token Management

```typescript
import { verifyToken, deleteToken, cleanupExpiredTokens } from '@/lib/email/send-emails';

// Verify a token (e.g., email verification, password reset)
const tokenData = await verifyToken('token_string', 'EMAIL_VERIFICATION');

if (tokenData) {
  // Token is valid, process the verification
  console.log('Token valid for:', tokenData.identifier);

  // Delete token after use
  await deleteToken('token_string');
} else {
  // Token is invalid or expired
  console.log('Invalid or expired token');
}

// Cleanup expired tokens (run via cron job)
const deletedCount = await cleanupExpiredTokens();
console.log(`Deleted ${deletedCount} expired tokens`);
```

### Batch Emails

```typescript
import { sendBatchEmails } from '@/lib/email';

const emails = [
  { to: 'user1@example.com', subject: 'Hello', html: '<p>Hi!</p>' },
  { to: 'user2@example.com', subject: 'Hello', html: '<p>Hi!</p>' },
];

const results = await sendBatchEmails(emails);
results.forEach((result, index) => {
  console.log(`Email ${index + 1}:`, result.success ? 'Sent' : 'Failed');
});
```

## Available Templates

### 1. Email Verification
Sent when a user signs up and needs to verify their email address.
- **Function**: `sendVerificationEmail()`
- **Token Expiry**: 24 hours

### 2. Password Reset
Sent when a user requests to reset their password.
- **Function**: `sendPasswordResetEmail()`
- **Token Expiry**: 2 hours

### 3. Team Invitation
Sent when an admin invites a new user to join the organization.
- **Function**: `sendInvitationEmail()`
- **Token Expiry**: 7 days

### 4. Welcome Email
Sent after a user completes registration or accepts an invitation.
- **Function**: `sendWelcomeEmail()`

### 5. Absence Status
Sent to employee when their time-off request is approved or rejected.
- **Function**: `sendAbsenceStatusEmail()`

### 6. Absence Request
Sent to managers when an employee submits a new time-off request.
- **Function**: `sendAbsenceRequestEmail()`

### 7. Feedback Received
Sent when a user receives new feedback from a colleague.
- **Function**: `sendFeedbackReceivedEmail()`

## Customizing Templates

Templates are located in `lib/email/templates.ts`. Each template returns:

```typescript
{
  subject: string;  // Email subject line
  html: string;     // HTML version (styled)
  text: string;     // Plain text version (fallback)
}
```

### Creating Custom Templates

```typescript
import { emailTemplates, getEmailConfig } from '@/lib/email/templates';

// Add to emailTemplates object in templates.ts
customTemplate: (data: CustomEmailData) => ({
  subject: `Custom Subject`,
  html: `
    <!DOCTYPE html>
    <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">${data.appName}</div>
          </div>
          <div class="content">
            <h2>Custom Content</h2>
            <p>${data.customMessage}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.appName}</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Custom plain text version`,
}),
```

## Integration Examples

### In API Routes

```typescript
// app/api/auth/register/route.ts
import { sendVerificationEmail } from '@/lib/email/send-emails';

export async function POST(req: Request) {
  const { email, name } = await req.json();

  // Create user...

  // Send verification email
  const result = await sendVerificationEmail(email, name);

  if (!result.success) {
    console.error('Failed to send verification email:', result.error);
    // Handle error (maybe queue for retry)
  }

  return Response.json({ success: true });
}
```

### In tRPC Procedures

```typescript
// server/routers/absence.ts
import { sendAbsenceStatusEmail } from '@/lib/email/send-emails';

updateAbsenceStatus: protectedProcedure
  .input(updateAbsenceStatusSchema)
  .mutation(async ({ ctx, input }) => {
    const absence = await ctx.prisma.absenceRequest.update({
      where: { id: input.id },
      data: { status: input.status },
      include: { user: true },
    });

    // Send notification email
    await sendAbsenceStatusEmail(
      absence.user.email,
      absence.user.name,
      input.status === 'APPROVED' ? 'approved' : 'rejected',
      absence.startDate,
      absence.endDate,
      ctx.session.user.name,
      input.note
    );

    return absence;
  }),
```

### Background Jobs (Recommended for Production)

For production, consider using a job queue (e.g., BullMQ, Inngest) to handle email sending asynchronously:

```typescript
// lib/jobs/email-queue.ts
import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: { host: 'localhost', port: 6379 },
});

// Add job to queue
export async function queueEmail(emailData: SendEmailOptions) {
  await emailQueue.add('send-email', emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Worker to process emails
const worker = new Worker('emails', async (job) => {
  const result = await sendEmail(job.data);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result;
});
```

## Error Handling

All email functions return a `SendEmailResult`:

```typescript
interface SendEmailResult {
  success: boolean;
  id?: string;      // Resend email ID if successful
  error?: string;   // Error message if failed
}
```

Always check the `success` field:

```typescript
const result = await sendVerificationEmail(email, name);

if (!result.success) {
  // Handle error appropriately
  logger.error('Failed to send verification email', {
    email,
    error: result.error,
  });

  // Maybe queue for retry or notify admin
}
```

## Testing

### Development Mode

In development, Resend provides a test mode. Emails won't actually be sent but you can view them in the Resend dashboard.

### Email Preview

Create a preview page to test templates:

```typescript
// app/emails/preview/page.tsx
import { emailTemplates } from '@/lib/email/templates';

export default function EmailPreview() {
  const template = emailTemplates.verification({
    appName: 'Employee Hub',
    appUrl: 'http://localhost:3000',
    userName: 'John Doe',
    verificationUrl: 'http://localhost:3000/verify?token=test',
  });

  return (
    <div>
      <h1>{template.subject}</h1>
      <div dangerouslySetInnerHTML={{ __html: template.html }} />
    </div>
  );
}
```

### Unit Tests

```typescript
// lib/email/send-emails.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendVerificationEmail } from './send-emails';

vi.mock('@/server/db', () => ({
  prisma: {
    verificationToken: {
      create: vi.fn(),
    },
  },
}));

describe('sendVerificationEmail', () => {
  it('should send verification email', async () => {
    const result = await sendVerificationEmail('test@example.com', 'Test User');
    expect(result.success).toBe(true);
  });
});
```

## Best Practices

1. **Always provide plain text versions** - Some email clients don't support HTML
2. **Use environment variables** - Don't hardcode email addresses or domains
3. **Handle failures gracefully** - Implement retry logic for transient failures
4. **Monitor email deliverability** - Check Resend dashboard regularly
5. **Test templates thoroughly** - Preview on multiple email clients
6. **Rate limit email sending** - Avoid hitting API limits
7. **Log all email attempts** - For debugging and audit trails
8. **Clean up expired tokens** - Run periodic cleanup jobs
9. **Use proper from addresses** - Verify your domain with Resend
10. **Include unsubscribe links** - For marketing emails (not required for transactional)

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify your sending domain in Resend dashboard
3. Check Resend logs for delivery issues
4. Ensure `EMAIL_FROM` uses a verified domain

### Tokens not working

1. Check database schema is up to date (`npx prisma migrate dev`)
2. Verify token hasn't expired
3. Check token type matches expected type
4. Look for database connection issues

### Template styling issues

1. Test in multiple email clients (Gmail, Outlook, Apple Mail)
2. Use inline styles (Resend handles this automatically)
3. Avoid complex CSS (email clients have limited support)
4. Test on mobile devices

## Rate Limits

Resend has the following rate limits:
- **Free Plan**: 100 emails/day
- **Paid Plans**: 10,000+ emails/day depending on plan

The `sendBatchEmails` function includes a 100ms delay between emails to avoid rate limiting.

## Security Considerations

1. **Token Security**
   - Tokens are stored in database with expiration
   - Use secure random token generation (crypto.randomUUID())
   - Delete tokens after use
   - Set appropriate expiration times

2. **Email Validation**
   - Validate email addresses before sending
   - Sanitize user input in email content
   - Use parameterized templates to prevent injection

3. **Rate Limiting**
   - Implement per-user email rate limits
   - Prevent abuse of password reset functionality
   - Monitor for suspicious patterns

## License

Part of Employee Management System - Internal Use
