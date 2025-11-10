# E2E Test Tagging Strategy

This document explains the tiered testing strategy for our E2E test suite and how to properly tag tests.

## Overview

We use a 3-tier testing approach to optimize CI/CD pipeline performance while maintaining comprehensive test coverage:

- **Smoke Tests** (`@smoke`): 12 critical tests (~5-8 minutes)
- **Core Tests** (`@core`): 23 additional important tests (~15-20 minutes total with smoke)
- **Full Suite**: All 55 tests including edge cases (~30-45 minutes)

This follows the testing pyramid principle and industry best practices, where most teams run 10-50 critical E2E tests in their main CI pipeline.

## Test Distribution

### Current Test Breakdown

| File | Smoke | Core | Untagged | Total |
|------|-------|------|----------|-------|
| auth.spec.ts | 4 | 4 | 2 | 10 |
| profile.spec.ts | 3 | 5 | 5 | 13 |
| feedback.spec.ts | 2 | 5 | 6 | 13 |
| absence.spec.ts | 2 | 6 | 9 | 17 |
| csrf-protection.spec.ts | 1 | 3 | 8 | 12 |
| **TOTAL** | **12** | **23** | **20** | **55** |

## When to Use Each Tag

### @smoke Tag

**Criteria:**
- Critical user authentication flows
- Essential CRUD operations (create/read)
- Core security features (CSRF protection)
- Features that would prevent all users from working if broken
- Happy path scenarios for critical features

**Examples:**
```typescript
test('should login with valid credentials @smoke', async ({ page }) => {
  // Authentication is critical - without it, nothing else works
});

test('Employee should submit feedback to coworker @smoke', async ({ page }) => {
  // Core feedback feature - primary use case
});

test('should generate CSRF token on page load @smoke', async ({ page }) => {
  // Security critical - protects all state-changing operations
});
```

**Guidelines:**
- Keep smoke tests to 10-15 tests maximum
- Each smoke test should run in under 30 seconds
- Focus on "can users do their primary job?"
- Avoid testing edge cases or validation errors

### @core Tag

**Criteria:**
- Permission and authorization checks
- Form validation (error states)
- Secondary workflows (edit, delete)
- Role-based feature access
- Important but non-critical features
- Manager-specific workflows

**Examples:**
```typescript
test('Coworker should see limited profile fields @core', async ({ page }) => {
  // Permission check - important but not critical path
});

test('Feedback validation - minimum length @core', async ({ page }) => {
  // Validation error - important UX but not a blocker
});

test('Manager should approve absence request @core', async ({ page }) => {
  // Manager workflow - important but not used by all users
});
```

**Guidelines:**
- Keep core tests to 20-30 tests
- Include all permission boundaries
- Test validation rules
- Cover secondary user roles (managers, admins)

### Untagged (Full Suite Only)

**Criteria:**
- Edge cases and rare scenarios
- Advanced features (AI polish, complex filters)
- UI polish features (avatars, badges)
- Comprehensive validation coverage
- Rarely-used workflows
- Detailed security scenarios

**Examples:**
```typescript
test('AI Polish feedback feature', async ({ page }) => {
  // Advanced feature - nice to have but not critical
});

test('Avatar upload should work', async ({ page }) => {
  // UI enhancement - not a blocker if broken
});

test('should prevent CSRF attack scenario', async ({ page }) => {
  // Comprehensive security test - important but covered by smoke tests
});
```

**Guidelines:**
- No limit on number of untagged tests
- Test edge cases thoroughly
- Include "what-if" scenarios
- Test advanced or optional features

## Running Tests Locally

### Run Smoke Tests Only
```bash
npm run test:e2e:smoke
```
- Runs 12 critical tests
- Uses 4 parallel workers
- Takes ~5-8 minutes
- Perfect for quick validation before pushing

### Run Core Tests (includes Smoke)
```bash
npm run test:e2e:core
```
- Runs 35 tests (12 smoke + 23 core)
- Uses 3 parallel workers
- Takes ~15-20 minutes
- Run before opening a PR

### Run Full Suite
```bash
npm run test:e2e:full
```
- Runs all 55 tests
- Uses 5 parallel workers
- Takes ~30-45 minutes
- Run before major releases

