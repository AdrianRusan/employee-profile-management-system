# Team Invitation System

A comprehensive team invitation and management system for organization admins to invite, manage, and control team members.

## Features

### 1. Invitation Management (Managers Only)
- **Create Invitations**: Send email invitations to new team members with specified roles
- **List Invitations**: View all pending and accepted invitations
- **Resend Invitations**: Regenerate and resend invitation links that haven't been accepted
- **Cancel Invitations**: Remove pending invitations before they're accepted

### 2. Team Member Management
- **View Team Members**: Display all active members in the organization
- **Update Roles**: Change member roles (Employee, Manager, Coworker)
- **Remove Members**: Soft-delete team members from the organization
- **Current User Highlight**: Visual indicator for the logged-in user

### 3. Settings UI
- **Tabbed Interface**: Organized settings with Team, Organization, and Profile tabs
- **Role-Based Access**: Different views for managers vs. employees
- **Responsive Design**: Mobile-friendly layout with proper breakpoints

## File Structure

```
server/routers/
  └── invitation.ts          # Invitation tRPC router with CRUD operations

components/settings/
  ├── InviteTeamMember.tsx   # Form to invite new team members
  ├── TeamMembersList.tsx    # Table of current team members
  ├── PendingInvitations.tsx # Table of pending invitations
  └── index.ts               # Barrel export

app/dashboard/settings/
  └── page.tsx               # Main settings page with tabs
```

## API Endpoints (tRPC)

### `invitation.create`
**Access**: Managers only
**Input**: `{ email: string, role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER' }`
**Function**: Creates a new invitation, generates token, sends email
**Validations**:
- Checks if user already exists in organization
- Prevents duplicate pending invitations
- 7-day expiration on invitation tokens

### `invitation.list`
**Access**: Managers only
**Function**: Returns all invitations for the organization with inviter details

### `invitation.resend`
**Access**: Managers only
**Input**: `{ id: string }`
**Function**: Generates new token, extends expiry, resends email
**Validations**:
- Prevents resending accepted invitations

### `invitation.cancel`
**Access**: Managers only
**Input**: `{ id: string }`
**Function**: Deletes the invitation record

### `user.updateRole`
**Access**: Managers only
**Input**: `{ id: string, role: 'EMPLOYEE' | 'MANAGER' | 'COWORKER' }`
**Function**: Updates a user's role
**Validations**:
- Prevents managers from changing their own role

## UI Components

### InviteTeamMember
A form component for inviting new team members.

**Features**:
- Email input with validation
- Role selector dropdown
- Loading states
- Success/error toasts
- Automatic form reset on success

### TeamMembersList
A table displaying all team members with management capabilities.

**Features**:
- Displays: name, email, role, department, joined date, status
- Role selection dropdown (managers only)
- Remove member button (managers only)
- Current user highlight
- Confirmation dialog for deletions
- Loading states

### PendingInvitations
A table showing all pending and expired invitations.

**Features**:
- Displays: email, role, invited by, status, expiration
- Status badges (Pending, Accepted, Expired)
- Resend invitation button
- Cancel invitation button
- Confirmation dialog for cancellations
- Relative time display for expiration

## Settings Page

The main settings page with three tabs:

### Team Tab
**Managers See**:
- Invite Team Member form
- Pending Invitations table
- Team Members List table

**Employees See**:
- Team Members List table (read-only)
- Information message about manager-only invitations

### Organization Tab
- Organization name
- Organization slug
- Manager-only modification notice

### Profile Tab
- Current user email
- Current user role
- Link to full profile page

## Integration

### Email System
Uses the existing email system in `lib/email/send-emails.ts`:
- `sendInvitationEmail()` - Sends invitation with unique token link
- Email includes inviter name, organization name, and role

### Authentication
- Uses `getCurrentTenant()` for multi-tenant context
- Integrates with existing session management
- Role-based access control via `managerProcedure`

### Database
- Uses existing `Invitation` model in Prisma schema
- Linked to Organization and User models
- Includes token expiration and acceptance tracking

## Security Features

1. **Role-Based Access Control**: Only managers can manage invitations
2. **Token Generation**: Secure random tokens via `generateToken()`
3. **Token Expiration**: 7-day expiry on invitation links
4. **Duplicate Prevention**: Checks for existing users and pending invites
5. **Self-Protection**: Managers cannot change their own role or remove themselves
6. **Audit Logging**: All invitation actions are logged

## Usage

### For Managers

1. Navigate to `/dashboard/settings`
2. Go to the "Team" tab
3. Fill in email and select role
4. Click "Send Invite"
5. Invitee receives email with invitation link
6. Monitor pending invitations and resend/cancel as needed
7. Manage existing team members (change roles, remove members)

### For Employees

1. Navigate to `/dashboard/settings`
2. View team members in read-only mode
3. Update personal profile settings
4. View organization information

## Future Enhancements

- Bulk invitation support
- Custom invitation messages
- Invitation templates
- Role-based permission customization
- Invitation analytics and tracking
- Team member activity history
- CSV import for bulk invites
