# CSRF Protection Implementation

## Overview

This document describes the Cross-Site Request Forgery (CSRF) protection implementation in the Employee Profile Management System. CSRF protection is a critical security measure that prevents malicious websites from performing unauthorized actions on behalf of authenticated users.

## Implementation Details

### Architecture

The CSRF protection follows the **Double Submit Cookie** pattern with token-based validation:

1. **Token Generation**: Server generates a secret and corresponding CSRF token
2. **Token Storage**:
   - Secret stored in httpOnly cookie (server-only access)
   - Token stored in readable cookie (client can read)
3. **Token Transmission**: Client includes token in `x-csrf-token` header for mutations
4. **Token Validation**: Server validates token against secret for all state-changing operations

### Components

#### Server-Side Components

##### 1. CSRF Utility (`lib/csrf.ts`)

Core CSRF token generation and validation logic:

```typescript
// Generate new CSRF token pair
await generateCsrfToken(): Promise<string>

// Validate CSRF token against stored secret
await validateCsrfToken(token: string): Promise<boolean>

// Validate CSRF token from request
await validateCsrfFromRequest(request: Request): Promise<boolean>

// Get current CSRF token
await getCsrfToken(): Promise<string | null>
```

##### 2. CSRF API Endpoint (`app/api/csrf/route.ts`)

Provides endpoint for clients to fetch CSRF tokens:

```
GET /api/csrf
Response: { csrfToken: string }
```

##### 3. tRPC Middleware (`server/trpc.ts`)

Integrated into `protectedProcedure` middleware:

- Validates CSRF tokens for all mutations (POST/PUT/DELETE operations)
- Allows queries (GET operations) without CSRF validation
- Returns 403 Forbidden for invalid/missing CSRF tokens

#### Client-Side Components

##### 1. CSRF Client Utilities (`lib/csrf-client.ts`)

Client-side token management:

```typescript
// Get token from cookie
getCsrfTokenFromCookie(): string | null

// Fetch fresh token from server
fetchCsrfToken(): Promise<string | null>

// Ensure token is available
ensureCsrfToken(): Promise<string | null>
```

##### 2. tRPC Provider (`lib/trpc/Provider.tsx`)

Automatically includes CSRF token in all tRPC requests:

- Fetches CSRF token on application mount
- Includes token in `x-csrf-token` header for all requests
- Handles token refresh automatically

### Cookie Configuration

#### CSRF Token Cookie (`__Host-csrf-token`)

```javascript
{
  httpOnly: false,      // Client needs to read this
  secure: true,         // HTTPS only in production
  sameSite: 'strict',   // Strict same-site policy
  path: '/',
  maxAge: 604800        // 1 week
}
```

#### CSRF Secret Cookie (`__Host-csrf-secret`)

```javascript
{
  httpOnly: true,       // Server-only access
  secure: true,         // HTTPS only in production
  sameSite: 'strict',   // Strict same-site policy
  path: '/',
  maxAge: 604800        // 1 week
}
```

#### Session Cookie (`employee_profile_session`)

```javascript
{
  httpOnly: true,
  secure: true,         // HTTPS only in production
  sameSite: 'strict',   // Upgraded from 'lax'
  maxAge: 604800        // 1 week
}
```

## Security Considerations

### Attack Prevention

The implementation protects against:

1. **Cross-Site Request Forgery**: Malicious sites cannot forge valid CSRF tokens
2. **Session Riding**: Tokens are bound to the user's session
3. **Replay Attacks**: Tokens are validated against secure server-side secrets
4. **Cookie Theft**: Secrets stored in httpOnly cookies prevent JavaScript access

### Defense in Depth

Multiple security layers:

1. **CSRF Tokens**: Primary defense against CSRF attacks
2. **SameSite=Strict**: Prevents cookies from being sent in cross-site requests
3. **Secure Flag**: Ensures cookies only sent over HTTPS in production
4. **HttpOnly Flag**: Prevents JavaScript access to sensitive cookies

### Protected Operations

All state-changing operations require CSRF validation:

- Creating/updating/deleting feedback
- Approving/rejecting absence requests
- Updating user profiles
- Uploading files
- AI polishing requests
- Any tRPC mutation

### Unprotected Operations

Read-only operations (queries) work without CSRF tokens:

- Fetching user lists
- Reading feedback
- Viewing profiles
- Dashboard data retrieval

## Usage

### For API Consumers

When making authenticated requests to mutation endpoints:

1. Ensure CSRF token is available in cookies
2. Include token in `x-csrf-token` header
3. Handle 403 errors by refreshing token

Example:

```typescript
const token = getCsrfTokenFromCookie();

await fetch('/api/trpc/feedback.create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': token,
  },
  body: JSON.stringify({ ... }),
});
```

### For Component Developers

When using tRPC hooks, CSRF is handled automatically:

```typescript
// No manual CSRF handling needed
const createFeedback = trpc.feedback.create.useMutation();

await createFeedback.mutateAsync({
  receiverId: 'user-id',
  content: 'Great work!',
});
```

## Testing

### E2E Tests (`tests/e2e/csrf-protection.spec.ts`)

Comprehensive E2E tests covering:

- Token generation and cookie setting
- Token inclusion in mutation requests
- Mutation rejection without valid token
- Mutation success with valid token
- Query operations without token
- Token refresh on new session
- Session cookie security validation
- CSRF attack scenario simulation

### Unit Tests (`lib/csrf.test.ts`)

Unit tests for CSRF utilities (placeholder structure provided).

### Running Tests

```bash
# Run E2E tests
npm run test:e2e tests/e2e/csrf-protection.spec.ts

# Run unit tests
npm test lib/csrf.test.ts
```

## Troubleshooting

### Common Issues

#### Issue: "Invalid or missing CSRF token"

**Cause**: Client doesn't have CSRF token or token expired

**Solution**:
- Refresh the page to get a new token
- Check that `/api/csrf` endpoint is accessible
- Verify cookies are not being blocked

#### Issue: Mutations fail in development

**Cause**: Cookie settings may not work on HTTP

**Solution**:
- Use HTTPS in development, or
- Adjust cookie settings for local development

#### Issue: CSRF validation fails after session timeout

**Cause**: CSRF token outlives session

**Solution**:
- Token and session lifetimes are aligned (1 week)
- User needs to re-authenticate

## Monitoring

### Key Metrics

Monitor these indicators:

1. **403 Forbidden errors on mutations**: High rate may indicate token issues
2. **CSRF token fetch failures**: Issues with `/api/csrf` endpoint
3. **Session timeout correlation**: CSRF failures after session expiration

### Logging

CSRF validation failures are logged for security monitoring:

```typescript
console.error('CSRF validation failed:', {
  userId: ctx.session.userId,
  endpoint: ctx.req.url,
  timestamp: new Date().toISOString()
});
```

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP A01:2021 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Changelog

### 2025-11-07 - Initial Implementation

- Implemented CSRF protection using csrf package
- Added server-side token generation and validation
- Integrated CSRF validation in tRPC middleware
- Updated client to include tokens in request headers
- Upgraded session cookie sameSite from 'lax' to 'strict'
- Created comprehensive E2E tests
- Added documentation

**Author**: Claude Code Review Resolution
**Issue**: TODO-004 (P1 Critical Security Issue)
