# CI/CD Setup Guide

This document provides instructions for setting up and configuring the CI/CD pipeline for the Employee Profile Management System.

## Overview

The project uses GitHub Actions for:
- Automated testing on every push and pull request
- Code quality checks (linting, type checking)
- Automated deployment to production

## Prerequisites

- GitHub repository with admin access
- Deployment platform account (Vercel recommended)
- Repository secrets configured

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` or `master`.

**Jobs:**
- **lint**: ESLint code quality checks
- **type-check**: TypeScript compilation validation
- **test**: Unit and E2E tests with PostgreSQL
- **build**: Next.js production build

**Duration:** ~3-5 minutes

### 2. Deployment Workflow (`.github/workflows/deploy.yml`)

Runs after successful CI on pushes to `main` or `master`.

**Jobs:**
- **wait-for-ci**: Ensures all CI checks pass first
- **deploy-vercel**: Deploys to Vercel (production)

**Duration:** ~2-3 minutes

## Initial Setup

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to "Settings" > "Actions" > "General"
3. Under "Actions permissions", select "Allow all actions and reusable workflows"
4. Click "Save"

### Step 2: Configure Secrets

For Vercel deployment, add these secrets:

1. Go to "Settings" > "Secrets and variables" > "Actions"
2. Click "New repository secret"
3. Add the following secrets:

#### Required Secrets:

**VERCEL_TOKEN**
- Get from: https://vercel.com/account/tokens
- Click "Create Token"
- Name it "GitHub Actions"
- Copy and paste the token

**VERCEL_ORG_ID**
- Run: `npx vercel link` in your project
- Open `.vercel/project.json`
- Copy the `orgId` value

**VERCEL_PROJECT_ID**
- From the same `.vercel/project.json` file
- Copy the `projectId` value

### Step 3: Set Up Branch Protection

Protect the `main` branch to enforce CI checks:

1. Go to "Settings" > "Branches"
2. Click "Add branch protection rule"
3. Branch name pattern: `main` (or `master`)
4. Enable the following:
   - ✅ Require a pull request before merging
     - Required approvals: 1
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Search and select these status checks:
       - `lint`
       - `type-check`
       - `test`
       - `build`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
5. Click "Create"

### Step 4: Test the Pipeline

Create a test pull request:

```bash
# Create a feature branch
git checkout -b test/ci-setup

# Make a small change
echo "# CI/CD Test" >> CI_TEST.md

# Commit and push
git add CI_TEST.md
git commit -m "test: verify CI/CD pipeline"
git push origin test/ci-setup
```

Then:
1. Go to GitHub and create a pull request
2. Watch the CI checks run automatically
3. Verify all 4 jobs pass (lint, type-check, test, build)
4. Once passing, merge the PR
5. Verify deployment workflow runs on `main`

## Environment Variables

The CI pipeline uses these environment variables:

### CI Workflow (`ci.yml`)

```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
SESSION_SECRET: test-session-secret-min-32-chars-for-ci-testing-only
ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
NEXT_PUBLIC_APP_URL: http://localhost:3000
```

These are hardcoded in the workflow file for testing purposes.

### Deployment Workflow (`deploy.yml`)

Deployment environment variables should be configured in your deployment platform (Vercel):

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add:
   - `DATABASE_URL` - Your production database URL
   - `SESSION_SECRET` - Generate: `openssl rand -hex 32`
   - `ENCRYPTION_KEY` - Generate: `openssl rand -hex 32`
   - `HUGGINGFACE_API_KEY` - Your HuggingFace API key
   - `NEXT_PUBLIC_APP_URL` - Your production URL

## Monitoring CI/CD

### View Workflow Runs

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. See all workflow runs and their status
4. Click any run to view detailed logs

### Status Badges

Add these badges to your README.md (replace `USERNAME` and `REPO`):

```markdown
[![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/ci.yml)
[![Deploy](https://github.com/USERNAME/REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/deploy.yml)
```

### Email Notifications

GitHub sends email notifications for:
- Failed workflow runs on your branches
- Status of checks on your pull requests

Configure notification preferences:
1. GitHub Settings > Notifications
2. Under "Actions", choose your notification preferences

## Troubleshooting

### CI Checks Failing

**Lint Failures:**
```bash
npm run lint:fix  # Auto-fix issues
npm run lint      # Check remaining issues
```

**Type Check Failures:**
```bash
npx prisma generate  # Regenerate Prisma Client
npm run type-check   # Check types
```

**Test Failures:**
```bash
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
```

**Build Failures:**
```bash
npm run build       # Test build locally
```

### Deployment Failures

**Vercel Token Issues:**
- Ensure `VERCEL_TOKEN` is valid and not expired
- Regenerate token if needed

**Missing Secrets:**
- Verify all required secrets are set in GitHub
- Check secret names match exactly (case-sensitive)

**Environment Variables:**
- Ensure all required environment variables are set in Vercel
- Check for typos in variable names

### Slow CI Runs

The CI pipeline is optimized, but you can improve speed:

1. **Enable Dependency Caching**: Already enabled in workflows
2. **Parallel Jobs**: Jobs run in parallel by default
3. **Playwright Cache**: Browsers are cached automatically

### Skipping CI

If you need to skip CI for documentation-only changes:

```bash
git commit -m "docs: update README [skip ci]"
```

Note: This skips CI but is not recommended for code changes.

## Alternative Deployment Platforms

### Railway

Uncomment the `deploy-railway` job in `.github/workflows/deploy.yml`:

1. Install Railway CLI: `npm install -g @railway/cli`
2. Get token: `railway login` then `railway whoami --token`
3. Add `RAILWAY_TOKEN` secret to GitHub

### Netlify

Uncomment the `deploy-netlify` job in `.github/workflows/deploy.yml`:

1. Get Netlify auth token from: https://app.netlify.com/user/applications
2. Get site ID from your Netlify site settings
3. Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets to GitHub

## Best Practices

1. **Never Skip CI**: Always let CI run on code changes
2. **Run Locally First**: Use `npm run validate` before pushing
3. **Keep Secrets Secret**: Never commit secrets to git
4. **Review Logs**: Check CI logs when builds fail
5. **Update Dependencies**: Keep GitHub Actions versions updated
6. **Monitor Costs**: Check GitHub Actions usage in billing (free for public repos)

## Security Considerations

1. **Secrets Management**:
   - Use GitHub Secrets for sensitive data
   - Never log secrets in workflow outputs
   - Rotate tokens periodically

2. **Branch Protection**:
   - Enforce required status checks
   - Require pull request reviews
   - Prevent force pushes to main

3. **Dependency Security**:
   - Enable Dependabot alerts
   - Review and update dependencies regularly
   - Use `npm audit` to check for vulnerabilities

## Maintenance

### Updating Workflows

1. Edit workflow files in `.github/workflows/`
2. Test changes in a feature branch
3. Create PR to review workflow changes
4. Merge after verification

### Updating Node.js Version

Update `node-version` in all workflow files:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change this version
```

### Updating Actions Versions

Regularly update GitHub Actions to latest versions:

```yaml
- uses: actions/checkout@v4        # Keep updated
- uses: actions/setup-node@v4      # Keep updated
- uses: actions/upload-artifact@v4 # Keep updated
```

## Support

For issues with:
- **GitHub Actions**: https://github.community/
- **Vercel Deployment**: https://vercel.com/support
- **Project-Specific**: Open an issue in this repository

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Next.js CI/CD Guide](https://nextjs.org/docs/deployment)
- [Prisma in CI/CD](https://www.prisma.io/docs/guides/deployment/deployment-guides)
