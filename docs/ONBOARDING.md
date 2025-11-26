# Onboarding Wizard

A comprehensive onboarding wizard for new organizations after registration.

## Overview

The onboarding wizard guides new organizations through initial setup in 5 steps:

1. **Welcome** - Introduction to Employee Hub features
2. **Organization Profile** - Logo upload, timezone, and description
3. **Invite Team** - Add team members via email
4. **Departments** - Create organizational departments
5. **Completion** - Summary and quick start tips

## Features

- **Multi-step wizard** with progress indicator
- **Optional steps** - Users can skip team invites and departments
- **Visual progress tracking** with step indicators
- **Smooth animations** with accessibility support
- **Form validation** with helpful error messages
- **Responsive design** for all screen sizes

## Files Created

### Components

- `components/ui/progress.tsx` - Progress bar component (Radix UI)
- `components/onboarding/OnboardingWizard.tsx` - Main wizard orchestration
- `components/onboarding/steps/WelcomeStep.tsx` - Welcome screen
- `components/onboarding/steps/OrganizationStep.tsx` - Organization settings
- `components/onboarding/steps/InviteStep.tsx` - Team member invitations
- `components/onboarding/steps/DepartmentsStep.tsx` - Department creation
- `components/onboarding/steps/CompletionStep.tsx` - Final summary

### Pages

- `app/onboarding/page.tsx` - Onboarding page entry point

### Backend

- `server/routers/organization.ts` - Organization router with:
  - `completeOnboarding` - Finalize onboarding and send invites
  - `getSettings` - Get organization settings
  - `updateSettings` - Update organization profile

## Usage

### User Flow

1. **After Registration**: New organizations are redirected to `/onboarding`
2. **Auto-redirect**: If onboarding is already completed, redirects to dashboard
3. **Step-by-step setup**: Users progress through each step
4. **Flexible completion**: Steps can be skipped if not needed
5. **Dashboard redirect**: Upon completion, users land on the dashboard

### Accessing the Onboarding Wizard

```typescript
// Direct navigation
router.push('/onboarding');

// The page automatically checks if onboarding is completed
// and redirects to dashboard if so
```

### Organization Settings Structure

```typescript
{
  settings: {
    onboardingCompleted: boolean,
    onboardingCompletedAt: string (ISO date),
    timezone: string,
    description: string,
    departments: string[]
  }
}
```

## API Endpoints

### Complete Onboarding

```typescript
trpc.organization.completeOnboarding.useMutation({
  invites: ['email1@example.com', 'email2@example.com'], // optional
  departments: ['Engineering', 'Sales', 'Marketing'], // optional
});
```

### Get Organization Settings

```typescript
const { data: settings } = trpc.organization.getSettings.useQuery();
```

### Update Organization Settings

```typescript
trpc.organization.updateSettings.useMutation({
  logo: 'https://example.com/logo.png', // optional
  settings: {
    timezone: 'America/New_York',
    description: 'Company description',
  },
});
```

## Step Details

### 1. Welcome Step

- Displays user's first name
- Shows key features with icons
- Single "Let's Get Started" button

### 2. Organization Step

- **Logo Upload**: URL input with live preview
- **Timezone Selection**: Common timezones dropdown
- **Description**: Optional textarea (500 char limit)
- Can skip or save and continue

### 3. Invite Step

- **Multi-email input**: Comma or newline separated
- **Email validation**: Real-time validation with error display
- **Batch management**: Add/remove emails easily
- Shows count of invites to be sent

### 4. Departments Step

- **Suggested departments**: 10 common department types
- **Custom departments**: Add unlimited custom departments
- **Toggle selection**: Click to add/remove suggested ones
- Visual summary of selected departments

### 5. Completion Step

- **Summary**: What was configured
- **Quick tips**: 4 actionable next steps
- **Feature highlights**: What to explore
- Final button to go to dashboard

## Technical Details

### Dependencies Installed

```bash
npm install @radix-ui/react-progress resend
```

### State Management

The wizard uses React `useState` to manage:
- Current step index
- Organization data
- Email invites array
- Departments array

### Backend Processing

When onboarding is completed:
1. Organization settings are updated with completion flag
2. Email invitations are created in the database
3. Invitation emails are sent (when email service is configured)
4. Departments are stored in organization settings

### Security

- All mutations are protected (require authentication)
- CSRF token validation
- Email validation
- Tenant isolation (multi-tenancy)

## Customization

### Adding New Steps

1. Create step component in `components/onboarding/steps/`
2. Add to `STEPS` array in `OnboardingWizard.tsx`
3. Add case in `renderStep()` switch statement

### Modifying Step Content

Each step is a separate component and can be modified independently.

### Styling

Uses Tailwind CSS with shadcn/ui components for consistent design.

## Known Issues

- Email sending requires `RESEND_API_KEY` environment variable
- Email service is currently using console.log (TODO: implement actual service)
- verify-email page has a bug with resendMutation (not related to onboarding)

## Future Enhancements

- [ ] Add SSO configuration step for enterprise plans
- [ ] Role assignment during team invite
- [ ] Bulk CSV import for team members
- [ ] Integration setup (Slack, Google Workspace, etc.)
- [ ] Onboarding progress save/resume
- [ ] Video tutorials in steps
- [ ] Sample data generation option
