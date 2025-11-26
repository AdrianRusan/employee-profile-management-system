# Email Service Setup Guide

This guide walks you through setting up the Resend email service for your multi-tenant SaaS application.

## Quick Setup Checklist

- [ ] Install `resend` package
- [ ] Configure Resend account and API key
- [ ] Update environment variables
- [ ] Run database migration
- [ ] Test email sending
- [ ] (Optional) Integrate into existing routes/procedures

---

## Step 1: Install Dependencies

The `resend` package is **NOT** currently in your `package.json`. Install it:

```bash
npm install resend
```

After installing, your `package.json` should include:
```json
{
  "dependencies": {
    "resend": "^4.0.0"
  }
}
```

---

## Step 2: Set Up Resend Account

### 2.1 Create Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### 2.2 Verify Domain
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add the provided DNS records to your domain registrar:
   - SPF record
   - DKIM records
   - MX records (optional, for receiving)
4. Wait for verification (usually a few minutes)

**For Development/Testing:**
- You can use Resend's test mode without domain verification
- Emails will appear in the Resend dashboard but won't be delivered

### 2.3 Generate API Key
1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it (e.g., "Production" or "Development")
4. Copy the key (starts with `re_`)
5. Store it securely - you won't be able to see it again!

---

## Step 3: Configure Environment Variables

Update your `.env` file with the following:

```env
# Resend Email Service
RESEND_API_KEY="re_your_actual_api_key_here"
EMAIL_FROM="Employee Hub <noreply@yourdomain.com>"

# App configuration (if not already set)
NEXT_PUBLIC_APP_NAME="Employee Hub"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change in production
```

**Important Notes:**
- `EMAIL_FROM` must use your verified domain
- In development, you can use any email address for testing
- `NEXT_PUBLIC_APP_URL` should be your production URL in production

### Example Production Configuration

```env
RESEND_API_KEY="re_abc123def456ghi789"
EMAIL_FROM="Employee Hub <noreply@yourcompany.com>"
NEXT_PUBLIC_APP_NAME="Employee Hub"
NEXT_PUBLIC_APP_URL="https://app.yourcompany.com"
```

---

## Step 4: Update Database Schema

The Prisma schema has been updated with the `VerificationToken` model. Run the migration:

```bash
# Create and apply migration
npx prisma migrate dev --name add_verification_tokens

# Generate Prisma client
npx prisma generate
```

This creates the following table:
```sql
CREATE TABLE "VerificationToken" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "type" TEXT NOT NULL, -- EMAIL_VERIFICATION, PASSWORD_RESET, TWO_FACTOR
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Step 5: Test Email Service

Create a test file or API route to verify everything works:

### Option A: Test Script

Create `scripts/test-email.ts`:

```typescript
import { sendEmail } from '../lib/email';

async function testEmail() {
  const result = await sendEmail({
    to: 'your-test-email@example.com',
    subject: 'Test Email',
    html: '<h1>Hello from Employee Hub!</h1><p>This is a test email.</p>',
    text: 'Hello from Employee Hub! This is a test email.',
  });

  console.log('Result:', result);
}

testEmail();
```

Run it:
```bash
npx tsx scripts/test-email.ts
```

### Option B: API Route

Create `app/api/test-email/route.ts`:

```typescript
import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function GET() {
  const result = await sendEmail({
    to: 'your-test-email@example.com',
    subject: 'Test Email',
    html: '<h1>Hello!</h1>',
    text: 'Hello!',
  });

  return NextResponse.json(result);
}
```

Visit: `http://localhost:3000/api/test-email`

---

## Step 6: Integration into Existing Code

### 6.1 User Registration (Example)

If you have a user registration flow, integrate email verification:

```typescript
// In your registration handler (e.g., server/routers/auth.ts)
import { sendVerificationEmail } from '@/lib/email/send-emails';

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          status: 'PENDING_VERIFICATION',
          // ... other fields
        },
      });

      // Send verification email
      await sendVerificationEmail(user.email, user.name);

      return { success: true, userId: user.id };
    }),
});
```

### 6.2 Absence Workflow Integration

Update your absence request handlers:

```typescript
// server/routers/absence.ts
import {
  sendAbsenceRequestEmail,
  sendAbsenceStatusEmail,
} from '@/lib/email/send-emails';

export const absenceRouter = router({
  // When employee creates request
  create: protectedProcedure
    .input(createAbsenceSchema)
    .mutation(async ({ ctx, input }) => {
      const absence = await ctx.prisma.absenceRequest.create({
        data: { ...input, userId: ctx.session.user.id },
        include: { user: true },
      });

      // Notify managers
      const managers = await ctx.prisma.user.findMany({
        where: {
          organizationId: ctx.session.user.organizationId,
          role: 'MANAGER',
        },
      });

      for (const manager of managers) {
        await sendAbsenceRequestEmail(
          manager.email,
          manager.name,
          absence.user.name,
          absence.startDate,
          absence.endDate,
          absence.reason,
          absence.id
        );
      }

      return absence;
    }),

  // When manager approves/rejects
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const absence = await ctx.prisma.absenceRequest.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { user: true },
      });

      // Notify employee
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
});
```

