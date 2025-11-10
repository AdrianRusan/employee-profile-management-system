# E2E Testing Documentation Index

## Overview

This documentation package provides comprehensive guidance for writing end-to-end tests for the Employee Profile Management System. All features documented here are **fully implemented and working** in the application.

**Created:** 2025-11-10  
**Status:** Ready for Test Development

---

## Documentation Files

### 1. **E2E_FEATURES_SUMMARY.md** - START HERE
**Purpose:** High-level overview of what's real vs planned  
**Contains:**
- ✅ Real features (fully implemented)
- ❌ Features not implemented
- Implementation status by feature
- What to focus on for testing
- Technology stack reference
- Deployment readiness assessment

**Best for:** Understanding scope, deciding what to test, planning test strategy

**Read Time:** 15 minutes

---

### 2. **E2E_TEST_DOCUMENTATION.md** - COMPREHENSIVE REFERENCE
**Purpose:** Complete feature inventory with code snippets  
**Contains:**
- Pages/routes mapping (all URLs)
- Authentication system details (email-based login)
- Dashboard page components
- Profile features (listing, detail, editing)
- Feedback system (form, display, AI polishing)
- Absence management (requests, approval, calendar)
- Role-based access control
- Navigation flow diagrams
- API endpoints reference
- UI components used
- Tech stack
- Key files for testing

**Best for:** Understanding how features work, finding relevant code, writing test steps

**Read Time:** 45 minutes

**Use when:** You need to understand a specific feature in depth

---

### 3. **E2E_TEST_QUICK_REFERENCE.md** - CHEAT SHEET
**Purpose:** Quick lookup tables and patterns  
**Contains:**
- Demo login accounts
- All page URLs and features
- Form field validation rules
- Feature checklist (what to test)
- Role permissions matrix
- Common UI patterns
- Component locations
- API endpoints quick list
- Quick action button descriptions
- Debugging tips
- Known behaviors
- Accessibility notes

**Best for:** Quick lookups while writing tests, remembering feature names

**Read Time:** 10 minutes (lookup)

**Use constantly:** Keep open while writing tests

---

### 4. **E2E_TEST_SELECTORS.md** - IMPLEMENTATION GUIDE
**Purpose:** Actual CSS selectors and element references for test automation  
**Contains:**
- Login page selectors
- Dashboard page selectors
- Profiles list selectors
- Profile detail selectors
- Feedback page selectors
- Absence page selectors
- Common UI element patterns
- Navigation selectors
- Example test cases using selectors
- Copy-paste ready code snippets

**Best for:** Actually writing the test code, finding right selectors

**Read Time:** 30 minutes (reference)

**Use when:** Writing Playwright/Cypress tests

---

## Reading Path by Role

### Test Automation Engineer (Writing Tests)
1. Start: **E2E_FEATURES_SUMMARY.md** (5 min) - Understand scope
2. Reference: **E2E_TEST_DOCUMENTATION.md** (skim) - Know what features exist
3. Implement: **E2E_TEST_SELECTORS.md** - Write actual tests
4. Keep handy: **E2E_TEST_QUICK_REFERENCE.md** - For quick lookups

**Total reading:** ~1 hour to get started

---

### QA/Test Manager (Planning Tests)
1. Start: **E2E_FEATURES_SUMMARY.md** - Understand what's real vs planned
2. Review: **E2E_TEST_DOCUMENTATION.md** - Map features to test cases
3. Plan: Use **E2E_TEST_QUICK_REFERENCE.md** checklists
4. Estimate: How many tests needed (typically 50-100 E2E tests)

**Total reading:** ~45 minutes

---

### Product Owner (Feature Review)
1. Start: **E2E_FEATURES_SUMMARY.md** - Real vs Planned section
2. Check: **E2E_TEST_DOCUMENTATION.md** - Verify implemented features
3. Reference: **E2E_TEST_QUICK_REFERENCE.md** - Feature checklist

**Total reading:** ~20 minutes

---

### Developer (Backend/API)
1. Check: **E2E_TEST_DOCUMENTATION.md** (API section) - See what tests will call
2. Reference: **E2E_TEST_QUICK_REFERENCE.md** - API endpoints list
3. Review: **E2E_TEST_SELECTORS.md** - See what form fields tests use

**Total reading:** ~15 minutes

---

## Feature Coverage Summary

### Ready to Test (100% Implemented)
```
✅ Authentication (login, logout, session)
✅ Dashboard (metrics, charts, activity)
✅ Employee directory (search, filter, sort, pagination)
✅ Profile viewing (public + sensitive data)
✅ Profile editing (name, email, title, dept, bio, avatar)
✅ Feedback giving (AI polishing included)
✅ Feedback viewing (received/given)
✅ Feedback deletion
✅ Absence requests (date picker, reason)
✅ Absence calendar (visual display)
✅ Absence approval (manager action)
✅ Role-based access (3 roles, permission checks)
✅ Navigation (desktop sidebar + mobile menu)
✅ Error handling (boundaries, toasts, validation)
✅ Responsive design (mobile to desktop)
```

