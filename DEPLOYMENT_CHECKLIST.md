# Production Deployment Checklist

Use this checklist for each production deployment to ensure nothing is missed.

## Pre-Deployment (Before Starting)

### Planning & Preparation
- [ ] Deployment scheduled during low-traffic period
- [ ] Team notified of deployment window
- [ ] Rollback plan confirmed and documented
- [ ] All required accounts created (Vercel, Sentry, Database)

### Code Readiness
- [ ] All features tested locally
- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Run validation: `npm run pre-deploy`

### Environment Configuration
- [ ] Database provisioned and accessible
- [ ] Database URL obtained and saved securely
- [ ] SESSION_SECRET generated (32+ characters)
- [ ] ENCRYPTION_KEY generated (64 hex characters)
- [ ] Sentry project created and DSN obtained
- [ ] All environment variables documented

---

## Deployment Setup

### Vercel Configuration
- [ ] Vercel project created and linked to GitHub repo
- [ ] Production environment variables configured:
  - [ ] DATABASE_URL
  - [ ] SESSION_SECRET
  - [ ] ENCRYPTION_KEY
  - [ ] NEXT_PUBLIC_APP_URL
  - [ ] SENTRY_DSN
  - [ ] NEXT_PUBLIC_SENTRY_DSN
  - [ ] SENTRY_AUTH_TOKEN
  - [ ] SENTRY_ORG
  - [ ] SENTRY_PROJECT
  - [ ] HUGGINGFACE_API_KEY (optional)
- [ ] Vercel Project ID and Org ID noted
- [ ] Vercel API token created

### GitHub Configuration
- [ ] GitHub secrets configured:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
- [ ] CI workflow passing on main branch
- [ ] Deployment workflow configured

### Database Setup
- [ ] Database migrations tested in staging
- [ ] Production migrations executed: `npx prisma migrate deploy`
- [ ] Migration status verified: `npx prisma migrate status`
- [ ] Initial data seeded (if needed)
- [ ] Database backup verified working

---

## Deployment Execution

### Pre-Deployment Verification
- [ ] Run pre-deployment check: `npm run pre-deploy`
- [ ] All checks pass (or warnings reviewed and accepted)
- [ ] Git working directory clean
- [ ] On correct branch (main/master)
- [ ] Latest code pulled from remote

### Deploy
- [ ] Code pushed to main branch: `git push origin main`
- [ ] GitHub Actions CI workflow started and monitored
- [ ] GitHub Actions deploy workflow triggered
- [ ] Vercel build started and monitored
- [ ] Deployment completed successfully

### Initial Verification (Smoke Tests)
- [ ] Production URL accessible: `https://[project].vercel.app`
- [ ] Homepage loads without errors
- [ ] No console errors in browser
- [ ] Login page accessible: `/login`
- [ ] Can log in with test account
- [ ] Dashboard loads after login
- [ ] Profile view works
- [ ] Profile edit works
- [ ] Feedback submission works
- [ ] Absence request works
- [ ] Activity feed displays

---

## Post-Deployment

### Error Tracking & Logging
- [ ] Sentry receiving events (trigger test: `?debug=sentry`)
- [ ] Test error appears in Sentry dashboard
- [ ] Sentry alerts configured:
  - [ ] High error rate alert
  - [ ] New issue alert
- [ ] Vercel logs showing normal activity
- [ ] No unexpected errors in logs

### Monitoring Setup
- [ ] Uptime monitoring configured (UptimeRobot/similar)
- [ ] Status page updated (if applicable)
- [ ] Monitoring dashboards accessible:
  - [ ] Vercel Analytics
  - [ ] Sentry Performance
  - [ ] Database dashboard
- [ ] Alert notifications working (test one)

### Documentation
- [ ] README.md updated with production URL
- [ ] Deployment date documented
- [ ] Environment variables documented
- [ ] Team access granted to:
  - [ ] Vercel project
  - [ ] Sentry project
  - [ ] Database (read-only)
