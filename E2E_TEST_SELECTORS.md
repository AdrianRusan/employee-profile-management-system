# E2E Test Selectors & Elements Reference

## Login Page (`/login`)

### Form Elements
```
Email Input:
  - Placeholder: "your.email@example.com"
  - Test text: emily@example.com

Role Select:
  - Label: "Role (Demo Feature)"
  - Options: Manager, Employee, Coworker
  - Default: "Use profile default role"

Sign In Button:
  - Text: "Sign In" or "Signing in..."
  - Type: submit
  - Disabled when isPending
```

### Demo Accounts Section
```
Text: "Demo Accounts:"
Contents:
  - "Manager: emily@example.com"
  - "Employee: david@example.com"
  - "Coworker: sarah@example.com"
```

### Code Selectors (Playwright/Cypress)
```javascript
// Email input
await page.fill('input[type="email"]', 'emily@example.com');

// Role select
await page.selectOption('select', 'MANAGER');

// Sign in button
await page.click('button[type="submit"]');

// Wait for redirect
await page.waitForNavigation();
```

---

## Dashboard Page (`/dashboard`)

### Header/Navigation
```
Logo/Brand Text: "EPMS"

User Greeting:
  - Text: "Welcome, [Name]"
  - Location: Top navigation bar

Role Indicator:
  - Badge: Shows current role (MANAGER/EMPLOYEE/COWORKER)
  - Color-coded: Purple (Manager), Blue (Employee), Green (Coworker)
  - Dropdown: Switch role
```

### Sidebar (Desktop)
```
Navigation Links:
  - "Dashboard" (Home icon) - href="/dashboard"
  - "Profiles" (Users icon) - href="/dashboard/profiles"
  - "Feedback" (MessageSquare icon) - href="/dashboard/feedback"
  - "Absences" (Calendar icon) - href="/dashboard/absences"

Logout Button:
  - Icon: LogOut
  - Text: "Logout" or "Logging out..."
```

### Mobile Menu
```
Hamburger Button:
  - Icon: Menu
  - Only visible on md breakpoint and below
  - Opens sheet/drawer on left

Sheet Content:
  - Contains same Sidebar content
  - Closes on navigation
```

### Profile Information Card
```
Title: "Profile Information"
Description: "View and manage your profile"

Content (when loaded):
  - "Email: [email]"
  - "Department: [dept] or N/A"
  - "Title: [title] or N/A"

Loading State:
  - Three skeleton loaders
```

### Quick Actions Card
```
Title: "Quick Actions"
Description: "Common tasks and shortcuts"

Buttons (Grid layout):
1. "Give Feedback" - MessageSquare icon
2. "Request Time Off" - CalendarDays icon
3. "View My Profile" - User icon
4. "Browse Profiles" - Users icon
5. [If Manager] "Pending Approvals" - Clock icon
   - Badge with pending count (red)
```

### Key Metrics Card
```
Title: "Key Metrics"
Description: "Your activity summary" (or "Your team and personal statistics")

Metric Items (Grid):
- Feedback Received (MessageSquare blue icon)
- Feedback Given (MessageSquare green icon)
- Total Absences (Calendar purple icon)
- Pending Requests (Clock yellow icon)

[If Manager, additional]:
- Team Size (Users indigo icon)
- Pending Approvals (Clock orange icon, may be highlighted yellow)
- Avg Performance (Star yellow icon)
```

### Charts Section (3 columns on desktop)
```
1. Feedback Chart (FeedbackChart component)
2. Absence Chart (AbsenceChart component)
3. Upcoming Absences (UpcomingAbsences component)
```

### Recent Activity Feed
```
Title: "Recent Activity"
Description: "Your latest feedback and time off updates"

Activity Items:
  - Icon, Title, Description, Timestamp
  - Examples:
    - "You received feedback from Emily" - "2 hours ago"
    - "Your absence request was approved" - "1 day ago"

Empty State:
  - Icon: Activity (24px)
  - Text: "No recent activity yet"
  - Help text: "Give feedback or request time off..."
```