### Demo Accounts
```
Manager:   emily@example.com
Employee:  david@example.com
Coworker:  sarah@example.com
```
No password needed - email login only.

---

## Test Organization Recommendation

### Test File Structure
```
tests/e2e/
├── auth/
│   ├── login.spec.ts
│   └── session.spec.ts
├── dashboard/
│   ├── overview.spec.ts
│   └── quick-actions.spec.ts
├── profiles/
│   ├── list.spec.ts
│   ├── detail.spec.ts
│   ├── edit.spec.ts
│   └── permissions.spec.ts
├── feedback/
│   ├── give-feedback.spec.ts
│   ├── view-feedback.spec.ts
│   ├── ai-polish.spec.ts
│   └── delete-feedback.spec.ts
├── absences/
│   ├── request-absence.spec.ts
│   ├── view-calendar.spec.ts
│   ├── approve-absence.spec.ts
│   └── permissions.spec.ts
├── navigation/
│   ├── sidebar.spec.ts
│   └── mobile-menu.spec.ts
├── accessibility/
│   ├── keyboard-navigation.spec.ts
│   └── screen-reader.spec.ts
└── fixtures/
    ├── auth.ts (login helpers)
    └── db.ts (database reset)
```

### Test Coverage Estimate
- **Authentication:** 8-10 tests
- **Dashboard:** 10-12 tests
- **Profiles:** 20-25 tests
- **Feedback:** 15-20 tests
- **Absences:** 20-25 tests
- **Navigation:** 10-12 tests
- **Permissions:** 15-20 tests
- **Accessibility:** 10-15 tests
- **Error Handling:** 10-12 tests

**Total: 120-150 E2E tests recommended**

---

## Key Testing Scenarios

### Must Test
1. **Login with valid email** → Should authenticate
2. **View dashboard** → Should show metrics and activity
3. **Search profiles** → Should filter results
4. **Give feedback** → Should create and display
5. **Request absence** → Should create and display
6. **Approve absence (manager)** → Should update status
7. **Edit profile** → Should save changes
8. **View sensitive data (manager vs employee)** → Should respect permissions
9. **Logout** → Should clear session
10. **Navigate all pages** → Should render correctly

### Should Test
- All search/filter combinations
- Form validation (empty, invalid, boundary)
- Role-based visibility changes
- Error states (API failures, validation)
- Loading states during data fetch
- Empty states (no data)
- Pagination (load more)
- Sorting by column
- AI polishing (may need to mock)
- Date picker edge cases

### Could Test
- Accessibility (keyboard, screen reader)
- Performance (load times)
- Concurrent operations
- Edge cases (very long names, special characters)
- Browser compatibility

---

## Test Data Considerations

### Use Demo Accounts
```javascript
// Manager view
await login('emily@example.com', 'MANAGER');

// Employee view
await login('david@example.com', 'EMPLOYEE');

// Coworker view
await login('sarah@example.com', 'COWORKER');
```

### Database State
- Pre-seed test data or create during tests
- Clear database between test runs (or use transactions)
- Use Prisma for test fixtures

### External Dependencies
- AI polishing service: Consider mocking in tests
- File uploads: Use test image files
- Dates: Use relative dates (today, tomorrow, next week)

---

## Common Test Patterns

### Pattern: Login and Navigate
```javascript
test('should login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'emily@example.com');
  await page.selectOption('select', 'MANAGER');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome,')).toBeVisible();
});
```

### Pattern: Fill Form and Submit
```javascript
test('should create feedback', async ({ page }) => {
  await loginAs(page, 'emily@example.com');
  
  await page.click('button:has-text("Give Feedback")');
  await page.click('button:has-text("David")'); // Select user
  
  await page.fill('textarea', 'Great work!');
  await page.click('button:has-text("Submit Feedback")');
  
  await expect(page.locator('[role="status"]')).toContainText('success');
});
```

### Pattern: Check Permissions
```javascript
test('should not show sensitive data to employee', async ({ page }) => {
  await loginAs(page, 'david@example.com', 'EMPLOYEE');
  
  await page.goto('/dashboard/profiles/emily-id');
  
  // Salary should NOT be visible
  await expect(page.locator('text=Salary')).toBeHidden();
});
```

### Pattern: Manager Actions
```javascript
test('should allow manager to approve absence', async ({ page }) => {
  await loginAs(page, 'emily@example.com', 'MANAGER');
  
  await page.click('a:has-text("Absences")');
  await page.click('[role="tab"]:has-text("Team Requests")');
  
  await page.locator('tbody tr').first().locator('button:has-text("Approve")').click();
  
  await expect(page.locator('[role="status"]')).toContainText('approved');
});
```