- [ ] PRODUCTION_INFO.md created with:
  - [ ] Production URL
  - [ ] Database provider and plan
  - [ ] Deployment date
  - [ ] Key contacts
  - [ ] Monitoring URLs

### Communication
- [ ] Team notified of successful deployment
- [ ] Stakeholders informed (if applicable)
- [ ] Users notified of new features (if applicable)
- [ ] Status page updated: "All systems operational"

---

## First Hour Monitoring

### Active Monitoring
- [ ] **T+5 min**: Check Sentry for errors
- [ ] **T+5 min**: Check Vercel logs for anomalies
- [ ] **T+15 min**: Verify key features still working
- [ ] **T+15 min**: Check performance metrics (response times)
- [ ] **T+30 min**: Review error rates
- [ ] **T+30 min**: Check database performance
- [ ] **T+60 min**: Full smoke test rerun
- [ ] **T+60 min**: Review first hour metrics

### Issues Found?
- [ ] If critical issues: Execute rollback (see RUNBOOK.md)
- [ ] If minor issues: Create tickets and monitor
- [ ] Document any issues for post-mortem

---

## Week 1 Follow-up

### Daily Checks (First Week)
- [ ] Day 1: Check Sentry dashboard morning and evening
- [ ] Day 2: Review performance metrics
- [ ] Day 3: Check for any user-reported issues
- [ ] Day 4: Review error patterns
- [ ] Day 5: Check database growth
- [ ] Day 6-7: Monitor uptime and error rates

### Performance Review
- [ ] Review Vercel Analytics data
- [ ] Check Core Web Vitals scores
- [ ] Identify any performance bottlenecks
- [ ] Review slow queries in database
- [ ] Optimize if needed

### Security Review
- [ ] Check for failed login attempts
- [ ] Review access logs for anomalies
- [ ] Verify no exposed secrets in logs
- [ ] Check dependency updates (Dependabot)

---

## Post-Deployment Review (After 1 Week)

### Success Metrics
- [ ] Uptime: ___% (target: >99.9%)
- [ ] Error rate: ___% (target: <0.1%)
- [ ] Average response time: ___ms (target: <500ms)
- [ ] Number of incidents: ___ (target: 0)
- [ ] User feedback: ___

### Lessons Learned
Document what went well and what could be improved:
- **What went well:**
  -
  -
  -

- **What could be improved:**
  -
  -
  -

- **Action items for next deployment:**
  - [ ]
  - [ ]
  - [ ]

---

## Rollback Checklist (If Needed)

### Immediate Rollback
- [ ] Identify issue severity (P0-P3)
- [ ] Team notified of rollback decision
- [ ] Rollback executed:
  - **Option A**: Vercel Dashboard → Promote previous deployment
  - **Option B**: `git revert HEAD && git push origin main`
- [ ] Rollback verified successful
- [ ] Monitoring confirms issue resolved
- [ ] Stakeholders notified

### Post-Rollback
- [ ] Root cause identified
- [ ] Fix developed and tested in staging
- [ ] Post-mortem document created
- [ ] Learnings documented for future
- [ ] Redeployment planned

---

## Notes & Observations

**Deployment Date**: _______________

**Deployment Duration**: _______________

**Team Members**: _______________

**Issues Encountered**:



**Performance Notes**:



**Other Observations**:



---

## Sign-off

- [ ] Deployment completed successfully
- [ ] All checks passed
- [ ] Monitoring operational
- [ ] Documentation updated
- [ ] Team informed

**Deployed by**: _______________
**Date**: _______________
**Time**: _______________

---

## Quick Reference

### Emergency Contacts
- On-call Engineer: _______________
- Lead Developer: _______________
- Database Admin: _______________

### Important URLs
- Production: _______________
- Vercel Dashboard: _______________
- Sentry Dashboard: _______________
- Database Dashboard: _______________

### Key Commands
```bash
# Pre-deployment validation
npm run pre-deploy

# Deploy
git push origin main

# Check logs
vercel logs --prod

# Rollback via git
git revert HEAD && git push origin main
```

---

**Checklist Version**: 1.0.0
**Last Updated**: January 2025
