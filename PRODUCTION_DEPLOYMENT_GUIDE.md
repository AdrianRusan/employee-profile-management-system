# Production Deployment Guide

**Complete step-by-step guide for deploying Employee Profile Management System to production.**

## Quick Reference

- **Time Estimate**: 3-4 hours for first deployment
- **Cost**: $0-60/month (depending on service tiers)
- **Difficulty**: Intermediate
- **Prerequisites**: GitHub account, basic command line knowledge

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
3. [Phase 2: Environment Configuration](#phase-2-environment-configuration)
4. [Phase 3: Database Setup](#phase-3-database-setup)
5. [Phase 4: Deployment](#phase-4-deployment)
6. [Phase 5: Post-Deployment](#phase-5-post-deployment)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before starting deployment, ensure you have:

- [ ] GitHub repository access with admin permissions
- [ ] Credit card for service sign-ups (even for free tiers)
- [ ] Node.js 20+ installed locally
- [ ] Git configured with SSH keys
- [ ] 3-4 hours of uninterrupted time
- [ ] Access to create accounts on: Vercel, Sentry, Database provider

### Local Verification

Run these commands to verify everything works locally:

```bash
# Install dependencies
npm ci

# Run all validations
npm run validate

# This runs: type-check, lint, and tests
```

**Expected Result**: All checks should pass with 0 errors.

---

## Phase 1: Infrastructure Setup

### Step 1.1: Database Provisioning (15 min)

#### Option A: Vercel Postgres (Recommended)

**Why**: Seamless Vercel integration, automatic backups, simple pricing.

1. Go to https://vercel.com/dashboard
2. Click **Storage** tab → **Create Database**
3. Select **Postgres** (Powered by Neon)
4. **Configuration**:
   - Name: `employee-db-prod`
   - Region: Choose closest to your users
   - Plan: Start with Free (0.5 GB)
5. Wait ~30 seconds for provisioning
6. **Copy Connection String**:
   - Go to **.env.local** tab
   - Copy `POSTGRES_URL` value
   - Save as `DATABASE_URL` for later

**Pricing**: Free tier: 512MB storage, 0.25 compute units

#### Option B: Supabase

**Why**: More features (Auth, Storage, Realtime), generous free tier.

1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. **Configuration**:
   - Name: `employee-management-prod`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
4. Wait ~2 minutes for provisioning
5. **Get Connection String**:
   - Go to **Project Settings** → **Database**
   - Scroll to **Connection Pooling**
   - Copy **Connection string** (pooler mode)
   - Format: `postgres://[user]:[password]@[host]:6543/postgres`
6. Save as `DATABASE_URL` for later

**Pricing**: Free tier: 500MB database, 2 concurrent connections

### Step 1.2: Generate Security Secrets (5 min)

**Critical**: These secrets are the foundation of your application security.

```bash
# Open terminal and run:

# 1. Generate SESSION_SECRET
openssl rand -hex 32
# Output: Copy this 64-character hex string

# 2. Generate ENCRYPTION_KEY
openssl rand -hex 32
# Output: Copy this 64-character hex string
```

**Save These Securely**:
- Store in password manager
- Never commit to git
- Keep separate from your database password

### Step 1.3: Sentry Error Tracking (15 min)

**Why**: Essential for catching production errors before users report them.

1. Go to https://sentry.io
2. **Sign Up / Login**
3. **Create Organization** (if new):
   - Organization Name: Your company/team name
   - Note the **organization slug** (URL-friendly name)
4. **Create Project**:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue**
   - Project name: `employee-profile-management`
5. **Get DSN**:
   - You'll see it immediately after creation
   - Or: **Settings** → **Client Keys (DSN)**
   - Format: `https://[key]@[org].ingest.sentry.io/[project]`
   - Copy this DSN
6. **Create Auth Token**:
   - Go to **User Settings** (avatar) → **Auth Tokens**
   - Click **Create New Token**
   - Name: "Vercel Deployment"
   - Scopes: Select `project:releases` and `org:read`
   - Click **Create Token**
   - **Copy immediately** (won't be shown again)
7. **Configure Alerts** (optional but recommended):
   - Go to **Alerts** → **Create Alert**
   - Template: "Issues" → "Create"
   - Name: "High Error Rate"
   - When: `Number of events` > `10` in `5 minutes`
   - Then: Send notification to your email

**Pricing**: Free tier: 5,000 errors/month (sufficient for MVP)

### Step 1.4: Vercel Project Setup (20 min)

1. Go to https://vercel.com/dashboard
2. **Import Project**:
   - Click **Add New** → **Project**
   - Select **Import Git Repository**
   - Connect GitHub if not already connected
   - Select your repository
3. **Configure Build Settings**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm ci` (default)
4. **IMPORTANT**: Click **Configure Project** but **DO NOT DEPLOY YET**
   - We need to add environment variables first
5. **Get Project IDs**:
   - After project creation, go to **Settings**
   - **General** section → Copy **Project ID**
   - Go to team/account settings → Copy **Team ID** or **Org ID**
6. **Create API Token**:
   - Go to **Account Settings** → **Tokens**
   - Click **Create Token**
   - Name: "GitHub Actions"
   - Scope: **Full Account**
   - Expiration: No expiration (or set custom)
   - Click **Create**
   - **Copy token immediately**

**Pricing**: Free tier: 100GB bandwidth, serverless functions

---

## Phase 2: Environment Configuration

### Step 2.1: Configure Vercel Environment Variables (20 min)

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. For each variable below, click **Add Variable**:
   - Enter **Key** and **Value**
   - Select **Production** environment
   - Click **Save**

#### Critical Variables

```bash
DATABASE_URL
Value: <from Step 1.1 - your database connection string>

SESSION_SECRET
Value: <from Step 1.2 - first openssl output>

ENCRYPTION_KEY
Value: <from Step 1.2 - second openssl output>

NEXT_PUBLIC_APP_URL
Value: https://<your-project-name>.vercel.app
# Replace with your actual Vercel project URL

NODE_ENV
Value: production
```

#### Sentry Variables

```bash
SENTRY_DSN
Value: <from Step 1.3 - your Sentry DSN>

NEXT_PUBLIC_SENTRY_DSN
Value: <same as SENTRY_DSN above>

SENTRY_AUTH_TOKEN
Value: <from Step 1.3 - your Sentry auth token>

SENTRY_ORG
Value: <your Sentry organization slug>

SENTRY_PROJECT
Value: employee-profile-management
```

#### Optional Variables

```bash
# AI Features (get from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY
Value: <your-huggingface-api-key>

# Session Configuration
SESSION_COOKIE_NAME
Value: employee_profile_session_prod

SESSION_MAX_AGE
Value: 604800

SESSION_SECURE
Value: true

SESSION_SAME_SITE
Value: strict

# Logging
LOG_LEVEL
Value: info
```

**Verification**: You should have at least 7 critical variables configured.

### Step 2.2: Configure GitHub Secrets (10 min)

These secrets allow GitHub Actions to deploy to Vercel.

1. Go to your GitHub repository
2. Click **Settings** (repo settings, not your account)
3. Go to **Secrets and variables** → **Actions**
4. Click **New repository secret** for each:

```bash
Name: VERCEL_TOKEN
Secret: <from Step 1.4 - your Vercel API token>

Name: VERCEL_ORG_ID
Secret: <from Step 1.4 - your Vercel Team/Org ID>

Name: VERCEL_PROJECT_ID
Secret: <from Step 1.4 - your Vercel Project ID>
```

**Verification**: You should have exactly 3 secrets configured.

---

## Phase 3: Database Setup

### Step 3.1: Run Migrations (10 min)

**Important**: This step applies the database schema to your production database.

On your local machine:

```bash
# 1. Temporarily set your production DATABASE_URL
export DATABASE_URL="<your-production-database-url-from-step-1>"

# For Windows PowerShell:
# $env:DATABASE_URL="<your-production-database-url-from-step-1>"

# 2. Deploy migrations
npx prisma migrate deploy

# Expected output:
# 3 migrations found in prisma/migrations
# Applying migration `20251030120702_init`
# Applying migration `20250107000000_add_soft_delete_cascade`
# Applying migration `20250111000000_add_composite_indexes`
# All migrations have been successfully applied.

# 3. Verify migration status
npx prisma migrate status

# Expected output:
# Database schema is up to date!

# 4. Generate Prisma Client
npx prisma generate

# 5. UNSET the environment variable
unset DATABASE_URL
# Windows PowerShell: Remove-Item Env:\DATABASE_URL
```

**Troubleshooting**:
- If connection fails: Check DATABASE_URL format
- If migrations already applied: That's okay, command is idempotent
- If errors occur: Review error message and database connection

### Step 3.2: Initial Data (Optional)

**For Testing/Demo**: You can seed the database with sample data.

```bash
# Set DATABASE_URL again
export DATABASE_URL="<your-production-database-url>"

# Seed the database
npx prisma db seed

# Unset when done
unset DATABASE_URL
```

**For Production**: Instead of seeding, you should:
1. Create admin user manually via database console
2. Have users register through the application

**Demo Users** (if you seeded):
- Manager: `manager@example.com` / `password123`
- Employee: `employee@example.com` / `password123`

---

## Phase 4: Deployment

### Step 4.1: Pre-Deployment Verification (5 min)

Before deploying, verify everything is ready:

```bash
# Check git status
git status
# Should show clean working directory or only deployment-related changes

# Verify CI passes on main branch
# Go to GitHub → Actions tab
# Ensure latest workflow run is ✓ green

# Test build locally one more time
npm run build
# Should complete without errors
```

### Step 4.2: Deploy (5 min)

**Method 1: Automatic Deployment via Git Push (Recommended)**

```bash
# Commit any pending changes
git add .
git commit -m "chore: configure production deployment"

# Push to main branch
git push origin main
```

**What Happens**:
1. GitHub detects push to main
2. Runs CI workflow (lint, type-check, test, build)
3. If CI passes, runs deployment workflow
4. Deploys to Vercel
5. You'll receive deployment URL

**Method 2: Manual GitHub Actions Trigger**

1. Go to GitHub → **Actions** tab
2. Click **Deploy to Vercel** workflow
3. Click **Run workflow** dropdown
4. Select `main` branch
5. Click **Run workflow** button

**Method 3: Local Deployment via Vercel CLI**

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Deploy to production
vercel --prod
```

### Step 4.3: Monitor Deployment (10 min)

**In GitHub**:
1. Go to **Actions** tab
2. Click on the running workflow
3. Watch each step execute
4. Wait for "Deploy to Vercel" step to complete

**In Vercel**:
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Watch the build progress
4. Look for "Building" → "Deploying" → "Ready"

**Typical Timeline**:
- CI checks: 2-3 minutes
- Build: 1-2 minutes
- Deployment: 30 seconds
- **Total: 3-5 minutes**

### Step 4.4: Initial Smoke Test (15 min)

Once deployment shows "Ready", test critical functionality:

#### 1. Basic Access
```bash
# Open your production URL
https://<your-project>.vercel.app

✓ Homepage loads
✓ No console errors
✓ Styling renders correctly
```

#### 2. Authentication
```bash
# Navigate to /login
✓ Login page loads
✓ Can enter credentials
✓ Login succeeds (if you have test account)
✓ Redirects to dashboard
```

#### 3. Core Features
```bash
✓ Dashboard displays
✓ Can view profiles
✓ Can view own profile
✓ Can edit own profile (as employee)
✓ Manager can view all profiles
✓ Can give feedback
✓ Can request time off
✓ Activity feed loads
```

#### 4. Error Tracking
```bash
# Test Sentry integration
1. Add ?debug=sentry to any URL
2. Check Sentry dashboard
✓ Test error appears in Sentry
```

#### 5. Check Logs
```bash
# In Vercel Dashboard
1. Go to your project → Logs
2. Set time range to "Last hour"
✓ See request logs
✓ No unexpected errors
```

**If All Tests Pass**: Proceed to Phase 5
**If Any Test Fails**: See [Troubleshooting](#troubleshooting) section

---

## Phase 5: Post-Deployment

### Step 5.1: Configure Monitoring (15 min)

#### Sentry Alert Rules

1. Go to Sentry → Your Project → **Alerts**
2. **Create "High Error Rate" Alert**:
   - Click **Create Alert**
   - When: `Number of events` is `more than` `10` in `5 minutes`
   - Then: Send notification to `your-email@example.com`
   - Environment: `production`
   - Save

3. **Create "New Issue" Alert**:
   - Click **Create Alert**
   - When: `A new issue is created`
   - Then: Send notification to `your-email@example.com`
   - Environment: `production`
   - Save

#### Uptime Monitoring (Optional)

1. Sign up at https://uptimerobot.com (free tier)
2. **Add New Monitor**:
   - Monitor Type: **HTTPS**
   - Friendly Name: `Employee Portal Production`
   - URL: `https://<your-project>.vercel.app`
   - Monitoring Interval: **5 minutes**
3. **Alert Contacts**:
   - Add your email
   - Configure alert threshold (e.g., down for 2 minutes)
4. Save

**Result**: You'll get notified if site goes down.

### Step 5.2: Document Deployment (10 min)

Update project documentation:

1. **Update README.md**:
   ```markdown
   ## Live Demo

   Production: https://<your-project>.vercel.app

   ## Deployment Status

   ![CI](https://github.com/<user>/<repo>/workflows/CI/badge.svg)
   ![Deploy](https://github.com/<user>/<repo>/workflows/Deploy/badge.svg)
   ```

2. **Record Deployment Details**:
   - Create `docs/PRODUCTION_INFO.md`:
     - Production URL
     - Database: Provider and plan
     - Deployment date
     - Key contacts
     - Monitoring URLs

### Step 5.3: Team Access (5 min)

Grant access to your team:

1. **Vercel**:
   - Go to Project Settings → **Team**
   - Invite team members
   - Set appropriate permissions

2. **Sentry**:
   - Go to Organization Settings → **Members**
   - Invite team members
   - Assign to project

3. **Database**:
   - Share read-only credentials for debugging
   - Document access procedures

---

## Rollback Procedures

### Scenario 1: Application Error (Immediate - < 5 min)

**Via Vercel Dashboard** (Fastest):
1. Go to Vercel → **Deployments**
2. Find last known good deployment (check timestamp)
3. Click **...** → **Promote to Production**
4. Confirm
5. Wait ~30 seconds for propagation

**Via Git Revert**:
```bash
# Revert last commit
git revert HEAD

# Or revert to specific commit
git revert <commit-hash>

# Push to trigger automatic deployment
git push origin main
```

### Scenario 2: Database Migration Issue

**If migration breaks the application**:

1. **Rollback Application First** (see Scenario 1)
2. **Assess Database Damage**:
   ```bash
   # Connect to database
   DATABASE_URL="<prod-url>" npx prisma studio

   # Check data integrity
   ```
3. **Options**:
   - **Option A**: Restore from backup (if available)
   - **Option B**: Write rollback migration
   - **Option C**: Fix forward with new migration

**Prevention**: Always test migrations in staging first.

### Scenario 3: Environment Variable Issue

**If deployment works but features broken**:

1. Go to Vercel → Settings → **Environment Variables**
2. Verify all required variables are set
3. Check for typos in variable names
4. Update incorrect values
5. Click **Redeploy** (no code changes needed)

---

## Troubleshooting

### Issue: Build Fails on Vercel

**Symptoms**: Deployment fails during build step

**Check**:
```bash
# Test build locally
npm run build

# Check TypeScript
npm run type-check

# Check linting
npm run lint
```

**Common Causes**:
- TypeScript errors not caught locally
- Missing dependencies
- Environment variable used at build time not set

### Issue: 500 Server Error After Deployment

**Symptoms**: Site loads but returns 500 errors

**Check Vercel Logs**:
1. Vercel Dashboard → Logs
2. Filter by "Errors"
3. Look for stack traces

**Common Causes**:
- Missing environment variables (check DATABASE_URL, SESSION_SECRET)
- Database connection failure
- Prisma client not generated properly

**Fix**:
```bash
# Trigger rebuild (ensures Prisma client regenerates)
git commit --allow-empty -m "chore: trigger rebuild"
git push origin main
```

### Issue: Database Connection Fails

**Symptoms**: "Can't reach database server" errors

**Check**:
```bash
# Test connection locally
DATABASE_URL="<prod-url>" npx prisma db execute --stdin <<< "SELECT 1"
```

**Common Causes**:
- Incorrect DATABASE_URL format
- IP allowlist restrictions (Supabase/some providers)
- Database paused (free tier auto-pause)

**Fix**:
- Verify URL in Vercel environment variables
- Check database provider dashboard for issues
- Ensure database is not paused/sleeping

### Issue: Sentry Not Receiving Events

**Symptoms**: No errors in Sentry dashboard

**Check**:
1. Verify DSN is set in Vercel
2. Trigger test error: Add `?debug=sentry` to URL
3. Check Sentry project settings → Client Keys

**Common Causes**:
- DSN not set or incorrect
- NEXT_PUBLIC_SENTRY_DSN not set (client-side errors won't report)
- Sentry project deleted or archived

### Issue: Styles Not Loading

**Symptoms**: Site loads but looks broken, no styling

**Common Causes**:
- CSS not bundled properly
- CSP headers blocking inline styles
- Build cache issue

**Fix**:
```bash
# Clear build cache and rebuild
vercel --force

# Or via dashboard
# Deployments → ... → Redeploy → Clear Cache and Redeploy
```

---

## Next Steps After Deployment

### Week 1: Monitor Closely
- Check Sentry daily for errors
- Review Vercel logs
- Monitor performance metrics
- Collect initial user feedback

### Week 2-4: Optimize
- Review slow queries in logs
- Optimize based on real usage patterns
- Adjust cache settings if needed
- Fine-tune error alerting

### Month 2+: Scale
- Upgrade database/hosting plans as needed
- Consider CDN for static assets (Vercel includes this)
- Add more monitoring (APM, custom metrics)
- Implement advanced features

---

## Support Resources

### Documentation
- See `DEPLOYMENT.md` for environment configuration details
- See `RUNBOOK.md` for operational procedures
- See `ARCHITECTURE.md` for system design

### External Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Getting Help
- **Vercel Support**: https://vercel.com/support
- **Sentry Support**: https://sentry.io/support
- **Prisma Community**: https://www.prisma.io/community
- **Project Issues**: Create issue in GitHub repository

---

## Deployment Checklist

Use this checklist for each deployment:

### Pre-Deployment
- [ ] All tests pass locally
- [ ] CI passes on main branch
- [ ] Migrations tested in staging
- [ ] Environment variables verified
- [ ] Team notified of deployment window
- [ ] Rollback plan confirmed

### Deployment
- [ ] Database migrations run successfully
- [ ] Application deploys without errors
- [ ] Smoke tests pass
- [ ] Error tracking operational
- [ ] Logs show normal activity

### Post-Deployment
- [ ] Monitor for first hour
- [ ] Check error rates in Sentry
- [ ] Verify key features work
- [ ] Review performance metrics
- [ ] Update documentation
- [ ] Notify team of completion

---

**Congratulations! Your application is now running in production. 🎉**

For operational procedures and troubleshooting, see `RUNBOOK.md`.