### Code Selectors
```javascript
// Click Give Feedback button
await page.click('button:has-text("Give Feedback")');

// Click Request Time Off button
await page.click('button:has-text("Request Time Off")');

// Click View My Profile
await page.click('a:has-text("View My Profile")');

// Check if manager (Pending Approvals visible)
await expect(page.locator('text=Pending Approvals')).toBeVisible();

// Get metrics card
const metricsCard = page.locator('text=Key Metrics').locator('..');

// Click role switcher
await page.click('[role="combobox"]'); // For Select trigger
```

---

## Profiles List Page (`/dashboard/profiles`)

### Header
```
Title: "Employee Profiles"
Description: "View and manage employee profiles across your organization"
```

### Filters Section
```
1. Search Input:
   - Icon: Search (magnifying glass)
   - Placeholder: "Search by name or email..."
   - Real-time filtering

2. Department Select:
   - Options: All Departments, [list of depts]
   - Default: All Departments

3. Role Select:
   - Options: All Roles, Manager, Employee, Coworker
   - Default: All Roles
```

### Data Table
```
Columns:
1. Name (left-aligned, medium font)
2. Email (gray, smaller font)
3. Department (gray text)
4. Title (gray text)
5. Role (Badge component, color-coded)
6. Actions (View button)

Sorting:
  - Click column header to sort
  - Arrow indicator shows direction

Loading State:
  - Loader2 spinner in center
  - Text: "Loading..."

Empty State:
  - Message: "No employees found."
```

### Load More Button
```
Text: "Load More"
Subtitle: "Loading..." (when fetching)
Location: Below table, center-aligned
Disabled: When no more pages available
```

### Results Summary
```
Text: "Showing X employees"
Location: Below Load More button
```

### Code Selectors
```javascript
// Search input
await page.fill('input[placeholder*="Search"]', 'emily');

// Department filter
await page.selectOption('select:first-of-type', 'Engineering');

// Role filter
await page.selectOption('select:nth-of-type(2)', 'MANAGER');

// Table rows
const rows = page.locator('tbody tr');

// Click View button in first row
await rows.first().locator('button:has-text("View")').click();

// Load More button
await page.click('button:has-text("Load More")');

// Wait for table to load
await page.waitForSelector('tbody tr');
```

---

## Profile Detail Page (`/dashboard/profiles/[id]`)

### Tabs
```
Tab List:
1. "Profile" (default selected)
2. "Feedback"
3. "Absences"

Active tab indicator: Underline
```

### Profile Tab

#### Profile Card
```
Header:
  - Avatar (circular, with initials fallback)
  - Name (h2, large)
  - Email (with Mail icon, gray)
  - Role Badge (color-coded)

Action:
  - [Edit Profile] button (top right, if user can edit)

Content Grid:
Basic Fields (visible to all):
  - Title (Briefcase icon)
  - Department (Building2 icon)
  - Bio (italic, gray text)

Sensitive Fields (visible to: self + managers):
  - Section: "Sensitive Information" (Shield icon, separator)
  - Salary (DollarSign icon)
  - Performance Rating (TrendingUp icon) - format: "X/5"
  - Address (MapPin icon)
  - SSN (Shield icon, monospace font)

Metadata:
  - "Member since: [date]"
  - "Last updated: [date]"
```

#### Edit Profile Dialog
```
Trigger: [Edit Profile] button

Dialog:
  Title: "Edit Profile"
  Description: "Make changes to your profile information..."

Form Fields:
  1. Avatar Upload (section at top)
  2. Name * (required)
  3. Email * (required)
  4. Title (optional)
  5. Department (optional)
  6. Bio (optional, textarea)

Buttons:
  - [Cancel]
  - [Save Changes] (may show loader icon when saving)
```

### Feedback Tab

#### Give Feedback Form (if viewing another's profile)
```
Card:
  Title: "Give Feedback to [Name]"

Form:
  Content textarea:
    - Placeholder: "Share your thoughts, observations, or suggestions..."
    - Min height: 150px
    - Character count: "X / 2000 chars"
    - Word count: "X / 5 words"

Buttons:
  - [Polish with AI] (outline button, disabled if <20 chars or <5 words)
    Icon: Sparkles
  - [Reset] (ghost, appears after polishing)

Polished Version Card:
  - Title: "AI-Polished Version" (with Sparkles icon)
  - Shows polished text in box
  - Buttons: [Use Polished Version] [Use Original Version]
  - Note text: "Both versions will be saved..."

Submit Buttons:
  - [Cancel] (outline)
  - [Submit Feedback] (primary)
    Text changes to "Submitting..." with spinner when loading
```

