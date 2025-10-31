# Testing Documentation

## Overview

This document outlines the testing infrastructure implemented for the Employee Profile Management System as part of Phase 7 (Testing & Quality Assurance).

## Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright (configured, tests to be implemented)
- **Code Coverage**: Jest Coverage
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## Current Test Coverage

### ✅ Validation Schema Tests (PASSING)

All Zod validation schema tests are implemented and passing:

#### User Validation (`lib/validations/__tests__/user.test.ts`) - 11 tests
- ✅ Profile schema validation (name, email, title, department, bio)
- ✅ Email format validation
- ✅ Field length constraints (name ≤ 100, bio ≤ 500)
- ✅ Sensitive profile schema (salary, performance rating)
- ✅ Performance rating bounds (1-5)
- ✅ Optional field handling

#### Feedback Validation (`lib/validations/__tests__/feedback.test.ts`) - 7 tests
- ✅ Content length constraints (10-2000 characters)
- ✅ Receiver ID format validation (CUID)
- ✅ Required field validation
- ✅ Boundary testing (min/max lengths)

#### Absence Validation (`lib/validations/__tests__/absence.test.ts`) - 8 tests
- ✅ Date range validation
- ✅ Cross-field validation (endDate > startDate)
- ✅ Reason minimum length (10 characters)
- ✅ Same-day requests with different times
- ✅ Required field validation

**Total: 26 passing tests**

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

### Test Results

```
Test Suites: 3 passed, 3 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        ~1.4s
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

## Test Structure

```
.
├── lib/validations/__tests__/      # ✅ Validation schema tests (IMPLEMENTED)
│   ├── absence.test.ts            # 8 passing tests
│   ├── feedback.test.ts           # 7 passing tests
│   └── user.test.ts               # 11 passing tests
├── jest.config.js                 # Jest configuration
├── jest.setup.js                  # Jest setup file
├── lib/test-utils.tsx             # Test utilities and mock data
└── playwright.config.ts           # Playwright configuration (ready for E2E)
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses `next/jest` preset for Next.js compatibility
- jsdom test environment for React components
- Module path mapping for `@/` alias
- Coverage collection from lib directory
- E2E tests excluded from Jest (should use Playwright)

### Test Utilities (`lib/test-utils.tsx`)
- Custom render function with React Query provider
- Mock user data (Manager, Employee, Coworker)
- Mock feedback and absence request data
- Reusable test helpers

## Security Testing

### ✅ Security Audit Results
- All dependency vulnerabilities fixed
- tRPC upgraded to v11.1.1+ (fixes WebSocket DoS vulnerability)
- Zero high-severity vulnerabilities
- Regular `npm audit` monitoring

### Validation Security
- ✅ Input validation at schema level
- ✅ Email format validation
- ✅ String length constraints
- ✅ Number bounds checking
- ✅ Date validation
- ✅ Cross-field validation

## Best Practices

### Writing Unit Tests
1. Follow AAA pattern (Arrange, Act, Assert)
2. Test one behavior per test
3. Use descriptive test names
4. Test both valid and invalid inputs
5. Test boundary conditions

### Test Naming Convention
- Describe what the test validates
- Use "should" statements
- Example: "should reject email with invalid format"

## Next Steps

### 🔄 To Be Implemented

1. **Component Tests** - React Testing Library tests for:
   - ProfileCard
   - FeedbackForm
   - PermissionGate
   - AbsenceRequestDialog

2. **tRPC Procedure Tests** - Unit tests for API layer:
   - User router (getById, update, updateSensitive)
   - Feedback router (create, getForUser, delete)
   - Absence router (create, getForUser, updateStatus)

3. **E2E Tests** - Playwright tests for:
   - Authentication flows
   - Profile management workflows
   - Feedback system workflows
   - Absence management workflows

## Current Limitations

- Component tests require mocking tRPC hooks and stores
- tRPC procedure tests require mocking Prisma client and sessions
- E2E tests require running application server
- Integration tests would need test database setup

## Quality Metrics

### ✅ Current Coverage
- **Validation Layer**: 100% (26/26 tests passing)
- **API Layer**: 0% (to be implemented)
- **Component Layer**: 0% (to be implemented)
- **E2E Layer**: 0% (to be implemented)

### 🎯 Target Coverage
- Validation Layer: ✅ 100%
- API Layer: 80%+
- Component Layer: 80%+
- E2E Coverage: Critical user paths

## Troubleshooting

### Common Issues

**Jest errors with ES modules**
- Ensure `jest.config.js` uses `next/jest` preset
- Check `package.json` for correct Jest version

**Test timeouts**
- Increase timeout in test file or Jest config
- Check for unresolved promises

**TypeScript errors in tests**
- Verify `@types/jest` and `@testing-library/jest-dom` are installed
- Check tsconfig.json includes test files

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Zod Testing Patterns](https://zod.dev/)

## Summary

Phase 7 has successfully established the testing foundation:

✅ **Completed:**
- Jest configuration with Next.js
- Playwright setup
- Comprehensive validation schema tests (26 tests passing)
- Test utilities and mock data
- Security vulnerability fixes
- ESLint and Prettier configuration
- Test scripts in package.json

🔄 **In Progress:**
- Component tests
- tRPC procedure tests
- E2E test implementation

The validation layer is fully tested and provides a solid foundation for expanding test coverage to other layers of the application.
