# CI Credentials Configuration

## Overview

The CI/CD workflows use **hardcoded test credentials** directly in the workflow files. This is the correct and standard approach for CI environments.

## Why Hardcoded Credentials for CI?

For CI environments with ephemeral PostgreSQL service containers, hardcoded credentials are appropriate because:

1. **Ephemeral Environment**: The PostgreSQL container is created and destroyed for each test run
2. **No External Access**: The database only exists on the GitHub Actions runner and is never exposed to the internet
3. **Consistency**: Credentials must match the PostgreSQL service container configuration in the workflow
4. **Simplicity**: No secret configuration required; works out of the box for contributors
5. **Standard Practice**: This is the documented approach in GitHub Actions and Prisma CI examples

## Current CI Credentials

All CI workflows (`.github/workflows/ci.yml` and `.github/workflows/nightly-e2e.yml`) use:

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
  SESSION_SECRET: test-session-secret-min-32-chars-for-ci-testing-only
  ENCRYPTION_KEY: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
  NEXT_PUBLIC_APP_URL: http://localhost:3000
```

These credentials:
- Match the PostgreSQL service container configuration (`POSTGRES_USER: postgres`, `POSTGRES_PASSWORD: postgres`)
- Are test-only values that are never used in production
- Are publicly visible in the workflow files (which is safe for ephemeral test databases)

## GitHub Secrets vs Hardcoded Credentials

| Use Case | Recommended Approach |
|----------|---------------------|
| **CI test databases** (ephemeral containers) | ✅ Hardcoded credentials in workflow files |
| **Production deployments** (Vercel, etc.) | ✅ GitHub Secrets or platform environment variables |
| **Staging environments** | ✅ GitHub Secrets or platform environment variables |
| **Local development** | ✅ `.env` file (never commit to git) |

## Production Environment Variables

For production deployments (Vercel, AWS, etc.), **DO** use environment variables or secrets:

- `DATABASE_URL` - Production PostgreSQL connection string
- `SESSION_SECRET` - Cryptographically secure random string (32+ chars)
- `ENCRYPTION_KEY` - Cryptographically secure random hex string (64 chars)
- `NEXT_PUBLIC_APP_URL` - Production URL

### Generating Secure Production Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

## Local Development

For local development, create a `.env` file (already in `.gitignore`):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
SESSION_SECRET="your-local-session-secret-min-32-characters-long"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

You can use the same test values as CI, or generate your own secure values.

## Security Note

**Never commit production credentials or real secrets to git**. The hardcoded credentials in CI workflows are safe because they only apply to ephemeral test databases that are destroyed after each run and never contain real data.