#### Feedback List
```
Each Feedback Item:
  - Avatar (initialed fallback)
  - Giver Name (bold)
  - [AI Polished] Badge (if applicable, Sparkles icon)
  - Timestamp (relative, "2 days ago")
  - Content text (preformatted, whitespace preserved)
  - [Expand button] if polished (shows original/polished toggle)
  - [Delete] button (trash icon, if user can delete)

Empty State:
  - Icon: Sparkles (24px)
  - Heading: "No feedback yet"
  - Message: "Be the first to provide constructive feedback..."

Polished Version Toggle:
  - Button text: "Show Polished Version" (ChevronDown) or "Show Original" (ChevronUp)
  - Expanded content shown in gray box below

Delete Confirmation:
  - Dialog title: "Delete Feedback"
  - Dialog message: "Are you sure you want to delete this feedback?..."
  - Buttons: [Cancel] [Delete] (destructive style)
```

### Absences Tab

#### Calendar Display
```
Component: AbsenceCalendar

Shows:
  - Calendar grid with current/selected month
  - Highlighted dates for user's absences
  - Click to navigate months
```

#### Permission Message (if no access)
```
Text: "You do not have permission to view absence requests for this user."
Centered, gray text, padding: py-12
```

### Code Selectors
```javascript
// Click Profile tab
await page.click('[role="tab"]:has-text("Profile")');

// Edit Profile button
await page.click('button:has-text("Edit Profile")');

// Name input in edit form
await page.fill('input[type="text"]', 'John Doe');

// Bio textarea
await page.fill('textarea', 'Updated bio...');

// Save changes
await page.click('button:has-text("Save Changes")');

// Feedback textarea
await page.fill('textarea[placeholder*="Share your thoughts"]', 'Great work!');

// Polish with AI button
await page.click('button:has-text("Polish with AI")');

// Submit feedback
await page.click('button:has-text("Submit Feedback")');

// Click Feedback tab
await page.click('[role="tab"]:has-text("Feedback")');

// Click Absences tab
await page.click('[role="tab"]:has-text("Absences")');

// Expand feedback (if polished)
await page.click('button:has-text("Show Polished Version")');

// Delete feedback button
await page.click('[role="button"] svg.lucide-trash-2');
```

---

## Feedback Page (`/dashboard/feedback`)

### Header
```
Title: "Feedback"
Description: "View and manage feedback you've received and given"
```

### Statistics Cards (Grid: 3 columns)
```
Card 1:
  Label: "Received"
  Value: [count]

Card 2:
  Label: "Given"
  Value: [count]

Card 3:
  Label: "AI Polished" (with Sparkles icon)
  Value: [count]
```

### Sort Controls
```
Label: "Sort by:"
Select:
  - Options: Most Recent (default), Oldest First
```

### Tabs
```
Tab 1: "Received ([count])"
Tab 2: "Given ([count])"
```

### Feedback Cards (in each tab)
```
Layout (identical to feedback list):
  - Avatar + giver/receiver name
  - [AI Polished] badge if applicable
  - Timestamp
  - Content (whitespace preserved)
  - [Show Polished Version] / [Show Original] toggle
  - Expandable to show polished content

Empty State (if no feedback):
  - Icon: MessageSquare (received) or Send (given)
  - Heading: "No feedback received yet" / "No feedback given yet"
  - Message: "When your colleagues provide feedback..." / "Start providing constructive feedback..."
```

### Code Selectors
```javascript
// Click Received tab
await page.click('[role="tab"]:has-text("Received")');

// Click Given tab
await page.click('[role="tab"]:has-text("Given")');

// Sort dropdown
await page.selectOption('select', 'oldest');

// Expand polished feedback
await page.click('button:has-text("Show Polished Version")');

// Statistics
const receivedCount = await page.locator('text=Received').locator('..').locator('div:has-text(/\\d+/)').textContent();

// Feedback card
const feedbackCards = page.locator('article, [role="article"]').filter({ has: page.locator('text=AI Polished') });
```

---

## Absence Page (`/dashboard/absences`)

