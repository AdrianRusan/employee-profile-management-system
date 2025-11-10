# E2E Test Quick Reference Guide

## Demo Login Accounts

```
Manager:   emily@example.com
Employee:  david@example.com
Coworker:  sarah@example.com
```

No password required - email-based authentication.

---

## Page URLs & Core Features

| URL | Page | Main Features | Who Can Access |
|-----|------|---------------|-----------------|
| `/login` | Login | Email login, Role override | Everyone |
| `/dashboard` | Dashboard | Metrics, Activity, Quick Actions | Logged in users |
| `/dashboard/profiles` | Profiles List | Search, Filter, Sort, Pagination | Logged in users |
| `/dashboard/profiles/[id]` | Profile Detail | Profile, Feedback, Absences tabs | Logged in users |
| `/dashboard/feedback` | Feedback Center | Received/Given feedback | Logged in users |
| `/dashboard/absences` | Absences | Request time off, Calendar, Approvals | Logged in users |

---

## Feature Checklist for E2E Tests

### Login Flow
- [ ] Login with valid email
- [ ] Role override works
- [ ] Redirects to `/dashboard`
- [ ] Logout button appears in sidebar
- [ ] Logout clears session and redirects to `/login`
- [ ] Accessing protected routes without login redirects to `/login`

### Dashboard
- [ ] Profile info card displays (Email, Dept, Title)
- [ ] Quick Actions show 4 base buttons
- [ ] Quick Actions show manager buttons (Pending Approvals)
- [ ] Metrics card displays role-appropriate stats
- [ ] Charts render without errors
- [ ] Activity feed shows recent activity
- [ ] Can click Quick Action buttons

### Profiles List (`/dashboard/profiles`)
- [ ] All employees display in table
- [ ] Search by name/email works
- [ ] Department filter works
- [ ] Role filter works
- [ ] Sorting by columns works
- [ ] "Load More" button works
- [ ] Click "View" button → navigates to profile detail

### Profile Detail (`/dashboard/profiles/[id]`)
- [ ] Profile card displays name, email, role, avatar
- [ ] Shows title, department, bio (if available)
- [ ] Can view own profile
- [ ] Can view other profiles
- [ ] Sensitive data visible to: self + managers
- [ ] Sensitive data hidden from: employees/coworkers (viewing others)
- [ ] "Edit Profile" button appears for: self + managers
- [ ] Edit Profile button opens dialog
- [ ] Avatar, name, email, title, dept, bio editable
- [ ] Changes save successfully

#### Profile Feedback Tab
- [ ] "Give Feedback" form shows when viewing another profile
- [ ] Form shows for your own profile (checking empty state)
- [ ] Character count displays (0/2000)
- [ ] Word count displays
- [ ] "Polish with AI" button disabled until 20 chars + 5 words
- [ ] Polishing works and shows polished version
- [ ] Can toggle between original/polished
- [ ] Submit stores feedback
- [ ] Feedback list shows previous feedback
- [ ] Delete button visible to giver/managers

#### Profile Absences Tab
- [ ] Calendar displays
- [ ] Can see own absences
- [ ] Cannot see others' absences (non-managers)
- [ ] Managers can see team absences

### Feedback Center (`/dashboard/feedback`)
- [ ] Statistics cards display correctly
- [ ] "Received" tab shows feedback you received
- [ ] "Given" tab shows feedback you gave
- [ ] Sort by "Most Recent" works
- [ ] Sort by "Oldest First" works
- [ ] Empty state displays when no feedback
- [ ] AI Polished badge shows for polished feedback
- [ ] Can expand to see original vs polished versions

### Absence Management (`/dashboard/absences`)
- [ ] Statistics cards display (Total, Pending, Approved, Rejected)
- [ ] "My Requests" tab shows own requests
- [ ] Can delete own request (with confirmation)
- [ ] Calendar tab displays
- [ ] "Team Requests" tab appears for managers only
- [ ] Request Time Off button opens dialog
- [ ] Dialog has Start Date, End Date, Reason fields
- [ ] Date picker works
- [ ] Can't pick past dates
- [ ] Character count for reason
- [ ] Submit creates request
- [ ] Managers can approve request
- [ ] Managers can reject request
- [ ] Approval updates status and stats

