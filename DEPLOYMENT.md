# Deployment Guide

This document provides environment-specific configuration recommendations for deploying the Employee Profile Management System.

## Table of Contents

- [Environment Variables Overview](#environment-variables-overview)
- [Production Configuration](#production-configuration)
- [Staging Configuration](#staging-configuration)
- [Development Configuration](#development-configuration)
- [Configuration Best Practices](#configuration-best-practices)
- [Troubleshooting](#troubleshooting)

## Environment Variables Overview

All environment-specific values can be configured via environment variables without code changes. The application provides sensible defaults for all optional values.

See `.env.example` for a complete list of available environment variables with detailed descriptions.

### Required Variables

These MUST be set in all environments:

- `DATABASE_URL` - Database connection string
- `SESSION_SECRET` - Session encryption key (min 32 characters)
- `HUGGINGFACE_API_KEY` - AI features API key
- `NEXT_PUBLIC_APP_URL` - Public-facing application URL

### Optional Variables

All optional variables have sensible defaults. Override only when needed for your environment.

## Production Configuration

Recommended settings for production deployments:

```bash
# Database
DATABASE_URL="postgresql://user:password@db.example.com:5432/employee_prod?schema=public"

# Session - Maximum security
SESSION_SECRET="<64-char-random-hex-string>"
SESSION_COOKIE_NAME="employee_profile_session"
SESSION_MAX_AGE=604800           # 7 days
SESSION_SECURE=true              # Require HTTPS
SESSION_SAME_SITE="strict"       # Maximum CSRF protection

# React Query - Balanced performance
QUERY_STALE_TIME=300000          # 5 minutes - good balance
QUERY_GC_TIME=600000             # 10 minutes
QUERY_REFETCH_ON_FOCUS=false     # Avoid unnecessary refetches

# Application Limits - Production values
MAX_FILE_SIZE=5242880            # 5MB
REQUEST_TIMEOUT=30000            # 30 seconds
RETRY_COUNT=3                    # Standard retry count

# Feature Flags - All enabled
FEATURE_ANALYTICS=true
FEATURE_NOTIFICATIONS=true

# AI
HUGGINGFACE_API_KEY="<production-api-key>"

# App
NEXT_PUBLIC_APP_URL="https://employees.example.com"
```

### Production Checklist

- [ ] Use a cryptographically secure `SESSION_SECRET` (64+ characters)
- [ ] Enable `SESSION_SECURE=true` to require HTTPS
- [ ] Use `SESSION_SAME_SITE=strict` for maximum security
- [ ] Set `QUERY_STALE_TIME` to at least 5 minutes for performance
- [ ] Configure appropriate `MAX_FILE_SIZE` for your needs
- [ ] Use production database with connection pooling
- [ ] Set up monitoring for failed requests/retries
- [ ] Enable all feature flags after testing

## Staging Configuration

Recommended settings for staging/QA environments:

```bash
# Database
DATABASE_URL="postgresql://user:password@db-staging.example.com:5432/employee_staging?schema=public"

# Session - Differentiated from production
SESSION_SECRET="<different-64-char-random-hex-string>"
SESSION_COOKIE_NAME="staging_session"    # Different name to avoid conflicts
SESSION_MAX_AGE=86400                    # 1 day - shorter for testing
SESSION_SECURE=true                      # Still require HTTPS
SESSION_SAME_SITE="lax"                  # Slightly relaxed for testing

# React Query - Faster updates for testing
QUERY_STALE_TIME=60000                   # 1 minute - more frequent updates
QUERY_GC_TIME=300000                     # 5 minutes
QUERY_REFETCH_ON_FOCUS=true              # Help testers see latest data

# Application Limits - Same as production
MAX_FILE_SIZE=5242880                    # 5MB
REQUEST_TIMEOUT=30000                    # 30 seconds
RETRY_COUNT=3

# Feature Flags - Test new features here first
FEATURE_ANALYTICS=true
FEATURE_NOTIFICATIONS=true               # Or false to test without notifications

# AI
HUGGINGFACE_API_KEY="<staging-api-key>"

# App
NEXT_PUBLIC_APP_URL="https://staging.employees.example.com"
```

### Staging Checklist

- [ ] Use a unique `SESSION_COOKIE_NAME` to avoid conflicts with production
- [ ] Set shorter `SESSION_MAX_AGE` for faster testing iteration
- [ ] Use lower `QUERY_STALE_TIME` to see updates faster
- [ ] Consider enabling `QUERY_REFETCH_ON_FOCUS` for testing convenience
- [ ] Use separate database from production
- [ ] Test feature flags individually
- [ ] Mirror production limits to catch issues early

## Development Configuration

Recommended settings for local development:

```bash
# Database - Local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/employee_dev?schema=public"
# Or SQLite for quick local testing:
# DATABASE_URL="file:./dev.db"

# Session - Local development
SESSION_SECRET="dev-secret-min-32-chars-long-local-only"
SESSION_COOKIE_NAME="dev_session"        # Avoid conflicts with prod/staging
SESSION_MAX_AGE=86400                    # 1 day
SESSION_SECURE=false                     # Allow HTTP for localhost
SESSION_SAME_SITE="lax"                  # More permissive for dev

# React Query - Immediate updates for development
QUERY_STALE_TIME=1000                    # 1 second - always fresh
QUERY_GC_TIME=60000                      # 1 minute
QUERY_REFETCH_ON_FOCUS=true              # See changes immediately

# Application Limits - More lenient for testing
MAX_FILE_SIZE=10485760                   # 10MB - test larger files
REQUEST_TIMEOUT=60000                    # 60 seconds - allow debugging
RETRY_COUNT=1                            # Fewer retries to see errors faster

# Feature Flags - Toggle as needed
FEATURE_ANALYTICS=false                  # Disable to reduce noise
FEATURE_NOTIFICATIONS=true

# AI
HUGGINGFACE_API_KEY="<dev-api-key>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Development Checklist

- [ ] Use `SESSION_SECURE=false` to allow HTTP on localhost
- [ ] Set `QUERY_STALE_TIME=1000` to see changes immediately
- [ ] Enable `QUERY_REFETCH_ON_FOCUS=true` for better dev experience
- [ ] Use local database (PostgreSQL or SQLite)
- [ ] Consider disabling analytics to reduce console noise
- [ ] Use longer timeouts to allow debugging
- [ ] Test with different feature flag combinations

## Configuration Best Practices

### Security

1. **Never commit secrets**: Add `.env` to `.gitignore` (already configured)
2. **Unique secrets per environment**: Use different `SESSION_SECRET` for each environment
3. **Rotate secrets regularly**: Change `SESSION_SECRET` periodically
4. **Use HTTPS in production**: Always set `SESSION_SECURE=true` in production
5. **Minimum secret length**: Ensure `SESSION_SECRET` is at least 32 characters

### Performance

1. **Balance stale time**: Higher `QUERY_STALE_TIME` improves performance but reduces freshness
2. **Adjust per environment**: Use lower values in dev/staging, higher in production
3. **Consider user expectations**: Set appropriate timeout values for your use case
4. **Monitor cache hit rates**: Adjust `QUERY_STALE_TIME` and `QUERY_GC_TIME` based on metrics

### Reliability

1. **Set appropriate timeouts**: Balance user experience with server capacity
2. **Configure retry counts**: More retries = more resilient, but higher load
3. **Monitor failed requests**: Track retry exhaustion to identify systemic issues
4. **Test timeout scenarios**: Ensure graceful degradation when services are slow

### Deployment

1. **Use environment-specific config**: Don't share `.env` files between environments
2. **Document environment differences**: Keep this file updated with your configuration
3. **Validate on deploy**: Check that all required variables are set
4. **Test configuration changes**: Verify behavior after changing timeouts or limits

## Troubleshooting

### Sessions Not Persisting

**Symptoms**: Users logged out after browser close or page refresh

**Possible Causes**:
- `SESSION_SECURE=true` but accessing via HTTP
- `SESSION_SAME_SITE=none` without HTTPS
- `SESSION_MAX_AGE` too short
- Browser blocking cookies

**Solutions**:
1. Check browser console for cookie errors
2. Verify `SESSION_SECURE` matches your protocol (HTTPS/HTTP)
3. For cross-origin requests, use `SESSION_SAME_SITE=none` with `SESSION_SECURE=true`
4. Increase `SESSION_MAX_AGE` if sessions expire too quickly

### Stale Data in UI

**Symptoms**: UI shows old data after database updates

**Possible Causes**:
- `QUERY_STALE_TIME` too high
- `QUERY_REFETCH_ON_FOCUS` disabled
- Client-side cache persisting

**Solutions**:
1. Lower `QUERY_STALE_TIME` for more frequent refetches
2. Enable `QUERY_REFETCH_ON_FOCUS=true` to update on focus
3. Clear browser cache and reload
4. Check React Query DevTools for cache state

### Request Timeouts

**Symptoms**: Operations fail with timeout errors

**Possible Causes**:
- `REQUEST_TIMEOUT` too low
- Slow database queries
- Network latency
- Heavy computation

**Solutions**:
1. Increase `REQUEST_TIMEOUT` for slow operations
2. Optimize database queries
3. Add indexes to frequently queried columns
4. Consider pagination for large datasets
5. Monitor server response times

### File Upload Failures

**Symptoms**: File uploads fail silently or with size errors

**Possible Causes**:
- Files exceed `MAX_FILE_SIZE`
- Server-side file size limits
- Network timeout during upload

**Solutions**:
1. Increase `MAX_FILE_SIZE` as needed
2. Check server/nginx upload limits
3. Increase `REQUEST_TIMEOUT` for large files
4. Implement chunked uploads for very large files
5. Add client-side size validation

### Configuration Not Applied

**Symptoms**: Environment variables not taking effect

**Possible Causes**:
- `.env` file not loaded
- Build-time variables not set (NEXT_PUBLIC_*)
- Typo in variable name
- Server not restarted after changes

**Solutions**:
1. Verify `.env` file exists in project root
2. Rebuild application after changing `NEXT_PUBLIC_*` variables
3. Check variable names match `.env.example` exactly
4. Restart development server or redeploy application
5. Check variable values with `console.log(process.env.VAR_NAME)` (server-side only)

### Cookie Conflicts

**Symptoms**: Login issues when accessing multiple environments

**Possible Causes**:
- Same `SESSION_COOKIE_NAME` across environments
- Cookies persisting across subdomains

**Solutions**:
1. Use unique `SESSION_COOKIE_NAME` per environment:
   - Production: `employee_profile_session`
   - Staging: `staging_session`
   - Development: `dev_session`
2. Clear browser cookies
3. Use different browsers/profiles for each environment

## Environment-Specific Recommendations Summary

| Setting | Production | Staging | Development |
|---------|-----------|---------|-------------|
| `SESSION_COOKIE_NAME` | `employee_profile_session` | `staging_session` | `dev_session` |
| `SESSION_MAX_AGE` | 604800 (7 days) | 86400 (1 day) | 86400 (1 day) |
| `SESSION_SECURE` | `true` | `true` | `false` |
| `SESSION_SAME_SITE` | `strict` | `lax` | `lax` |
| `QUERY_STALE_TIME` | 300000 (5 min) | 60000 (1 min) | 1000 (1 sec) |
| `QUERY_REFETCH_ON_FOCUS` | `false` | `true` | `true` |
| `REQUEST_TIMEOUT` | 30000 (30s) | 30000 (30s) | 60000 (60s) |
| `RETRY_COUNT` | 3 | 3 | 1 |

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [The Twelve-Factor App: Config](https://12factor.net/config)
- [React Query Cache Configuration](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
- [iron-session Configuration](https://github.com/vvo/iron-session#api)

## Support

For issues or questions about configuration:
1. Check this guide first
2. Review `.env.example` for variable descriptions
3. Check the [Troubleshooting](#troubleshooting) section
4. Review `lib/config.ts` for default values and implementation
