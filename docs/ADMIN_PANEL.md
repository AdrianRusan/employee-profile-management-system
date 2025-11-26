# Super Admin Panel

The Super Admin Panel provides platform-level management capabilities for the multi-tenant SaaS application. This panel is accessible only to designated super administrators who have comprehensive oversight across all organizations.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Access Control](#access-control)
- [Features](#features)
- [Security Considerations](#security-considerations)
- [API Endpoints](#api-endpoints)

---

## Overview

The Super Admin Panel (`/admin`) is a dedicated administrative interface that allows platform administrators to:

- Monitor platform-wide metrics
- Manage organizations (tenants)
- View and manage users across all organizations
- Review audit logs and activity
- Suspend/activate organizations
- Access cross-tenant analytics

---

## Setup

### 1. Configure Super Admin Emails

Add the email addresses of super administrators to your environment variables:

```bash
# .env
SUPER_ADMIN_EMAILS="admin@company.com,superadmin@company.com"
NEXT_PUBLIC_SUPER_ADMIN_EMAILS="admin@company.com,superadmin@company.com"
```

**Important:**
- Use comma-separated values for multiple admins
- Both server-side and client-side env vars are required
- Email matching is case-insensitive
- Keep this list minimal for security

### 2. Restart the Application

After adding super admin emails, restart your application:

```bash
npm run dev
# or
npm run build && npm start
```

---

## Access Control

### Authentication Flow

1. **User Login**: Super admins log in through the regular `/login` route
2. **Session Check**: The system verifies the user's email against `SUPER_ADMIN_EMAILS`
3. **Access Grant**: If authorized, the admin panel becomes accessible at `/admin`
4. **Redirect**: Non-admin users are automatically redirected to `/dashboard`

### Client-Side Protection

The admin layout checks the user's email against `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` and redirects unauthorized users.

### Server-Side Protection

All admin API endpoints use the `superAdminProcedure` middleware that verifies:
- User is authenticated
- User's email is in the `SUPER_ADMIN_EMAILS` list
- All admin actions are logged to audit logs

---

## Features

### 1. Platform Overview (`/admin`)

**Platform Metrics:**
- Total Organizations
- Total Users (across all orgs)
- Active Users (last 30 days)
- New Signups (this month)

**Quick Actions:**
- Navigate to Organizations
- Navigate to All Users
- Navigate to Activity Logs

**Recent Activity Feed:**
- Latest 10 platform events
- Real-time updates

### 2. Organizations Management (`/admin/organizations`)

**List View:**
- Search organizations by name or slug
- View user counts per organization
- See organization status (Active/Suspended)
- Creation dates

**Actions:**
- View organization details
- Suspend/Activate organizations
- Pagination support

### 3. Organization Details (`/admin/organizations/[id]`)

**Organization Information:**
- Name, slug, domain
- Organization ID
- Creation date
- Current status

**Usage Statistics:**
- Total users
- Active users (last 30 days)
- Total feedback
- Recent feedback (last 30 days)
- Total absence requests
- Pending absence requests

**Users List:**
- All users in the organization
- User roles, departments
- Last login information

**Management Actions:**
- Suspend/Activate organization
- View organization settings

### 4. All Users View (`/admin/users`)

**Features:**
- View all users across all organizations
- Search by name or email
- Filter by role (Employee, Manager, Coworker)
- Filter by organization
- Pagination

**Displayed Information:**
- User name and email
- Organization affiliation
- Role and department
- Account status
- Last login time

### 5. Activity Logs (`/admin/activity`)

**Audit Trail:**
- All platform activities
- Filtered by action type
- User information
- Organization context
- IP addresses
- Timestamps

**Actions Tracked:**
- View operations (profile, sensitive data, feedback, absence)
- Create operations (user, feedback, absence)
- Update operations (profile, sensitive data, feedback, absence status)
- Delete operations (user, feedback, absence)
- Restore operations
- Authentication events (login success/failure, logout, session expired)
- Admin operations (export data, bulk operations)

**Features:**
- Real-time refresh
- Load more functionality
- Color-coded action badges
- Detailed timestamps

---

## Security Considerations

### 1. Access Control

- **Environment-based**: Super admin access is controlled via environment variables
- **No Database Roles**: Super admin status is not stored in the database
- **Server-side Validation**: All endpoints verify super admin status server-side
- **Client-side Redirect**: Layout prevents unauthorized UI access

### 2. Audit Logging

All super admin actions are logged with:
- User email and role
- Action type
- Target entity
- IP address
- Timestamp
- Old and new values (for updates)

### 3. Best Practices

1. **Minimize Access**: Only grant super admin access to essential personnel
2. **Use Strong Passwords**: Super admins should use strong, unique passwords
3. **Enable 2FA**: Require two-factor authentication for super admin accounts
4. **Regular Audits**: Review activity logs regularly
5. **Separate Accounts**: Super admins should have separate accounts for daily work
6. **Monitor Access**: Set up alerts for super admin logins
7. **Rotate Credentials**: Periodically review and update the super admin email list

### 4. Rate Limiting

All admin endpoints are protected by rate limiting to prevent abuse:
- API rate limits apply per user ID
- Failed login attempts are tracked
- Account lockout after multiple failures

---

## API Endpoints

### Platform Metrics

```typescript
trpc.admin.getPlatformMetrics.useQuery()
```

Returns platform-wide statistics.

### Organizations

```typescript
// List organizations
trpc.admin.listOrganizations.useQuery({
  search?: string,
  skip: number,
  take: number,
})

// Get organization details
trpc.admin.getOrganization.useQuery({ id: string })

// Get organization statistics
trpc.admin.getOrganizationStats.useQuery({ id: string })

// Toggle organization status
trpc.admin.toggleOrganizationStatus.useMutation({
  id: string,
  suspend: boolean,
})
```

### Users

```typescript
// List all users
trpc.admin.listAllUsers.useQuery({
  search?: string,
  organizationId?: string,
  role?: 'EMPLOYEE' | 'MANAGER' | 'COWORKER',
  skip: number,
  take: number,
})
```

### Activity

```typescript
// Get recent activity
trpc.admin.getRecentActivity.useQuery({
  take: number,
})
```

---

## Styling and UX

The admin panel uses a distinct dark theme to differentiate it from the regular dashboard:

- **Color Scheme**: Dark slate (950-900) background with blue/purple accents
- **Visual Identity**: Shield icon and "Admin Panel" branding
- **Distinct Navigation**: Separate sidebar with admin-specific menu items
- **Status Indicators**: Color-coded badges for organization/user status
- **Responsive Design**: Mobile-friendly with responsive tables and navigation

---

## Troubleshooting

### Cannot Access Admin Panel

1. Check that your email is in `SUPER_ADMIN_EMAILS` (server) and `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` (client)
2. Verify email format matches exactly (case-insensitive)
3. Ensure no extra spaces in the comma-separated list
4. Restart the application after changing environment variables
5. Check browser console for any errors

### Organizations Not Loading

1. Verify database connection
2. Check that organizations exist in the database
3. Review server logs for errors
4. Ensure `deletedAt` field is properly indexed

### Activity Logs Empty

1. Ensure audit logging is enabled
2. Check that `AuditLog` table exists and is populated
3. Verify database migrations have run
4. Review server logs for errors

---

## Future Enhancements

Potential features for future releases:

- [ ] Organization creation UI
- [ ] Bulk user management
- [ ] Export functionality for users/organizations
- [ ] Advanced filtering and search
- [ ] Organization usage quotas and limits
- [ ] Billing and subscription management
- [ ] Custom role creation
- [ ] Automated reports and alerts
- [ ] IP whitelisting for admin access
- [ ] Admin action approval workflows
- [ ] Data retention policy management

---

## Related Documentation

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Alerting and Monitoring](./ALERTING.md)
- [Database Schema](../prisma/schema.prisma)
