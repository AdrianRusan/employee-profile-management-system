# Deployment Rollback Strategy

## Overview
This document outlines the procedures for rolling back deployments in case of issues.

## Rollback Scenarios

### Scenario 1: Vercel Deployment Issues
If a deployment to Vercel causes problems:

#### Instant Rollback (Recommended)
1. Go to Vercel Dashboard → Project → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"
4. Previous deployment becomes active immediately

#### Via CLI
```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote <deployment-url>
```

### Scenario 2: Database Migration Issues
If database migrations cause problems:

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Apply previous migration state
npx prisma migrate deploy
```

**⚠️ IMPORTANT**: Never roll back destructive migrations (DROP TABLE, DROP COLUMN) without restoring from backup first.

### Scenario 3: Configuration/Environment Variable Issues
If new environment variables cause issues:

1. Revert environment variables in Vercel dashboard
2. Redeploy previous commit
3. Verify application functionality

## Pre-Deployment Checklist

✅ Run all tests locally
✅ Check CI/CD pipeline passed
✅ Review database migrations (if any)
✅ Verify environment variables are set
✅ Take database backup (for major changes)
✅ Inform team of deployment
✅ Monitor error tracking (Sentry) after deployment

## Post-Deployment Monitoring

### First 5 Minutes
- Check /api/health endpoint
- Monitor Sentry for new errors
- Verify core functionality (login, dashboard)

### First Hour
- Monitor error rates
- Check performance metrics
- Review logs for anomalies

## Rollback Decision Criteria

Roll back immediately if:
- 🔴 Critical functionality is broken
- 🔴 Error rate increases >50%
- 🔴 Database corruption detected
- 🔴 Security vulnerability introduced

Investigate before rollback if:
- 🟡 Minor UI issues
- 🟡 Non-critical feature bugs
- 🟡 Performance degradation <20%

## Manual Rollback Procedure

### Step 1: Assess Impact
```bash
# Check recent deployments
vercel ls --prod

# Check error logs
vercel logs <deployment-url>

# Check Sentry for new errors
```

### Step 2: Identify Last Known Good Deployment
```bash
# Find deployment before the problematic one
vercel ls | head -10
```

### Step 3: Execute Rollback
```bash
# Promote previous deployment
vercel promote <previous-deployment-url>
```

### Step 4: Verify Rollback
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Check deployment status
vercel inspect <deployment-url>
```

### Step 5: Post-Rollback Actions
1. Update team in Slack/Discord
2. Create incident report
3. Document what went wrong
4. Plan fix for next deployment

## Automated Rollback (Future Enhancement)

```yaml
# .github/workflows/auto-rollback.yml
name: Auto Rollback on Errors

on:
  deployment_status

jobs:
  check-deployment:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Wait 5 minutes
        run: sleep 300

      - name: Check error rate
        run: |
          # Query Sentry API for error rate
          # If error rate > threshold, trigger rollback

      - name: Rollback if needed
        run: vercel promote $PREVIOUS_DEPLOYMENT
```

## Database Rollback Considerations

### Safe to Rollback
- ✅ Adding new columns (nullable)
- ✅ Adding new tables
- ✅ Adding new indexes
- ✅ Updating seed data

### Requires Data Migration
- ⚠️ Removing columns
- ⚠️ Removing tables
- ⚠️ Changing column types
- ⚠️ Adding non-nullable columns

### Dangerous - Requires Backup Restore
- 🔴 DROP TABLE
- 🔴 DROP COLUMN
- 🔴 Changing primary keys
- 🔴 Large data transformations

## Communication Template

### Pre-Deployment Announcement
```
🚀 Deployment Starting
Version: v1.2.3
Expected downtime: None
ETA: 10 minutes
Changes: [brief description]
```

### Rollback Announcement
```
⚠️ Rollback Initiated
Reason: [brief description]
Action: Rolling back to previous version
ETA: 5 minutes
Impact: [describe any data loss/issues]
```

### Post-Rollback Announcement
```
✅ Rollback Complete
Status: System stable
Previous version: Restored
Next steps: [fix plan]
```

## Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|----------------|
| DevOps Lead | devops@company.com | Deployment issues |
| DBA | dba@company.com | Database issues |
| Security | security@company.com | Security issues |
| CTO | cto@company.com | Critical incidents |

## Rollback Metrics

Track these metrics for each rollback:
- Time to detect issue
- Time to decision (rollback or fix forward)
- Time to execute rollback
- Data loss (if any)
- User impact duration

## Lessons Learned Template

After each rollback, document:
1. **What happened**: Brief description
2. **Root cause**: Technical reason
3. **Detection method**: How was issue discovered
4. **Impact**: Users/features affected
5. **Resolution time**: Time to rollback
6. **Prevention**: How to avoid in future

## Testing Rollback Procedure

### Quarterly Drill
1. Deploy to staging
2. Introduce breaking change
3. Practice rollback procedure
4. Measure time and effectiveness
5. Update documentation

Last Updated: 2025-01-13
Next Review: 2025-04-13
Document Owner: DevOps Team