### Role-Based Access Control
- [ ] Employee sees limited metrics
- [ ] Manager sees team metrics
- [ ] Employee cannot see "Pending Approvals" button
- [ ] Manager sees "Pending Approvals" button with count
- [ ] Employee cannot edit other profiles
- [ ] Manager can edit other profiles
- [ ] Cannot view sensitive data (non-self, non-manager)
- [ ] Managers can view all sensitive data
- [ ] Role switcher works in header
- [ ] Switching role updates all UI accordingly

### Navigation
- [ ] Sidebar shows all 4 main nav items + Logout
- [ ] Active nav item is highlighted
- [ ] Clicking nav items navigates correctly
- [ ] Mobile hamburger appears on small screens
- [ ] Mobile menu opens/closes
- [ ] Mobile menu shows sidebar content
- [ ] Menu closes after navigation

### Error Handling
- [ ] Login with invalid email shows error
- [ ] Failed API calls show error toast
- [ ] Error boundary catches errors gracefully
- [ ] Error states display in components
- [ ] Loading states show skeletons

---

## Form Field Validation Rules

### Login Form
```
Email:
  - Required
  - Valid email format
  - Example: emily@example.com

Role:
  - Optional
  - Options: Manager, Employee, Coworker
  - Defaults to user's stored role
```

### Feedback Form
```
Content:
  - Required
  - Min: 20 characters
  - Max: 2000 characters
  - Min: 5 words
  - Real-time counter
```

### Absence Request Form
```
Start Date:
  - Required
  - Cannot be in past
  - Format: PPP (e.g., November 10, 2025)

End Date:
  - Required
  - Cannot be in past
  - Must be >= Start Date
  - Format: PPP

Reason:
  - Required
  - Min: 10 characters
  - Max: 500 characters
  - Character counter
```

### Profile Edit Form
```
Name:
  - Required
  - Min: 1 character

Email:
  - Required
  - Valid email format

Title:
  - Optional
  - Max: 255 characters

Department:
  - Optional
  - Max: 255 characters

Bio:
  - Optional
  - Max: 500 characters
```

---

## Quick Action Buttons & Dialogs

### Give Feedback
1. Click "Give Feedback" button
2. Dialog opens with user selector
3. Click on colleague → Feedback form shows
4. Fill form (20+ chars, 5+ words)
5. Optional: Click "Polish with AI"
6. Submit → Success toast, cache invalidates

### Request Time Off
1. Click "Request Time Off" button
2. Dialog opens with date pickers
3. Select Start Date (not in past)
4. Select End Date (>= Start Date)
5. Fill Reason (10-500 chars)
6. Submit → Success toast, stats update

### View My Profile
1. Click "View My Profile" button
2. Navigate to `/dashboard/profiles/[your-id]`
3. Shows your profile card
4. Shows your feedback
5. Shows your absences

### Browse Profiles
1. Click "Browse Profiles" button
2. Navigate to `/dashboard/profiles`
3. Shows employee list

### Pending Approvals (Managers Only)
1. Shows only for users with role MANAGER
2. Badge shows count of pending requests
3. Clicking opens Absence Management page
4. Team Requests tab is focused
5. Shows requests from team members

---

## Common UI Patterns

### Loading States
```tsx
<Skeleton className="h-4 w-48" />  // Placeholder while loading
```

### Empty States
```
Icon + Heading + Description
Example: "No feedback yet"
         "Be the first to provide constructive feedback..."
```

### Error States
```
Red box with error message
"Failed to load profile..."
"Please try again later."
```

### Success Feedback
```
Toast notification with "Success" icon
Example: "Profile updated successfully"
         "Feedback submitted successfully"
         "Absence request deleted successfully"
```

### Status Badges
```
Status colors:
- Pending: Yellow
- Approved: Green
- Rejected: Red
- AI Polished: Secondary (gray)
```

### Data Tables
```
Sortable columns: Click header to sort
Filterable: Search box + dropdown filters
Paginated: "Load More" button at bottom
Responsive: May stack on mobile
```

---

## Key Component Locations

### Pages
```
app/page.tsx                              Landing
app/(auth)/login/page.tsx                 Login
app/dashboard/page.tsx                    Dashboard
app/dashboard/profiles/page.tsx           Profiles List
app/dashboard/profiles/[id]/page.tsx      Profile Detail
app/dashboard/feedback/page.tsx           Feedback Center
app/dashboard/absences/page.tsx           Absence Management
```