### 6.3 Feedback Notifications

```typescript
// server/routers/feedback.ts
import { sendFeedbackReceivedEmail } from '@/lib/email/send-emails';

export const feedbackRouter = router({
  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.prisma.feedback.create({
        data: {
          ...input,
          giverId: ctx.session.user.id,
          organizationId: ctx.session.user.organizationId,
        },
        include: {
          giver: true,
          receiver: true,
        },
      });

      // Send email notification
      await sendFeedbackReceivedEmail(
        feedback.receiver.email,
        feedback.receiver.name,
        feedback.giver.name,
        feedback.content
      );

      return feedback;
    }),
});
```

---

## Step 7: Production Considerations

### 7.1 Error Handling

Always handle email failures gracefully:

```typescript
const result = await sendVerificationEmail(email, name);

if (!result.success) {
  // Log error
  console.error('Failed to send email:', result.error);

  // Don't fail the operation
  // Email is nice-to-have, not critical

  // Optional: Queue for retry
  // await queueEmailForRetry({ email, name, type: 'verification' });
}
```

### 7.2 Background Jobs (Recommended)

For production, use a job queue for emails:

```bash
npm install bullmq ioredis
```

```typescript
// lib/jobs/email-queue.ts
import { Queue, Worker } from 'bullmq';
import { sendEmail } from '@/lib/email';

const emailQueue = new Queue('emails', {
  connection: { host: 'localhost', port: 6379 },
});

export async function queueEmail(emailData: SendEmailOptions) {
  await emailQueue.add('send-email', emailData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

// Worker
const worker = new Worker('emails', async (job) => {
  await sendEmail(job.data);
});
```

### 7.3 Monitoring

Monitor email delivery in Resend dashboard:
- Delivery rates
- Bounce rates
- Spam complaints
- Failed deliveries

Set up alerts for:
- High failure rates
- API rate limit approaching
- Bounce rate above threshold

### 7.4 Token Cleanup

Set up a cron job to clean expired tokens:

```typescript
// app/api/cron/cleanup-tokens/route.ts
import { cleanupExpiredTokens } from '@/lib/email/send-emails';
import { NextResponse } from 'next/server';

export async function GET() {
  // Add authentication/authorization here

  const count = await cleanupExpiredTokens();

  return NextResponse.json({
    success: true,
    deletedCount: count,
  });
}
```

Set up with Vercel Cron or external service to call daily.

---

## Step 8: Testing Checklist

Test each email template:

- [ ] Email verification flow
  - [ ] Send verification email
  - [ ] Click link and verify
  - [ ] Check token is deleted

- [ ] Password reset flow
  - [ ] Request reset
  - [ ] Receive email
  - [ ] Reset password
  - [ ] Verify old token doesn't work

- [ ] Team invitation
  - [ ] Send invitation
  - [ ] Accept invitation
  - [ ] Check expired invitation

- [ ] Absence workflow
  - [ ] Submit request (manager receives email)
  - [ ] Approve/reject (employee receives email)

- [ ] Feedback notification
  - [ ] Give feedback
  - [ ] Receiver gets email

---

## Troubleshooting

### Emails not sending

**Check:**
1. `RESEND_API_KEY` is set correctly in `.env`
2. Domain is verified in Resend dashboard
3. `EMAIL_FROM` uses verified domain
4. Check Resend dashboard logs
5. Check application logs for errors

**Common Issues:**
- Missing API key → Set `RESEND_API_KEY`
- Domain not verified → Verify domain in Resend
- Invalid from address → Must match verified domain
- Rate limit exceeded → Upgrade plan or add delays

### Tokens not working

**Check:**
1. Database migration ran successfully
2. Token hasn't expired
3. Token type matches (EMAIL_VERIFICATION vs PASSWORD_RESET)
4. Token wasn't already used (should be deleted)

### Styling issues

**Test in multiple clients:**
- Gmail (web, mobile)
- Outlook (web, desktop)
- Apple Mail (iOS, macOS)
- Yahoo Mail

**Tips:**
- Use inline styles (Resend handles this)
- Avoid complex CSS
- Test with Resend's preview feature
- Use `<table>` layout for complex designs

---

## Next Steps

1. **Install Resend**: `npm install resend`
2. **Set up account**: Get API key from resend.com
3. **Configure env**: Add `RESEND_API_KEY` and `EMAIL_FROM`
4. **Run migration**: `npx prisma migrate dev --name add_verification_tokens`
5. **Test**: Send a test email
6. **Integrate**: Add to your existing routes
7. **Monitor**: Check Resend dashboard regularly

---

## Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/dashboard
- **Email Templates**: `lib/email/templates.ts`
- **Integration Examples**: `lib/email/examples.ts`
- **API Reference**: `lib/email/README.md`

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Resend documentation
3. Check application logs
4. Review Resend dashboard logs
5. Check GitHub issues for similar problems

---

**Created**: 2025-11-25
**Version**: 1.0.0