---

## Best Practices for These Tests

### 1. Test Real User Workflows
Write tests that mirror actual user journeys:
- Login → View dashboard → Browse profiles → Give feedback
- Login → Request time off → See in calendar
- As manager: Approve pending requests

### 2. Use Test Fixtures
Create reusable login helpers:
```javascript
async function loginAs(page, email, role = 'EMPLOYEE') {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  if (role) await page.selectOption('select', role);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}
```

### 3. Wait for Content
Always wait for data to load:
```javascript
await page.waitForSelector('tbody tr'); // Table loaded
await page.waitForNavigation(); // Page changed
await page.waitForSelector('[role="status"]'); // Toast appeared
```

### 4. Check Both Presence and Content
```javascript
// Good: Checks both existence and text
await expect(page.locator('[role="status"]')).toContainText('success');

// Avoid: Just checking element exists
await expect(page.locator('[role="status"]')).toBeVisible();
```

### 5. Test Error States
```javascript
// Try submitting empty form
await page.click('button[type="submit"]');

// Check for error messages
await expect(page.locator('text=Email is required')).toBeVisible();
```

---

## Debugging Failed Tests

### Check Element Selection
Use page.locator to verify:
```javascript
const count = await page.locator('tbody tr').count();
console.log(`Found ${count} rows`);
```

### Take Screenshots
```javascript
await page.screenshot({ path: 'debug.png' });
```

### Use Trace
```javascript
// In playwright.config.ts:
trace: 'on-first-retry'
```

### Check Network Calls
Look at tRPC calls in Network tab:
- `/api/trpc/...` endpoints
- Check request/response bodies

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run start &
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Resources

### Official Docs
- Playwright: https://playwright.dev
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- React Testing Library: https://testing-library.com

### Related Documentation in This Project
- See `DEPLOYMENT_CHECKLIST.md` for deployment steps
- See `PRODUCTION_DEPLOYMENT_GUIDE.md` for production setup
- See `RUNBOOK.md` for operational procedures

---

## Questions & Answers

**Q: How long will it take to write a complete E2E test suite?**  
A: 3-5 days for 100+ comprehensive tests with fixtures and helpers.

**Q: Do I need to test every role combination?**  
A: Test the critical paths: manager, employee, coworker. Use permission tests for edge cases.

**Q: Should I mock the AI polishing?**  
A: Yes - use `page.route()` to intercept and mock API responses in tests.

**Q: How often should tests run?**  
A: Ideally on every commit. Realistically: pre-deployment. Minimum: daily.

**Q: Can I run tests in parallel?**  
A: Yes, but auth tests should be sequential. Set `workers: 1` for serial, or use separate users.

**Q: What about test flakiness?**  
A: Use proper waits (`.waitForNavigation()`, `.waitForSelector()`). Avoid arbitrary sleeps.

---

## Checklist: Before You Start Writing Tests

- [ ] Read **E2E_FEATURES_SUMMARY.md** (understand scope)
- [ ] Review **E2E_TEST_DOCUMENTATION.md** (know the features)
- [ ] Run the app locally (`npm run dev`)
- [ ] Test manually: Login → Dashboard → Profiles → Feedback → Absences
- [ ] Create Playwright project (`npx playwright install`)
- [ ] Set up test structure (files and fixtures)
- [ ] Create login helper function
- [ ] Write first test (login)
- [ ] Get first test passing
- [ ] Keep **E2E_TEST_SELECTORS.md** open while coding
- [ ] Build incrementally (test 1-2 features at a time)
- [ ] Run tests frequently
- [ ] Commit tests as you go

---

## Summary Table

| Document | Best For | Length | When to Read |
|----------|----------|--------|--------------|
| E2E_FEATURES_SUMMARY.md | Understanding scope | 15 min | First thing |
| E2E_TEST_DOCUMENTATION.md | Learning features | 45 min | Planning phase |
| E2E_TEST_QUICK_REFERENCE.md | Quick lookups | 10 min lookup | While writing tests |
| E2E_TEST_SELECTORS.md | Writing code | 30 min reference | During implementation |

---

## Next Steps

1. **Read** E2E_FEATURES_SUMMARY.md (15 min)
2. **Review** E2E_TEST_DOCUMENTATION.md (30 min)
3. **Setup** Playwright in your project
4. **Create** test fixtures and helpers
5. **Write** first test using E2E_TEST_SELECTORS.md
6. **Run** tests with `npx playwright test`
7. **Iterate** building more tests

---

**Document Created:** 2025-11-10  
**Status:** Ready for Test Development  
**Last Updated:** 2025-11-10

For questions, refer back to the specific documentation files above.
