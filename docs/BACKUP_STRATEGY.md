# Database Backup Strategy

## Overview
This document outlines the backup and disaster recovery strategy for the Employee Profile Management System.

## Backup Types

### 1. Automated Daily Backups (Vercel Postgres)
If using Vercel Postgres, automatic daily backups are included:
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 7 days (configurable based on plan)
- **Location**: Vercel infrastructure
- **Recovery**: Via Vercel dashboard or CLI

### 2. Manual Backups
For critical changes or before deployments:

```bash
# Export database to SQL file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Compress for storage
gzip backup-*.sql
```

### 3. Point-in-Time Recovery (PITR)
For production databases with PITR enabled:
- Recovery window: Up to 7 days
- Granularity: Down to the second
- Use case: Recover from accidental data deletion

## Backup Verification

### Monthly Verification
1. Restore backup to test environment
2. Verify data integrity
3. Test application functionality
4. Document any issues

```bash
# Test restore (on test database)
gunzip -c backup-20XX.sql.gz | psql $TEST_DATABASE_URL
```

## Recovery Procedures

### Scenario 1: Recent Data Loss (< 24 hours)
1. Identify the point in time before data loss
2. Use PITR to restore to that timestamp
3. Verify data integrity
4. Resume operations

### Scenario 2: Database Corruption
1. Stop all application instances
2. Restore from most recent backup
3. Apply transaction logs if available
4. Verify data integrity
5. Restart application

### Scenario 3: Complete Database Loss
1. Provision new database instance
2. Restore from latest backup
3. Update DATABASE_URL
4. Run migrations if needed
5. Verify application functionality

## Backup Storage Locations

### Production
- **Primary**: Vercel Postgres automated backups
- **Secondary**: AWS S3 (for long-term retention)
- **Tertiary**: Off-site encrypted storage

### Sensitive Data
- Backups contain encrypted SSN fields (AES-256-GCM)
- Backups should be encrypted at rest
- Access restricted to DBAs and senior engineers

## Backup Schedule

| Backup Type | Frequency | Retention | Location |
|-------------|-----------|-----------|----------|
| Automated | Daily | 7 days | Vercel |
| Manual (pre-deploy) | Before major releases | 30 days | S3 |
| Monthly archive | Monthly | 1 year | S3 Glacier |

## Monitoring

### Backup Success Monitoring
- Alert if daily backup fails
- Alert if backup size deviates >20% from baseline
- Monthly backup verification test

### Metrics to Track
- Backup size over time
- Backup duration
- Last successful backup timestamp
- Restore test success rate

## Compliance & Security

### GDPR Considerations
- Backups contain personal data
- Right to erasure: Mark users as deleted in backups
- Backup retention policy documented
- Encrypted backups with key rotation

### Access Control
- Production backup access: Senior Engineers + DBAs only
- Audit log all backup restores
- MFA required for backup access

## Emergency Contacts

| Role | Contact | Purpose |
|------|---------|---------|
| DBA Lead | dba@company.com | Backup/restore operations |
| DevOps Lead | devops@company.com | Infrastructure issues |
| Security Lead | security@company.com | Data breach response |

## Disaster Recovery RTO/RPO

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Data Loss Tolerance**: Maximum 1 day of transactions

## Backup Commands Reference

### Create Backup
```bash
# Full database backup
pg_dump -Fc $DATABASE_URL > backup.dump

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql

# Data only
pg_dump --data-only $DATABASE_URL > data.sql
```

### Restore Backup
```bash
# Restore full backup
pg_restore -d $DATABASE_URL backup.dump

# Restore from SQL file
psql $DATABASE_URL < backup.sql
```

### Verify Backup
```bash
# Check backup file integrity
pg_restore --list backup.dump

# Test restore (dry run)
pg_restore --list backup.dump | wc -l
```

## Testing Schedule

- **Weekly**: Verify automated backups are running
- **Monthly**: Full restore test to staging environment
- **Quarterly**: Disaster recovery drill

## Updates & Maintenance

Last Updated: 2025-01-13
Next Review: 2025-04-13
Document Owner: DevOps Team
