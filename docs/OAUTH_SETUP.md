# OAuth Authentication Setup Guide

This guide walks you through setting up OAuth authentication providers (Google and GitHub) for the Employee Profile Management System.

## Overview

The application now supports OAuth authentication with the following providers:
- **Google** - OAuth 2.0 via Google Cloud Platform
- **GitHub** - OAuth 2.0 via GitHub Apps

## Features

- Single Sign-On (SSO) with Google and GitHub accounts
- Automatic email verification for OAuth users
- Smart organization matching based on email domain
- Seamless account linking for existing users
- New user onboarding with organization creation

## OAuth Flow

### For Existing Users
1. User clicks "Continue with Google/GitHub"
2. User authenticates with provider
3. System finds existing account and creates session
4. User is redirected to dashboard

### For New Users (No Matching Organization)
1. User authenticates with provider
2. System detects new user
3. User is redirected to complete registration page
4. User creates organization
5. Account is created and linked to OAuth provider

### For New Users (Matching Organization Domain)
1. User authenticates with provider
2. System detects matching organization domain (e.g., user@company.com matches company.com)
3. User is presented with choice:
   - Join existing organization
   - Create new organization
4. Account is created based on choice

## Setup Instructions

### 1. Database Migration

First, run the Prisma migration to add the OAuth tables:

```bash
npx prisma migrate dev --name add-oauth-support
```

This will create the `OAuthAccount` table in your database.

### 2. Google OAuth Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or People API)

#### Step 2: Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Select **Web application** as application type
4. Configure the OAuth consent screen if prompted
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

#### Step 3: Configure Environment Variables
Add to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. GitHub OAuth Setup

#### Step 1: Create OAuth App
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the application details:
   - **Application name**: Employee Profile Management System
   - **Homepage URL**:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/github/callback`
     - Production: `https://yourdomain.com/api/auth/github/callback`
4. Click **Register application**

#### Step 2: Generate Client Secret
1. On your OAuth app page, click **Generate a new client secret**
2. Copy the **Client ID** and **Client secret** immediately (secret won't be shown again)

#### Step 3: Configure Environment Variables
Add to your `.env` file:

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Note**: GitHub OAuth is simpler than other providers and doesn't require additional permission setup beyond the scopes defined in the application (`read:user` and `user:email`).

### 4. Environment Configuration

Ensure your `.env` file has the correct app URL:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
# or
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # Production
```

## Testing OAuth Flow

### 1. Test Google Login
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Continue with Google"
4. Complete Google authentication
5. Verify you're redirected to dashboard or registration completion

### 2. Test GitHub Login
1. Navigate to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Complete GitHub authentication
4. Verify you're redirected to dashboard or registration completion

### 3. Test Organization Matching
1. Create an organization with domain `example.com`
2. Try to sign up with an OAuth account using `user@example.com`
3. Verify you're presented with option to join the organization

## Security Considerations

### CSRF Protection
- OAuth state parameter is used for CSRF protection
- State is stored in httpOnly cookies and verified on callback

### Token Storage
- OAuth tokens are stored in the database (consider encryption for production)
- Access tokens are refreshed automatically when expired
- Refresh tokens are stored securely

### Session Management
- OAuth authentication creates the same session as password-based auth
- Sessions use iron-session with encrypted cookies
- Session duration follows the same policy as password auth

## Troubleshooting

### "Provider not configured" Error
- Verify environment variables are set correctly
- Check that variable names match exactly (case-sensitive)
- Restart your development server after changing `.env`

### "Redirect URI mismatch" Error
- Ensure the redirect URI in your OAuth provider matches exactly
- Include protocol (http:// or https://)
- Check for trailing slashes
- Verify the port number matches

### "Invalid state" Error
- Clear browser cookies and try again
- Ensure cookies are enabled in browser
- Check that `SESSION_SECRET` is set in `.env`

### User Can't Join Organization
- Verify organization domain is set correctly in database
- Check that email domain matches organization domain
- Ensure organization hasn't been soft-deleted

## Advanced Configuration

### Custom OAuth Scopes
Edit `lib/auth/oauth.ts` to modify requested scopes:

```typescript
google: {
  scopes: ['openid', 'email', 'profile', 'additional_scope'],
}
```

### Token Refresh
Implement token refresh in your API routes:

```typescript
// Check if token is expired
if (oauthAccount.tokenExpiresAt < new Date()) {
  // Refresh token logic here
}
```

### Multi-Factor Authentication
OAuth can work alongside 2FA:
- OAuth provides initial authentication
- 2FA can be enabled as additional security layer
- Users with 2FA will be prompted after OAuth login

## Production Deployment

### Checklist
- [ ] Set production OAuth credentials in environment
- [ ] Update redirect URIs to production URLs
- [ ] Enable secure cookies (`SESSION_SECURE=true`)
- [ ] Consider encrypting OAuth tokens in database
- [ ] Set up token refresh mechanism
- [ ] Configure OAuth consent screen branding
- [ ] Test OAuth flow in production environment
- [ ] Monitor OAuth error rates

### Environment Variables
```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
SESSION_SECURE=true
GOOGLE_CLIENT_ID="prod-client-id"
GOOGLE_CLIENT_SECRET="prod-client-secret"
GITHUB_CLIENT_ID="prod-github-client-id"
GITHUB_CLIENT_SECRET="prod-github-client-secret"
```

## API Endpoints

### Public Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `POST /api/auth/complete-oauth-registration` - Complete new user registration
- `POST /api/auth/join-via-oauth` - Join existing organization
- `GET /api/organizations/[slug]/info` - Get organization info (for join page)

## Database Schema

### OAuthAccount Table
```prisma
model OAuthAccount {
  id                String   @id @default(cuid())
  userId            String
  provider          String   // 'google' | 'github'
  providerAccountId String   // Provider's unique ID
  accessToken       String?
  refreshToken      String?
  tokenExpiresAt    DateTime?
  scope             String?
  idToken           String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([provider])
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OAuth provider documentation
3. Check application logs for detailed error messages
4. Ensure all environment variables are set correctly

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 Security Best Practices](https://oauth.net/2/security-best-practices/)