### Header
```
Title: "Absence Management"
Description: "Manage your time-off requests and view absence calendar"

Button: [Request Time Off]
  - Opens AbsenceRequestDialog
```

### Statistics Cards (4 columns)
```
Card 1: Total Requests (value)
Card 2: Pending (yellow text, yellow title)
Card 3: Approved (green text)
Card 4: Rejected (red text)
```

### Tabs
```
Tab 1: "My Requests" (default)
Tab 2: "Calendar"
Tab 3: "Team Requests" (managers only, conditional)
```

### My Requests Tab

#### Absence Table
```
Columns:
  - Start Date
  - End Date
  - Reason
  - Status (badge: color-coded)
  - Actions (delete button)

Delete Button:
  - Trash icon
  - Opens confirmation dialog

Empty State:
  - Message: "No absence requests yet."
```

### Calendar Tab
```
Component: AbsenceCalendar

Displays:
  - Calendar grid
  - Highlighted dates for user's absences
  - Can click to navigate months
```

### Team Requests Tab (Managers)
```
Card:
  Title: "Team Absence Requests"
  Description: "Review and approve absence requests from your team"

Absence Table:
  Columns:
    - Employee Name
    - Start Date
    - End Date
    - Reason
    - Status (badge)
    - Actions (approve/reject buttons)

Action Buttons:
  - [Approve] (primary style)
  - [Reject] (destructive style)
  - May show spinner when processing
```

### Absence Request Dialog
```
Trigger: [Request Time Off] button

Dialog:
  Title: "Request Time Off"
  Description: "Submit an absence request for manager approval..."

Form:
  1. Start Date (Calendar Popover)
     - Picker opens on button click
     - Shows calendar
     - Disables past dates
     - Format: "PPP"

  2. End Date (Calendar Popover)
     - Same as Start Date

  3. Reason (Textarea)
     - Min height: 100px
     - Character counter: "X / 500"

Buttons:
  - [Cancel]
  - [Submit Request] (or "Submitting..." with spinner)
```

### Code Selectors
```javascript
// Request Time Off button
await page.click('button:has-text("Request Time Off")');

// Start date picker
await page.click('button:has-text("Pick a date")'); // First one

// Select date in calendar
await page.click('[role="gridcell"]:has-text("10")'); // Day 10

// Reason textarea
await page.fill('textarea[placeholder*="reason"]', 'Vacation');

// Submit absence request
await page.click('button:has-text("Submit Request")');

// My Requests tab
await page.click('[role="tab"]:has-text("My Requests")');

// Calendar tab
await page.click('[role="tab"]:has-text("Calendar")');

// Team Requests tab (if visible)
await page.click('[role="tab"]:has-text("Team Requests")');

// Delete button in table
await page.locator('tbody tr').first().locator('[role="button"] svg.lucide-trash-2').click();

// Approve button (manager)
await page.locator('tbody tr').first().locator('button:has-text("Approve")').click();

// Reject button (manager)
await page.locator('tbody tr').first().locator('button:has-text("Reject")').click();

// Confirm delete dialog
await page.click('[role="alertdialog"] button:has-text("Delete")');

// Statistics
const pendingCount = await page.locator('text=Pending').locator('..').locator('div:has-text(/\\d+/)').textContent();
```

---

## Common UI Element Selectors

### Buttons
```javascript
// By text
await page.click('button:has-text("Save")');

// By type
await page.click('button[type="submit"]');

// By role
await page.click('[role="button"]:has-text("Text")');

// With icon (e.g., delete)
await page.click('button svg.lucide-trash-2');

// Disabled state
await expect(page.locator('button:has-text("Save")')).toBeDisabled();

// Loading state
await expect(page.locator('svg.animate-spin')).toBeVisible();
```

### Form Inputs
```javascript
// Text input
await page.fill('input[type="text"]', 'value');

// Email input
await page.fill('input[type="email"]', 'test@example.com');

// Textarea
await page.fill('textarea', 'content...');

// Select/Dropdown
await page.selectOption('select', 'OPTION_VALUE');

// Checkbox
await page.check('input[type="checkbox"]');

// Radio button
await page.click('input[type="radio"][value="value"]');

// Date input (via popover)
await page.click('button:has-text("Pick a date")');
await page.click('[role="gridcell"]:has-text("10")');

// Check for validation error
await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
```

