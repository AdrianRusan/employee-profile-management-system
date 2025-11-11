# CI/CD Setup Guide

This guide explains how to configure GitHub Secrets for the CI/CD workflows.

## Overview

The CI/CD pipeline uses GitHub Secrets to securely store test credentials. This approach is superior to hardcoded credentials because:

- **Security**: Secrets are encrypted and never exposed in logs or code
- **Flexibility**: Secrets can be rotated without modifying workflow files
- **Best Practice**: Follows GitHub's recommended security practices
- **Auditability**: Secret access is logged by GitHub

## Required Secrets

The following secrets must be configured in your GitHub repository settings:

### 1. `CI_DATABASE_URL`

PostgreSQL connection string for the test database.

**Format**: `postgresql://postgres:postgres@localhost:5432/test_db`

**Notes**:
- The CI workflow automatically provisions a PostgreSQL 15 service container
- Use `localhost:5432` as the host since the database runs on the same runner
- Database name should be `test_db` to match the service configuration

### 2. `CI_SESSION_SECRET`

Secret key used for session encryption in tests.

**Requirements**:
- Must be at least 32 characters long
- Should be a random, cryptographically secure string
- Test-only credential (not used in production)

**Example**: `test-session-secret-min-32-chars-for-ci-testing-only`

**Generate a new one**:
```bash
openssl rand -base64 32
```

### 3. `CI_ENCRYPTION_KEY`

Hex-encoded key used for data encryption in tests.

**Requirements**:
- Must be exactly 64 hexadecimal characters (32 bytes)
- Should be a random, cryptographically secure key
- Test-only credential (not used in production)

**Example**: `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`

**Generate a new one**:
```bash
openssl rand -hex 32
```

## How to Add Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `CI_DATABASE_URL`
   - Value: `postgresql://postgres:postgres@localhost:5432/test_db`
5. Repeat for `CI_SESSION_SECRET` and `CI_ENCRYPTION_KEY`

## Verification

After adding the secrets, verify they work correctly:

1. Push a commit to trigger the CI workflow
2. Check the workflow run in the **Actions** tab
3. Verify all jobs (lint, type-check, test, e2e, build) pass
4. Check that no credentials appear in the logs (they should be masked)

## Troubleshooting

### Workflow fails with "Secret not found"

- Ensure the secret names match exactly (case-sensitive)
- Verify you added the secrets to the correct repository
- Check that you have admin access to the repository

### Tests fail with "Invalid encryption key"

- Verify `CI_ENCRYPTION_KEY` is exactly 64 hex characters
- Regenerate the key using `openssl rand -hex 32`

### Tests fail with "Session secret too short"

- Verify `CI_SESSION_SECRET` is at least 32 characters
- Regenerate using `openssl rand -base64 32`

### Database connection errors

- Verify `CI_DATABASE_URL` format is correct
- Check that the database name matches `test_db` in the workflow

## Local vs CI Credentials

**Important**: CI credentials do NOT need to match your local `.env` file.

- **Local `.env`**: Used for development on your machine
- **GitHub Secrets**: Used only in CI/CD workflows
- Both must meet the same format requirements but can have different values

This separation allows:
- Different database configurations (local vs CI)
- Rotating CI credentials without affecting local development
- Team members to use different local credentials

## Security Best Practices

1. **Never commit credentials**: Keep `.env` in `.gitignore`
2. **Use strong secrets**: Generate cryptographically random values
3. **Rotate regularly**: Update secrets periodically (every 90 days)
4. **Limit access**: Only admins should have access to secrets
5. **Audit logs**: Review secret access logs in GitHub settings
6. **Test-only**: Never use production credentials in CI

## Workflow Files Using Secrets

The following workflows use these secrets:

- `.github/workflows/ci.yml` - Main CI pipeline (lint, test, e2e, build)
- `.github/workflows/nightly-e2e.yml` - Nightly full E2E test suite

Both workflows use the same three secrets in their environment variables.
