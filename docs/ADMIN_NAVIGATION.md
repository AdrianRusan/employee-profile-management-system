# Admin Panel Navigation Structure

## Route Hierarchy

```
/admin (Super Admin Panel)
├── /admin (Overview Dashboard)
│   ├── Platform Metrics Cards
│   ├── Quick Actions Menu
│   └── Recent Activity Feed
│
├── /admin/organizations (Organizations Management)
│   ├── Search & Filter
│   ├── Organizations Table
│   │   ├── View Details → /admin/organizations/[id]
│   │   └── Suspend/Activate
│   └── Pagination
│
├── /admin/organizations/[id] (Organization Details)
│   ├── Organization Info
│   ├── Usage Statistics (6 metrics)
│   ├── Users List
│   └── Suspend/Activate Action
│
├── /admin/users (All Users)
│   ├── Search & Filter (by role)
│   ├── Users Table
│   │   ├── Name, Email, Organization
│   │   ├── Role, Department, Status
│   │   └── Last Login
│   └── Pagination
│
└── /admin/activity (Activity Logs)
    ├── Audit Trail Table
    ├── Color-coded Actions
    ├── User & Organization Context
    └── Load More

/dashboard (Back to Regular Dashboard)
```

## Component Structure

```
AdminLayout
├── AdminSidebar (Desktop)
│   ├── Logo/Brand (Shield Icon)
│   ├── Navigation Menu
│   │   ├── Overview (/admin)
│   │   ├── Organizations (/admin/organizations)
│   │   ├── All Users (/admin/users)
│   │   └── Activity (/admin/activity)
│   ├── Back to Dashboard
│   └── Warning Notice
│
├── AdminMobileNav (Mobile)
│   └── Sheet with AdminSidebar
│
├── Header
│   ├── Mobile Nav Toggle
│   ├── Title + Admin Badge
│   ├── Notifications Bell
│   └── User Info
│
├── Main Content
│   └── [page content]
│
└── Footer
    └── Version & User Info
```

## Access Flow

```
User Login (/login)
    ↓
Check Email in SUPER_ADMIN_EMAILS
    ↓
    ├─→ YES: Allow access to /admin
    │       ↓
    │   Admin Panel Accessible
    │       ↓
    │   Navigate between admin pages
    │
    └─→ NO: Redirect to /dashboard
            ↓
        Regular Dashboard Only
```

## Feature Map

### Platform Metrics (Dashboard)
- **Total Organizations**: Count of active tenants
- **Total Users**: All users across platform
- **Active Users**: Users active in last 30 days
- **New Signups**: New users this month

### Organization Management
- **List View**: Search, filter, paginate organizations
- **Detail View**: Full org info, stats, user list
- **Actions**: Suspend/activate organizations

### User Management
- **Cross-Organization View**: All users in one table
- **Filtering**: By role, organization, search
- **Information**: Complete user profile data

### Activity Logs
- **Audit Trail**: All platform actions
- **Filtering**: By action type, user, organization
- **Context**: IP addresses, timestamps, metadata

## Data Flow

```
Frontend Component
    ↓ (tRPC Query/Mutation)
Admin Router (server/routers/admin.ts)
    ↓ (Super Admin Middleware Check)
Verify Email in SUPER_ADMIN_EMAILS
    ↓ (If Authorized)
Prisma Database Query
    ↓
Return Data to Frontend
    ↓
Display in UI Component
```

## Security Layers

```
Layer 1: Environment Variables
└─→ SUPER_ADMIN_EMAILS (server)
    NEXT_PUBLIC_SUPER_ADMIN_EMAILS (client)

Layer 2: Client-Side Guard
└─→ AdminLayout checks user email
    Redirects if not authorized

Layer 3: Server-Side Middleware
└─→ superAdminProcedure verifies on every request
    Throws FORBIDDEN error if not authorized

Layer 4: Audit Logging
└─→ All admin actions logged to database
    IP, timestamp, user, action recorded
```

## Theme Differentiation

### Regular Dashboard
- Light/neutral theme
- Muted colors
- Standard sidebar

### Admin Panel
- Dark slate theme (950-900)
- Blue/purple accents
- Shield icon branding
- "ADMIN" badge
- Warning notices

## Keyboard Shortcuts

Currently using standard navigation. Future enhancements could include:

```
Planned Admin Shortcuts:
- Cmd/Ctrl + K: Quick search (organizations/users)
- Cmd/Ctrl + /: Jump to activity logs
- Cmd/Ctrl + O: Organizations page
- Cmd/Ctrl + U: Users page
- Escape: Close modals/sheets
```

## Mobile Responsiveness

### Desktop (≥768px)
- Fixed sidebar (264px width)
- Full table views
- All columns visible

### Tablet (≥640px, <768px)
- Hamburger menu
- Sheet sidebar
- Condensed tables

### Mobile (<640px)
- Hamburger menu
- Sheet sidebar
- Stacked table rows
- Horizontal scroll on tables

## Quick Reference

| Page | Route | Purpose | Key Actions |
|------|-------|---------|-------------|
| Overview | `/admin` | Platform metrics | View stats, quick nav |
| Organizations | `/admin/organizations` | Manage tenants | Search, view, suspend |
| Org Details | `/admin/organizations/[id]` | Org info & stats | View users, toggle status |
| All Users | `/admin/users` | Cross-org users | Search, filter by role |
| Activity | `/admin/activity` | Audit logs | View actions, load more |

## API Endpoints Reference

| Endpoint | Type | Purpose |
|----------|------|---------|
| `admin.getPlatformMetrics` | Query | Platform stats |
| `admin.listOrganizations` | Query | Paginated org list |
| `admin.getOrganization` | Query | Single org details |
| `admin.getOrganizationStats` | Query | Org usage stats |
| `admin.toggleOrganizationStatus` | Mutation | Suspend/activate |
| `admin.listAllUsers` | Query | All users paginated |
| `admin.getRecentActivity` | Query | Audit logs |

## Color Coding

### Organization Status
- 🟢 **Green**: Active organization
- 🔴 **Red**: Suspended organization

### User Status
- 🟢 **Green**: Active user
- 🔴 **Red**: Inactive user
- 🟡 **Amber**: Pending verification

### User Roles
- 🔵 **Blue**: Manager
- 🟣 **Purple**: Coworker
- ⚪ **Gray**: Employee

### Action Types (Activity Logs)
- 🔵 **Blue**: View actions
- 🟢 **Green**: Create actions
- 🟣 **Purple**: Update actions
- 🔴 **Red**: Delete actions
- 🟡 **Amber**: Admin/sensitive actions
