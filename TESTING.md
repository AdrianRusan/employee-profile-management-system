# Testing Documentation

## Overview

This document outlines the comprehensive testing infrastructure implemented for the Employee Profile Management System as part of Phase 7 (Testing & Quality Assurance).

## Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright
- **Code Coverage**: Jest Coverage
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## Test Structure

```
.
├── components/__tests__/           # Component unit tests
│   ├── FeedbackForm.test.tsx
│   ├── PermissionGate.test.tsx
│   └── ProfileCard.test.tsx
├── lib/validations/__tests__/      # Validation schema tests
│   ├── absence.test.ts
│   ├── feedback.test.ts
│   └── user.test.ts
├── server/routers/__tests__/       # tRPC procedure tests
│   ├── absence.test.ts
│   ├── feedback.test.ts
│   └── user.test.ts
└── tests/e2e/                      # End-to-end tests
    ├── absence.spec.ts
    ├── auth.spec.ts
    ├── feedback.spec.ts
    └── profile.spec.ts
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
# Run TypeScript type check
npm run type-check
```

### Full Validation

```bash
# Run all validations (type-check + lint + test)
npm run validate
```

## Test Coverage

### Unit Tests

#### Zod Validation Schemas
- **user.test.ts**: Validates profile and sensitive profile schemas
  - Tests minimum/maximum field lengths
  - Tests required fields
  - Tests email validation
  - Tests performance rating bounds (1-5)

- **feedback.test.ts**: Validates feedback schema
  - Tests content length constraints (10-2000 characters)
  - Tests receiverId format validation

- **absence.test.ts**: Validates absence request schema
  - Tests date range validation
  - Tests cross-field validation (endDate > startDate)
  - Tests reason minimum length

#### tRPC Procedures
- **user.test.ts**: Tests user management procedures
  - `user.getById`: Role-based field filtering
  - `user.update`: Authorization checks (self or MANAGER)
  - `user.updateSensitive`: MANAGER-only access

- **feedback.test.ts**: Tests feedback procedures
  - `feedback.create`: Authenticated user creation
  - `feedback.getForUser`: Visibility rules (MANAGER + recipient)
  - `feedback.delete`: Deletion permissions (giver + MANAGER)

- **absence.test.ts**: Tests absence management procedures
  - `absence.create`: Overlap prevention
  - `absence.getForUser`: Access control
  - `absence.updateStatus`: Manager-only approval/rejection

#### React Components
- **ProfileCard.test.tsx**: Tests profile display component
  - Sensitive field visibility based on role
  - Edit button display based on permissions
  - Proper rendering of user information

- **FeedbackForm.test.tsx**: Tests feedback form component
  - Character count validation
  - Form submission handling
  - AI polish button functionality

- **PermissionGate.test.tsx**: Tests permission control component
  - Role-based content rendering
  - Fallback content display

### E2E Tests

#### Authentication (auth.spec.ts)
- Unauthenticated redirect to login
- Login with valid/invalid credentials
- Session persistence across refreshes
- Role switching for demo purposes
- Logout functionality

#### Profile Management (profile.spec.ts)
- Manager viewing/editing any profile
- Employee viewing/editing own profile
- Coworker viewing non-sensitive fields only
- Optimistic updates

#### Feedback System (feedback.spec.ts)
- Coworker leaving feedback
- AI polish feature
- Feedback visibility rules
- Feedback metadata display

#### Absence Management (absence.spec.ts)
- Employee requesting time off
- Overlap prevention
- Manager approval/rejection
- Calendar view display

## Test Configuration

### Jest Configuration (jest.config.js)
- Uses `next/jest` preset for Next.js compatibility
- jsdom test environment for React components
- Module path mapping for `@/` alias
- Coverage collection from app, components, lib, and server directories

### Playwright Configuration (playwright.config.ts)
- Tests against Chromium, Firefox, and WebKit
- Mobile viewport testing (Pixel 5, iPhone 12)
- Automatic dev server startup
- Trace collection on test failures

### Test Utilities (lib/test-utils.tsx)
- Custom render function with providers
- Mock user data (Manager, Employee, Coworker)
- Mock feedback and absence request data
- React Query and SessionProvider wrappers

## Quality Gates

### Pre-commit Checks
- TypeScript compilation (`tsc --noEmit`)
- ESLint validation
- Unit test execution
- Code formatting (Prettier)

### CI/CD Pipeline (Recommended)
```yaml
1. Run type-check
2. Run lint
3. Run unit tests with coverage
4. Run E2E tests
5. Check coverage thresholds (>80%)
```

## Best Practices

### Writing Unit Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. Test one behavior per test
3. Use descriptive test names
4. Mock external dependencies
5. Test both happy and error paths

### Writing E2E Tests
1. Use data-testid for stable selectors
2. Wait for elements to be visible
3. Test critical user journeys
4. Keep tests independent
5. Use Page Object Model for complex flows

### Test Naming Convention
- Describe what the test validates
- Use "should" statements
- Example: "should allow MANAGER to view sensitive fields"

## Security Testing

### Performed Checks
- npm audit for dependency vulnerabilities
- Input validation testing
- Authorization boundary testing
- XSS protection (React's built-in escaping)
- CSRF protection (Next.js built-in)

### Security Audit Results
- All high-severity vulnerabilities fixed
- tRPC upgraded to v11.1.1+ to address WebSocket DoS vulnerability
- Zero known vulnerabilities in dependencies

## Performance Testing

### Lighthouse Metrics (Target)
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### API Response Times (Target)
- Read operations: < 200ms
- Write operations: < 500ms

## Continuous Improvement

### Future Enhancements
1. Increase unit test coverage to 90%+
2. Add visual regression testing
3. Implement mutation testing
4. Add performance benchmarking
5. Integrate with SonarQube for code quality metrics

## Troubleshooting

### Common Issues

**Jest errors with ES modules**
- Ensure `jest.config.js` uses `next/jest` preset
- Check `package.json` for correct Jest version

**Playwright browser not found**
- Run `npx playwright install`

**TypeScript errors in tests**
- Check `tsconfig.json` includes test files
- Verify `@types/jest` and `@testing-library/jest-dom` are installed

**Test timeouts**
- Increase timeout in test file or Jest config
- Check for unresolved promises

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