### Dialogs
```javascript
// Wait for dialog
await page.waitForSelector('[role="dialog"]');

// Dialog title
await expect(page.locator('[role="dialog"] h2')).toContainText('Title');

// Dialog button
await page.click('[role="dialog"] button:has-text("Submit")');

// Close dialog
await page.click('[role="dialog"] [aria-label="Close"]');
// OR
await page.press('Escape');
```

### Tables
```javascript
// Get all rows
const rows = page.locator('tbody tr');

// Get specific cell
const cell = rows.first().locator('td:nth-child(1)');

// Click button in row
await rows.nth(1).locator('button').click();

// Get cell text
const text = await rows.first().locator('td').first().textContent();
```

### Tabs
```javascript
// Click tab
await page.click('[role="tab"]:has-text("Tab Name")');

// Check active tab
await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Tab Name');
```

### Toast Notifications
```javascript
// Wait for toast
await page.waitForSelector('[role="status"]');

// Success toast
await expect(page.locator('[role="status"]')).toContainText('successfully');

// Error toast
await expect(page.locator('[role="status"]')).toContainText('error');
```

### Badges & Tags
```javascript
// Badge with text
await expect(page.locator('span:has-text("MANAGER")')).toBeVisible();

// Role badge
const badge = page.locator('div:has-text("EMPLOYEE")');

// AI Polished badge
await expect(page.locator('[class*="badge"]:has-text("AI Polished")')).toBeVisible();
```

### Skeletons & Loading
```javascript
// Wait for skeleton to disappear
await page.waitForSelector('[class*="skeleton"]', { state: 'hidden' });

// Wait for content to appear
await page.waitForSelector('text=Expected Content');

// Check loading spinner
await expect(page.locator('svg[class*="animate-spin"]')).toBeVisible();
```

---

## Navigation Selectors

### Sidebar Links
```javascript
// Dashboard link
await page.click('a:has-text("Dashboard")');

// Profiles link
await page.click('a:has-text("Profiles")');

// Feedback link
await page.click('a:has-text("Feedback")');

// Absences link
await page.click('a:has-text("Absences")');

// Logout button
await page.click('button:has-text("Logout")');

// Check active link
await expect(page.locator('a[aria-current="page"]')).toContainText('Dashboard');
```

### Mobile Menu
```javascript
// Open menu
await page.click('button[aria-label*="menu" i]');

// Close menu
await page.press('Escape');
// OR
await page.click('a:has-text("Dashboard")'); // Clicking link closes it
```

---

## Example Test Cases Using Selectors

```javascript
// TEST: Login and view dashboard
await page.goto('/login');
await page.fill('input[type="email"]', 'emily@example.com');
await page.selectOption('select', 'MANAGER');
await page.click('button[type="submit"]');
await page.waitForNavigation();
await expect(page).toHaveURL('/dashboard');
await expect(page.locator('text=Welcome,')).toBeVisible();

// TEST: Navigate to profiles
await page.click('a:has-text("Profiles")');
await page.waitForSelector('tbody tr');
await expect(page.locator('text=Employee Profiles')).toBeVisible();

// TEST: Filter profiles by department
await page.selectOption('select:nth-of-type(1)', 'Engineering');
await page.waitForSelector('tbody tr');
const rows = page.locator('tbody tr');
await expect(rows).toHaveCount(5); // Example count

// TEST: Give feedback
await page.click('button:has-text("Give Feedback")');
await page.waitForSelector('[role="dialog"]');
await page.click('button:has-text("Emily")'); // Select user
await page.fill('textarea', 'Great work on the project!');
await page.click('button:has-text("Submit Feedback")');
await expect(page.locator('[role="status"]')).toContainText('success');

// TEST: Request time off
await page.click('button:has-text("Request Time Off")');
await page.click('button:has-text("Pick a date")');
await page.click('[role="gridcell"]:has-text("15")'); // Start date
await page.click('button:has-text("Pick a date")'); // Click next one for end date
await page.click('[role="gridcell"]:has-text("20")'); // End date
await page.fill('textarea', 'Family vacation');
await page.click('button:has-text("Submit Request")');
await expect(page.locator('[role="status"]')).toContainText('success');
```

---

**Last Updated:** 2025-11-10
