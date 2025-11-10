# Operations Runbook

**Daily operational procedures, troubleshooting guide, and incident response for Employee Profile Management System production environment.**

## Quick Reference

| What | Where | URL |
|------|-------|-----|
| Production App | Vercel | https://[your-project].vercel.app |
| Error Tracking | Sentry | https://sentry.io/organizations/[org]/projects/employee-profile-management/ |
| Database | Vercel Postgres/Supabase | [Provider dashboard] |
| CI/CD | GitHub Actions | https://github.com/[user]/[repo]/actions |
| Logs | Vercel Dashboard | https://vercel.com/[team]/[project]/logs |

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring](#monitoring)
3. [Common Tasks](#common-tasks)
4. [Incident Response](#incident-response)
5. [Performance Tuning](#performance-tuning)
6. [Security Operations](#security-operations)
7. [Database Operations](#database-operations)

---

## Daily Operations

### Morning Checks (5-10 minutes)

```bash
# 1. Check application health
curl -I https://[your-project].vercel.app
# Expected: HTTP/2 200

# 2. Check Sentry dashboard
# Go to Sentry → Issues
# Look for: New issues, Error count spikes

# 3. Check Vercel logs
# Go to Vercel → Logs
# Filter: Last 24 hours, Errors only
# Look for: Unusual patterns, repeated errors

# 4. Check uptime monitor
# Go to UptimeRobot dashboard (if configured)
# Verify: 100% uptime, no alerts
```

### Weekly Checks (15-20 minutes)

1. **Review Performance**:
   - Vercel Analytics → Check Core Web Vitals
   - Sentry → Performance tab → Review slow transactions
   - Look for: Degrading trends, slow endpoints

2. **Database Health**:
   - Check database size growth
   - Review connection pool usage
   - Verify backups are running

3. **Security Review**:
   - Check for failed login attempts (in logs)
   - Review Sentry for security-related errors
   - Check dependency updates (Dependabot)

4. **Triage Sentry Issues**:
   - Assign critical issues
   - Mark resolved issues
   - Archive noise/false positives

---

## Monitoring

### Key Metrics to Watch

#### Application Health
- **Uptime**: Target 99.9%
- **Response Time**: p95 < 500ms
- **Error Rate**: < 0.1%

#### Database
- **Connection Pool**: < 80% utilization
- **Query Time**: p95 < 100ms
- **Storage**: Monitor growth rate

#### User Experience
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Dashboards to Check

#### Vercel Analytics
```
Go to: Vercel → Project → Analytics

Check:
- Page views over time
- Top pages by traffic
- Device/browser breakdown
- Core Web Vitals scores
- Conversion funnel (if configured)
```

#### Sentry Performance
```
Go to: Sentry → Performance

Check:
- Transaction list (slowest first)
- User misery index
- Apdex score
- Throughput graph
```

### Setting Up Alerts

#### Critical Alerts (Immediate Response Required)
- Application down (uptime < 99%)
- Error rate > 10 errors/minute
- Database connection failures
- p95 response time > 5 seconds

#### Warning Alerts (Review Within 1 Hour)
- Error rate > 5 errors/minute
- p95 response time > 1 second
- Database connections > 80%
- Sentry new issue created

#### Info Alerts (Review Daily)
- Dependency updates available
- Successful deployments
- Weekly performance summaries

---

## Common Tasks

### Deploy a Hotfix

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-issue main

# 2. Make fix and commit
git add .
git commit -m "fix: critical issue description"

# 3. Push and create PR
git push origin hotfix/critical-issue

# 4. After PR approval, merge to main
git checkout main
git pull origin main

# 5. Deployment triggers automatically
# Monitor in GitHub Actions and Vercel

# 6. Verify fix in production
# Run smoke tests
# Check Sentry for reduction in errors
```

### Update Environment Variables

```bash
# 1. In Vercel Dashboard
Settings → Environment Variables

# 2. Find the variable to update
# Click Edit

# 3. Update value
# Select environment (Production/Preview/Development)

# 4. Save

# 5. Trigger redeploy if needed
# For NEXT_PUBLIC_* variables, rebuild is required
Deployments → Latest → ... → Redeploy
```

### Run Database Migration

```bash
# 1. Test migration in staging FIRST
# Never run untested migrations in production

# 2. Create migration locally
npx prisma migrate dev --name descriptive_migration_name

# 3. Test migration in staging
export DATABASE_URL="<staging-database-url>"
npx prisma migrate deploy

# 4. Verify staging works
# Test affected features thoroughly

# 5. Run in production
export DATABASE_URL="<production-database-url>"
npx prisma migrate deploy

# 6. Verify migration status
npx prisma migrate status

# 7. Monitor application
# Check Sentry for errors
# Check logs for database errors

# 8. If issues occur, immediately roll back application
# See: Rollback Procedures in PRODUCTION_DEPLOYMENT_GUIDE.md
```

### Check Application Logs

```bash
# Via Vercel Dashboard
1. Go to: Vercel → Project → Logs
2. Set filters:
   - Time range: Last hour/day/week
   - Status: All, or filter by 200/400/500
   - Source: Edge/Function/Build
3. Search for specific patterns:
   - Error messages
   - User IDs
   - API endpoints

# Via Vercel CLI
vercel logs [project-name] --prod

# Filter by time
vercel logs --since 1h  # Last hour
vercel logs --since 24h # Last 24 hours

# Follow logs in real-time
vercel logs --prod --follow
```

### Manually Trigger Deployment

```bash
# Via GitHub Actions
1. Go to: GitHub → Actions → Deploy to Vercel
2. Click: Run workflow
3. Select: main branch
4. Click: Run workflow button

# Via Vercel Dashboard
1. Go to: Vercel → Deployments
2. Find deployment to promote
3. Click: ... → Redeploy

# Via Vercel CLI
vercel --prod
```

### Rotate Secrets

**When to Rotate**:
- Every 90 days (regular rotation)
- After team member departure
- If secret potentially compromised
- After security incident

**Procedure**:
```bash
# 1. Generate new secret
openssl rand -hex 32

# 2. Update in Vercel
Vercel Dashboard → Settings → Environment Variables → Edit

# 3. For SESSION_SECRET rotation:
# WARNING: This will log out all users
# Schedule during low-traffic period

# 4. Trigger redeploy
Deployments → Latest → ... → Redeploy

# 5. Monitor for issues
# Users will need to log in again
# Check Sentry for authentication errors

# 6. Update documentation
# Record rotation date
# Update password manager
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 (Critical) | App completely down | Immediate | Database unreachable, app won't start |
| P1 (High) | Core feature broken | < 1 hour | Login broken, cannot submit feedback |
| P2 (Medium) | Non-core feature broken | < 4 hours | Charts not loading, slow queries |
| P3 (Low) | Minor issue | < 24 hours | UI glitch, typo |

### Incident Response Process

#### 1. Detection
- Alert received (Sentry, uptime monitor, user report)
- Verify issue in production
- Determine severity level

#### 2. Initial Response (P0/P1)
```bash
# Immediate actions:
1. Acknowledge incident (update status page if available)
2. Assemble response team
3. Check recent deployments (likely cause)
4. Review Sentry for error spike
5. Check Vercel logs for patterns

# Quick health check:
curl -I https://[your-project].vercel.app
# Check response code and time
```

#### 3. Investigation
```bash
# Check recent changes:
git log --oneline -10

# Review deployment history:
# Vercel Dashboard → Deployments
# Look for deployments within error timeframe

# Check database:
DATABASE_URL="<prod>" npx prisma studio
# Verify database is accessible and data intact

# Review Sentry issues:
# Group similar errors
# Check error frequency graph
# Review stack traces

# Check Vercel functions:
# Dashboard → Functions tab
# Look for timeouts, errors, cold starts
```

#### 4. Mitigation
```bash
# For application errors:
# Option A: Rollback to last known good deployment
Vercel Dashboard → Deployments → Previous → Promote

# Option B: Hotfix deploy
# Create fix, deploy via GitHub Actions

# For database issues:
# Option A: Restore from backup
# See: Database Operations → Restore from Backup

# Option B: Fix data manually
DATABASE_URL="<prod>" npx prisma studio
# Make corrections carefully

# For external service issues:
# Check status pages: Vercel, Sentry, Database provider
# Wait for service restoration or implement fallback
```

#### 5. Resolution
```bash
# Verify fix:
1. Run smoke tests
2. Check Sentry - error rate should drop
3. Verify affected features work
4. Monitor for 30 minutes

# Communicate:
1. Update status page/team
2. Notify affected users if needed
3. Mark incident as resolved
```

#### 6. Post-Incident Review
```markdown
# Create post-incident document:

## Incident Summary
- Date/Time: [timestamp]
- Duration: [X hours]
- Severity: P[0-3]
- Impact: [user impact description]

## Root Cause
[Detailed explanation of what went wrong]

## Timeline
- [time]: Issue detected
- [time]: Response initiated
- [time]: Root cause identified
- [time]: Fix deployed
- [time]: Issue resolved

## Resolution
[What was done to fix it]

## Prevention
[Action items to prevent recurrence]:
1. [ ] Add test coverage for scenario
2. [ ] Improve monitoring/alerting
3. [ ] Update runbook with learnings
4. [ ] Enhance deployment procedures
```

### Common Incident Scenarios

#### Scenario: Database Connection Failure

**Symptoms**:
- Sentry shows "Can't reach database server"
- All database operations fail
- Application returns 500 errors

**Diagnosis**:
```bash
# Test connection
DATABASE_URL="<prod>" npx prisma db execute --stdin <<< "SELECT 1"

# Check database status in provider dashboard
# Vercel Postgres/Supabase: Go to dashboard
```

**Resolution**:
1. Check database is running (not paused)
2. Verify DATABASE_URL is correct in Vercel
3. Check connection pool isn't exhausted
4. If database provider issue, wait for resolution
5. If pool exhausted, restart application (redeploy)

#### Scenario: High Error Rate Spike

**Symptoms**:
- Sentry alert: High error rate
- Multiple users affected
- Errors started suddenly

**Diagnosis**:
```bash
# Check Sentry issues list
# Group by error message
# Check "First Seen" timestamp
# Review affected URLs/endpoints

# Correlate with deployments
# Vercel Dashboard → Deployments
# Check if spike started after deployment
```

**Resolution**:
1. If after recent deployment: **Rollback immediately**
2. If gradual spike: Investigate root cause
3. Check for DDoS/abuse patterns in logs
4. Scale resources if needed (upgrade plan)

#### Scenario: Slow Performance

**Symptoms**:
- Users report slow page loads
- Sentry performance monitoring shows high p95
- Timeouts occurring

**Diagnosis**:
```bash
# Check Vercel Analytics
# Review slow pages

# Check Sentry Performance
# Review slow transactions
# Check database query times

# Check Vercel Functions
# Look for cold starts, memory issues
```

**Resolution**:
1. Identify slow queries → Add database indexes
2. Check for N+1 queries → Optimize includes
3. Review React Query cache settings
4. Consider upgrading hosting plan
5. Implement caching where appropriate

---

## Performance Tuning

### Database Query Optimization

```bash
# 1. Identify slow queries
# Sentry → Performance → Transactions
# Sort by: slowest average duration

# 2. Analyze query
# Find the endpoint generating slow query
# Review Prisma query in code

# 3. Add indexes
# Example: If filtering by userId often
npx prisma migrate dev --name add_userId_index

# In migration file:
CREATE INDEX "User_email_idx" ON "User"("email");

# 4. Deploy migration
npx prisma migrate deploy

# 5. Monitor improvement
# Check Sentry performance for that transaction
```

### React Query Cache Tuning

```typescript
// Current settings in lib/trpc/Provider.tsx

// If data changes frequently:
staleTime: 1000 * 60, // 1 minute (reduce from 5)

// If data rarely changes:
staleTime: 1000 * 60 * 10, // 10 minutes (increase from 5)

// Update and redeploy
```

### Image Optimization

```typescript
// Next.js automatically optimizes images
// Ensure you're using next/image component

import Image from 'next/image'

<Image
  src="/profile.jpg"
  width={200}
  height={200}
  alt="Profile"
  priority // for above-the-fold images
/>
```

---

## Security Operations

### Monitor for Security Issues

```bash
# Daily checks:
1. Check Dependabot alerts in GitHub
2. Review failed login attempts in logs:
   # Vercel logs → Search: "login failed"
3. Check for unusual API usage patterns
4. Review Sentry for suspicious errors
```

### Respond to Security Vulnerability

```bash
# 1. Assess severity
# Check CVE database, GitHub Security Advisory

# 2. For critical vulnerabilities:
# Immediate action required

# Update dependency:
npm update [package-name]

# Or specific version:
npm install [package]@[version]

# 3. Test locally
npm run validate

# 4. Deploy immediately
git commit -m "security: update [package] to fix CVE-XXXX"
git push origin main

# 5. Monitor deployment
# Verify no breaking changes

# 6. Document
# Record in security log
```

### Review Access Logs

```bash
# Check for suspicious patterns:
# - Multiple failed logins from same IP
# - Unusual access times
# - Access to sensitive endpoints
# - SQL injection attempts (malformed queries)

# Vercel Dashboard → Logs
# Filter: Last 7 days
# Search patterns:
# - status:401 (unauthorized attempts)
# - status:403 (forbidden access)
# - "error" in URL (injection attempts)
```

---

## Database Operations

### Backup Verification

```bash
# Verify backups are running:
# Vercel Postgres: Automatic, check dashboard
# Supabase: Project Settings → Database → Backups

# Test restoration (monthly):
1. Take a backup
2. Restore to test instance
3. Verify data integrity
4. Document restore time
```

### Database Restore Procedure

**⚠️ CRITICAL: Only perform during planned maintenance or emergency**

```bash
# 1. Notify team - database will be unavailable

# 2. Create backup of current state (just in case)
# Via provider dashboard

# 3. Restore from backup
# Vercel Postgres: Dashboard → Backups → Restore
# Supabase: Dashboard → Database → Backups → Restore

# 4. Update DATABASE_URL if restored to new instance
# Vercel Settings → Environment Variables

# 5. Run migrations if needed
DATABASE_URL="<new-url>" npx prisma migrate deploy

# 6. Redeploy application
# Vercel Dashboard → Redeploy

# 7. Verify data
# Check critical records exist
# Test application functionality

# 8. Monitor closely for 1 hour
# Check logs, Sentry, user feedback
```

### Database Scaling

```bash
# Signs you need to scale:
# - Connection pool frequently maxed out
# - Query times increasing
# - Database size approaching plan limit
# - Memory errors in logs

# Scaling options:
1. Upgrade database plan:
   # Provider dashboard → Upgrade Plan
   # Choose larger tier

2. Add read replicas (advanced):
   # Reduces load on primary
   # Requires code changes

3. Optimize queries:
   # Add indexes
   # Reduce data fetched
   # Implement pagination

4. Archive old data:
   # Move historical records to archive table
   # Reduces main table size
```

---

## Maintenance Windows

### Planned Maintenance Process

```bash
# 1. Schedule (2 weeks notice minimum):
# Choose low-traffic period (typically weekends)

# 2. Communicate:
# Email users 1 week before
# Post status update 24 hours before
# Post reminder 1 hour before

# 3. Pre-maintenance:
# Take full database backup
# Test changes in staging
# Prepare rollback plan
# Have team on standby

# 4. During maintenance:
# Set maintenance mode (if available)
# Perform updates/migrations
# Test thoroughly
# Monitor logs/Sentry

# 5. Post-maintenance:
# Remove maintenance mode
# Monitor for 1 hour
# Send "all clear" communication
```

### Regular Maintenance Schedule

| Task | Frequency | Duration | Impact |
|------|-----------|----------|--------|
| Dependency updates | Monthly | 1-2 hours | None (test in staging) |
| Database cleanup | Quarterly | 2-3 hours | Possible slowdown |
| Security patches | As needed | 30 min - 2 hours | Usually none |
| Major version upgrades | Annually | 4-8 hours | Possible downtime |

---

## Contact Information

### Escalation Path

| Level | Contact | Response Time |
|-------|---------|---------------|
| L1 (On-call engineer) | [email/phone] | Immediate |
| L2 (Lead developer) | [email/phone] | < 30 minutes |
| L3 (Technical director) | [email/phone] | < 1 hour |

### External Support

| Service | Support URL | Priority Support Phone |
|---------|-------------|----------------------|
| Vercel | https://vercel.com/support | Pro plan: Yes |
| Sentry | https://sentry.io/support | Team plan: Yes |
| Database Provider | [provider support URL] | Depends on plan |

---

## Appendix

### Useful Commands

```bash
# Vercel CLI
vercel --version                # Check version
vercel login                    # Login to Vercel
vercel ls                       # List projects
vercel logs                     # View logs
vercel env ls                   # List environment variables
vercel domains ls               # List domains

# Prisma
npx prisma studio               # Open database GUI
npx prisma migrate status       # Check migration status
npx prisma migrate deploy       # Run migrations
npx prisma db push              # Push schema (dev only)
npx prisma generate             # Generate client

# Git
git log --oneline -20           # Recent commits
git diff HEAD~1                 # Compare with previous commit
git revert HEAD                 # Revert last commit
```

### Log Analysis Patterns

```bash
# Find authentication errors
vercel logs --prod | grep "authentication"

# Find database errors
vercel logs --prod | grep "database\|prisma"

# Find slow requests (>1s)
vercel logs --prod | grep "duration: [1-9][0-9][0-9][0-9]"

# Count errors by type
vercel logs --prod | grep "Error" | cut -d':' -f2 | sort | uniq -c
```

---

**Document Version**: 1.0.0
**Last Updated**: January 2025
**Next Review**: Quarterly or after major incident