### Components
```
components/Sidebar.tsx                    Navigation menu
components/MobileNav.tsx                  Mobile hamburger
components/QuickActions.tsx               Dashboard quick actions
components/FeedbackForm.tsx               Feedback submission form
components/FeedbackList.tsx               Feedback display
components/ProfileCard.tsx                Profile display
components/ProfileEditForm.tsx            Profile edit form
components/AbsenceRequestDialog.tsx       Absence request dialog
components/RoleIndicator.tsx              Current role + switcher
```

### API Endpoints (tRPC)
```
trpc.auth.login                 POST: email, role?
trpc.auth.logout                POST: (no params)
trpc.auth.getCurrentUser        GET: (no params)
trpc.auth.switchRole            POST: role
trpc.user.getAll                GET: limit, search?, dept?, role?
trpc.user.getById               GET: id
trpc.user.update                POST: id, data
trpc.feedback.create            POST: receiverId, content, etc
trpc.feedback.delete            POST: id
trpc.feedback.polishWithAI      POST: content
trpc.absence.create             POST: startDate, endDate, reason
trpc.absence.delete             POST: id
trpc.absence.updateStatus       POST: id, status
```

---

## Role Permissions Matrix

| Feature | Employee | Manager | Coworker |
|---------|----------|---------|----------|
| View own profile | ✓ | ✓ | ✓ |
| Edit own profile | ✓ | ✓ | ✓ |
| View others' profiles | ✓ | ✓ | ✓ |
| Edit others' profiles | ✗ | ✓ | ✗ |
| View own sensitive data | ✓ | ✓ | ✓ |
| View others' sensitive data | ✗ | ✓ | ✗ |
| Request time off | ✓ | ✓ | ✓ |
| View own absences | ✓ | ✓ | ✓ |
| View team absences | ✗ | ✓ | ✗ |
| Approve absences | ✗ | ✓ | ✗ |
| Give feedback | ✓ | ✓ | ✓ |
| View own feedback | ✓ | ✓ | ✓ |
| View others' feedback | Limited | ✓ | Limited |
| Delete own feedback | ✓ | ✓ | ✓ |
| Delete others' feedback | ✗ | ✓ | ✗ |

---

## Debugging Tips

### Check User Session
```
Look at header: "Welcome, [Name]" shows current user
Look at sidebar: Role indicator shows current role
```

### Check Permissions
```
Manager features appear if role = MANAGER
Team data appears if viewing own profile or role = MANAGER
```

### Check API Calls
```
Open browser DevTools → Network tab
All tRPC calls use /api/trpc endpoint
Look for query params and request body
```

### Check Data Caching
```
tRPC queries cached with different staleTime values
(usually 2-5 minutes for dynamic data)
Mutations invalidate related queries automatically
```

### Check Form Validation
```
Try submitting empty forms → see required field errors
Try invalid email → see email format error
Try feedback < 20 chars → see min length error
```

---

## Performance Expectations

- **Login:** ~500ms
- **Dashboard load:** ~1-2s (multiple queries parallel)
- **Profiles list (first page):** ~800ms
- **Profile detail:** ~1s
- **Feedback submission:** ~1s (2-3s with AI polishing)
- **Absence approval:** ~500ms

---

## Known Behaviors

1. **Email is username:** No password, email acts as login identifier
2. **Role switching is instant:** Changes immediately, but note this is a demo feature
3. **AI polishing:** Takes ~2-3 seconds, uses external AI service
4. **Dates are UTC:** Calendar uses system timezone
5. **Character counting:** Includes spaces and punctuation
6. **Pagination:** Always 20 items per page, uses cursor-based pagination
7. **Sorting:** Default is by creation date, ascending
8. **Filters:** Department and Role filters are exact matches, not fuzzy search

---

## Test Data Tips

- Use demo accounts (emily@, david@, sarah@)
- Create new test data via UI (feedback, absences)
- Check database state via Prisma Studio (`npx prisma studio`)
- Clear session between tests if needed (logout)
- Dates always start from today onwards (can't create past requests)

---

## Accessibility Notes

- All buttons have proper labels/aria-labels
- Keyboard navigation supported (Tab, Enter, Arrow keys)
- Skip to main content link available (press Tab at page start)
- Focus indicators visible throughout
- Form errors announced to screen readers
- Loading states have aria-busy attributes
- Color not sole indicator of status (icons + labels also used)

---

**Last Updated:** 2025-11-10
