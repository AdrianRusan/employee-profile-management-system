# Contributing Guidelines

Thank you for your interest in contributing to the Employee Profile Management System! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences
- Accept responsibility for mistakes

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js 20.x or later
- PostgreSQL 15.x or later
- Git
- A code editor (VS Code recommended)

### Initial Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/employee-profile-management-system.git
   cd employee-profile-management-system
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/employee-profile-management-system.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Set Up Database**
   ```bash
   # Create database
   createdb employee_db

   # Run migrations
   npx prisma migrate dev

   # Seed data (optional)
   npx prisma db seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

We use a feature branch workflow:

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `refactor/*` - Code refactoring
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Make your changes** in small, logical commits
2. **Test your changes** thoroughly
3. **Update documentation** if needed
4. **Run linting and type checking**
   ```bash
   npm run lint
   npx tsc --noEmit
   ```

### Syncing with Upstream

Keep your fork up to date:

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your branch
git merge upstream/main
```

## Coding Standards

### TypeScript

- **100% TypeScript coverage** - No `any` types
- Use **strict mode** (`tsconfig.json`)
- Prefer **interfaces** for object shapes
- Use **type inference** where possible
- Document complex types with comments

#### Example

```typescript
// Good
interface UserProfile {
  id: string
  name: string
  role: Role
}

function getUserProfile(userId: string): Promise<UserProfile> {
  // Implementation
}

// Avoid
function getUserProfile(userId: any): any {
  // Implementation
}
```

### React Components

- Use **functional components** with hooks
- Prefer **Server Components** by default
- Use Client Components only when needed (`'use client'`)
- **Extract reusable logic** into custom hooks
- Keep components **focused and small** (< 200 lines)

#### Component Structure

```typescript
// ProfileCard.tsx
import { type User } from '@prisma/client'

interface ProfileCardProps {
  user: User
  showSensitive: boolean
}

export function ProfileCard({ user, showSensitive }: ProfileCardProps) {
  // Component logic
  return (
    // JSX
  )
}
```

### File Naming

- **Components**: PascalCase (`ProfileCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: PascalCase (`UserTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Code Organization

- **One component per file**
- **Collocate related files** (tests, styles)
- **Export at bottom** of file
- **Import order**:
  1. External dependencies
  2. Internal modules
  3. Types
  4. Styles

#### Example

```typescript
// External
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Internal
import { Button } from '@/components/ui/button'
import { api } from '@/lib/trpc/client'

// Types
import type { User } from '@prisma/client'

// Component
export function MyComponent() {
  // ...
}
```

### Styling

- Use **Tailwind CSS** utility classes
- Follow **shadcn/ui** patterns
- Maintain **consistent spacing** (Tailwind scale)
- Ensure **responsive design** (mobile-first)
- Support **dark mode** (when applicable)

### tRPC Procedures

- **Query** for read operations
- **Mutation** for write operations
- Always use **Zod validation**
- Implement **proper error handling**
- Add **JSDoc comments**

#### Example

```typescript
export const userRouter = router({
  /**
   * Fetch a user by ID with role-based field filtering
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id }
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        })
      }

      // Role-based filtering
      return filterUserFields(user, ctx.session.user.role)
    })
})
```

## Commit Messages

We follow the **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add role-based access control

Implement RBAC middleware for tRPC procedures. Users are now
filtered by role with appropriate permission checks.

Closes #123

# Bug fix
fix(feedback): resolve AI polishing error handling

Add graceful fallback when HuggingFace API is unavailable.
Display error toast to user instead of crashing.

# Documentation
docs(readme): update setup instructions

Add troubleshooting section for database connection issues.

# Refactor
refactor(user): extract permission logic to utility

Move permission checks from router to lib/permissions.ts
for better reusability.
```

### Commit Message Guidelines

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- Limit **subject line to 72 characters**
- Add **body for context** (why, not what)
- Reference **issues/PRs** in footer

## Continuous Integration / Continuous Deployment (CI/CD)

### Overview

This project uses GitHub Actions for automated testing, quality checks, and deployment. Every push and pull request triggers our CI pipeline to ensure code quality and prevent breaking changes.

### CI Pipeline

Our CI workflow (`.github/workflows/ci.yml`) runs automatically on:
- Every push to `main` or `master` branch
- Every pull request targeting `main` or `master`

The pipeline consists of four parallel jobs:

#### 1. Lint Job
- Runs ESLint to check code style and quality
- Ensures consistent code formatting
- Command: `npm run lint`

#### 2. Type Check Job
- Verifies TypeScript type safety
- Catches type errors before runtime
- Generates Prisma Client for type safety
- Command: `npm run type-check`

#### 3. Test Job
- Sets up PostgreSQL test database
- Runs all unit tests with Jest
- Runs E2E tests with Playwright
- Uploads test reports as artifacts
- Commands: `npm test` and `npm run test:e2e`

**Environment:**
- PostgreSQL 15 service container
- Test database seeded with sample data
- Playwright browsers installed

#### 4. Build Job
- Builds the Next.js application
- Ensures production build succeeds
- Uploads build artifacts
- Command: `npm run build`

### Deployment Pipeline

Our deployment workflow (`.github/workflows/deploy.yml`) runs automatically:
- When code is pushed to `main` or `master`
- Only after all CI checks pass successfully
- Can be triggered manually via GitHub Actions UI

**Deployment Platforms:**
- Primary: Vercel (configured)
- Alternatives: Railway, Netlify (commented templates available)

**Required Secrets:**
Configure these in GitHub Settings > Secrets and variables > Actions:
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### Branch Protection

The `main` branch is protected with the following rules:
- Requires pull request before merging
- Requires at least 1 approval
- Requires all CI status checks to pass:
  - lint
  - type-check
  - test
  - build
- Requires branches to be up to date before merging
- Requires conversation resolution before merging

**This means:**
- You cannot push directly to `main`
- All changes must go through pull requests
- CI must pass before merging
- Code review is required

### Local CI Testing

Before pushing, you can run CI checks locally:

```bash
# Run all checks at once
npm run validate

# Or run individually
npm run lint          # Lint check
npm run type-check    # TypeScript check
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run build         # Build check
```

### CI Status Badges

Check the README.md for real-time CI status:
- CI badge shows the status of the latest CI run
- Deploy badge shows deployment status
- Click badges to view detailed logs

### Troubleshooting CI Failures

#### Lint Failures
```bash
# Fix auto-fixable issues
npm run lint:fix

# Check what would be fixed
npm run lint
```

#### Type Check Failures
```bash
# Run type check locally
npm run type-check

# Generate Prisma Client if needed
npx prisma generate
```

#### Test Failures
```bash
# Run tests locally
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run E2E tests in UI mode
npm run test:e2e:ui
```

#### Build Failures
```bash
# Run build locally
npm run build

# Check for environment variable issues
# Make sure .env has all required variables
```

### CI Performance

Our CI pipeline is optimized for speed:
- Jobs run in parallel (not sequential)
- Uses npm cache to speed up installations
- Playwright browsers cached between runs
- Typical CI run: 3-5 minutes

### Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with `main`
- [ ] Local CI checks pass (`npm run validate`)

### Creating a Pull Request

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on GitHub with this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #issue_number
```

### Review Process

1. **Automated checks** must pass (CI/CD)
   - Wait for all 4 CI jobs to complete (lint, type-check, test, build)
   - Check the "Checks" tab on your PR to view detailed logs
   - Fix any failures and push new commits to re-trigger CI
   - All checks must show green checkmarks before merge
2. **At least one approval** required
3. **Address review comments** promptly
4. **Resolve conflicts** with main branch
5. **Squash commits** if requested

### Viewing CI Results

On your pull request:
1. Scroll to the bottom to see CI status checks
2. Click "Details" next to any check to view logs
3. Green checkmark = passed
4. Red X = failed (click to see why)
5. Yellow circle = running

**Common CI Check Statuses:**
- "All checks have passed" - Ready for review/merge
- "Some checks were not successful" - Fix failures before merging
- "Checks are running" - Wait for completion

### After Approval

- Maintainer will **merge your PR**
- Your feature branch will be **deleted**
- Changes will be deployed to staging/production

## Testing Requirements

### Unit Tests

Write unit tests for:
- **Utility functions**
- **Zod schemas**
- **Permission checks**
- **Business logic**

```bash
npm test
```

### Integration Tests

Test tRPC procedures:
- **Input validation**
- **Authorization checks**
- **Database operations**
- **Error handling**

### Component Tests

Test React components:
- **Rendering**
- **User interactions**
- **Conditional logic**
- **Props handling**

### E2E Tests

Test critical user flows:
- **Authentication**
- **Profile management**
- **Feedback submission**
- **Absence requests**

## Documentation

### Code Documentation

- **JSDoc comments** for functions
- **Inline comments** for complex logic
- **Type annotations** for clarity
- **README updates** for features

### Documentation Structure

```typescript
/**
 * Fetches a user profile with role-based field filtering
 *
 * @param userId - The user's unique identifier
 * @param viewerRole - The role of the user viewing the profile
 * @returns Filtered user profile based on viewer permissions
 * @throws {TRPCError} NOT_FOUND if user doesn't exist
 * @throws {TRPCError} UNAUTHORIZED if viewer lacks permissions
 *
 * @example
 * const profile = await getUserProfile('user_123', 'MANAGER')
 */
```

### API Documentation

Update `API.md` when:
- Adding new tRPC procedures
- Changing input/output schemas
- Modifying authentication requirements

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label
4. Join our community discussions

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Thanked in the community

Thank you for contributing! 🎉