### Run All Tests (Development)
```bash
npm run test:e2e
```
- Runs all tests on all browsers (chromium, firefox, webkit, mobile)
- No parallelization limits
- Use for comprehensive local testing

## CI/CD Pipeline Behavior

### Pull Requests
- **Smoke tests** run on every PR commit
- Fast feedback (5-8 minutes)
- Blocks merge if smoke tests fail

### Main Branch
- **Smoke tests** run on every push
- **Core tests** run on every push to main
- Combined feedback in ~20 minutes

### Nightly Builds
- **Full suite** runs at 2 AM UTC
- Comprehensive coverage of all 55 tests
- Creates GitHub issue if tests fail
- Uploads test videos for debugging

## How to Tag New Tests

### Step 1: Write Your Test
```typescript
test('New feature should work', async ({ page }) => {
  // Your test code
});
```

### Step 2: Evaluate Criticality

Ask yourself:
1. **Is this feature critical to the app functioning?** → `@smoke`
2. **Does this test permissions or important validations?** → `@core`
3. **Is this an edge case or advanced feature?** → No tag

### Step 3: Add the Tag
```typescript
test('New feature should work @smoke', async ({ page }) => {
  // Your test code
});
```

### Step 4: Update This Document
If you add a smoke or core test, update the test distribution table above.

## Best Practices

### ✅ DO
- Tag critical authentication/authorization tests as `@smoke`
- Tag permission checks as `@core`
- Keep smoke tests fast (< 30 seconds each)
- Test happy paths in smoke tests
- Test error paths in core tests
- Leave edge cases untagged

### ❌ DON'T
- Don't tag every test as `@smoke`
- Don't test UI details in smoke tests
- Don't skip tagging important permission tests
- Don't tag flaky tests as `@smoke`
- Don't test advanced features in smoke tests

## Examples by Feature Area

### Authentication
```typescript
// @smoke - Critical login flow
test('should login with valid credentials @smoke', async ({ page }) => { });

// @core - Error handling
test('should show error with invalid credentials @core', async ({ page }) => { });

// Untagged - Edge case
test('should preserve return URL after login', async ({ page }) => { });
```

### CRUD Operations
```typescript
// @smoke - Create operation (happy path)
test('Employee should submit feedback @smoke', async ({ page }) => { });

// @core - Validation
test('Feedback validation - minimum length @core', async ({ page }) => { });

// Untagged - Advanced feature
test('AI Polish feedback feature', async ({ page }) => { });
```

### Permissions
```typescript
// @smoke - Manager can access everything
test('Manager should view all profile fields @smoke', async ({ page }) => { });

// @core - Coworker restrictions
test('Coworker should see limited profile fields @core', async ({ page }) => { });

// Untagged - Complex permission scenario
test('Coworker cannot view other coworker feedback', async ({ page }) => { });
```

## Monitoring and Maintenance

### Weekly Review
- Review test execution times in CI
- Identify slow smoke tests (> 30 seconds) and consider moving to core
- Check if any core tests should be promoted to smoke

### Monthly Review
- Review smoke/core test coverage
- Ensure critical paths are still covered
- Remove or retag deprecated features

### When Tests Fail
1. **Smoke failure**: Stop everything - critical path is broken
2. **Core failure**: Investigate before merge - important feature broken
3. **Full suite failure**: Investigate within 24 hours - edge case or rare bug

## Troubleshooting

### Smoke Tests Taking Too Long
- Review each smoke test execution time
- Move slower tests to `@core`
- Optimize test setup/teardown
- Consider if test is truly critical

### Core Tests Frequently Failing
- May indicate flaky test - investigate root cause
- Consider moving to full suite if too flaky
- Check if test is environment-dependent

### Full Suite Never Finishes
- Review test parallelization settings in `playwright.config.ts`
- Check for tests with infinite waits
- Ensure test isolation (no interdependencies)

## Related Files

- `playwright.config.ts` - Test configuration and grep patterns
- `.github/workflows/ci.yml` - PR and main branch CI configuration
- `.github/workflows/nightly-e2e.yml` - Nightly full suite configuration
- `package.json` - npm scripts for running test suites

## Questions?

If you're unsure whether to tag a test as `@smoke` or `@core`, err on the side of caution:
- If in doubt between `@smoke` and `@core`, use `@core`
- If in doubt between `@core` and untagged, use `@core`

The goal is fast feedback without sacrificing coverage.
