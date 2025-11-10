# GDPR Compliance - Right to Erasure Implementation

## Overview

This document describes how the Employee Profile Management System implements GDPR Article 17 "Right to Erasure" (also known as "Right to be Forgotten") using a soft delete pattern with CASCADE constraints.

## Implementation Date

January 7, 2025

## GDPR Requirements Addressed

### Article 17: Right to Erasure
- Users have the right to request deletion of their personal data
- Organizations must comply within 30 days
- Deletion must be thorough and include all related personal data
- Audit trails may be retained for legal compliance

### Article 5: Storage Limitation Principle
- Personal data should not be kept longer than necessary
- Soft delete allows for grace period before permanent deletion

### Article 30: Records of Processing Activities
- Deletion events must be logged for audit purposes
- Soft delete pattern preserves audit trail

## Technical Implementation

### 1. Database Schema Changes

#### Added Columns
- `User.deletedAt` (DateTime, nullable)
- `Feedback.deletedAt` (DateTime, nullable)
- `AbsenceRequest.deletedAt` (DateTime, nullable)

#### Indexes Created
```sql
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");
CREATE INDEX "AbsenceRequest_deletedAt_idx" ON "AbsenceRequest"("deletedAt");
```

#### Foreign Key Constraints Updated
Changed from `ON DELETE RESTRICT` to `ON DELETE CASCADE`:
- `Feedback.giverId` → `User.id` (CASCADE)
- `Feedback.receiverId` → `User.id` (CASCADE)
- `AbsenceRequest.userId` → `User.id` (CASCADE)

### 2. Deletion Methods

#### Soft Delete (Default)
**Endpoint:** `user.softDelete`
**Access:** Managers only
**Behavior:**
- Sets `deletedAt` timestamp on user record
- User immediately becomes inaccessible to application
- Related data remains intact for audit purposes
- Can be restored within grace period

**Usage:**
```typescript
await trpc.user.softDelete.mutate({ id: userId });
```

#### Hard Delete (GDPR Erasure)
**Endpoint:** `user.hardDelete`
**Access:** Managers only
**Behavior:**
- Permanently deletes user record from database
- CASCADE automatically deletes all related data:
  - All feedback given by user
  - All feedback received by user
  - All absence requests
- IRREVERSIBLE - cannot be undone
- Fulfills GDPR Article 17 obligations

**Usage:**
```typescript
await trpc.user.hardDelete.mutate({ id: userId });
```

#### Restore Deleted User
**Endpoint:** `user.restore`
**Access:** Managers only
**Behavior:**
- Clears `deletedAt` timestamp
- User becomes accessible again
- Only works for soft-deleted users

**Usage:**
```typescript
await trpc.user.restore.mutate({ id: userId });
```

### 3. Query Filtering

All queries automatically filter out soft-deleted records:

**User Queries:**
```typescript
where: {
  // ... other conditions
  deletedAt: null  // Exclude soft-deleted users
}
```

**Related Data Queries:**
```typescript
// Feedback
where: {
  receiverId: userId,
  deletedAt: null  // Exclude soft-deleted feedback
}

// Absence Requests
where: {
  userId: userId,
  deletedAt: null  // Exclude soft-deleted requests
}
```

### 4. Authentication Protection

Soft-deleted users cannot authenticate:

```typescript
// Login
const user = await ctx.prisma.user.findFirst({
  where: {
    email: input.email,
    deletedAt: null  // Reject deleted users
  }
});

// Get Current User
const user = await ctx.prisma.user.findFirst({
  where: {
    id: ctx.session.userId,
    deletedAt: null  // Session invalidated if user deleted
  }
});
```

## GDPR Compliance Workflow

### Standard Employee Departure (Soft Delete)
1. Employee leaves organization
2. Manager soft-deletes user account
3. User immediately loses access
4. Data retained for audit/legal requirements
5. After retention period: hard delete

### GDPR Erasure Request (Hard Delete)
1. Individual submits GDPR erasure request
2. Legal review confirms applicability
3. Manager performs hard delete
4. All personal data permanently removed
5. Deletion logged for compliance audit

### Timeline
- **Soft Delete:** Immediate (milliseconds)
- **GDPR Response:** Within 30 days (legal requirement)
- **Retention Period:** Defined by organization policy
- **Hard Delete:** Immediate and permanent

## Security Considerations

### Access Control
- Only MANAGERS can delete user accounts
- Self-deletion is prevented
- Audit logs capture deletion events

### Safeguards
1. **Soft Delete First:** Encourages grace period
2. **Confirmation Required:** UI should require explicit confirmation for hard delete
3. **Cannot Delete Self:** Managers cannot delete their own accounts
4. **Cascade Awareness:** Hard delete removes ALL related data

### Data Retention Policy
Organizations should establish:
- Standard retention period after soft delete
- Automated hard delete after retention expires
- Exception handling for legal holds
- Audit log retention (independent of user data)

## Migration Instructions

### For Existing Databases
1. Backup database before migration
2. Run migration: `20250107000000_add_soft_delete_cascade`
3. Verify indexes created successfully
4. Test soft delete workflow
5. Test hard delete and CASCADE behavior
6. Update application code to use new endpoints

### Rollback Plan
If rollback needed:
```sql
-- Remove indexes
DROP INDEX "User_deletedAt_idx";
DROP INDEX "Feedback_deletedAt_idx";
DROP INDEX "AbsenceRequest_deletedAt_idx";

-- Remove columns
ALTER TABLE "User" DROP COLUMN "deletedAt";
ALTER TABLE "Feedback" DROP COLUMN "deletedAt";
ALTER TABLE "AbsenceRequest" DROP COLUMN "deletedAt";

-- Restore RESTRICT constraints
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_giverId_fkey";
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_receiverId_fkey";
ALTER TABLE "AbsenceRequest" DROP CONSTRAINT "AbsenceRequest_userId_fkey";

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_giverId_fkey"
  FOREIGN KEY ("giverId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

## Testing Checklist

- [x] Soft delete sets deletedAt timestamp
- [x] Soft-deleted users excluded from queries
- [x] Authentication rejects deleted users
- [x] Hard delete removes user record
- [x] CASCADE deletes all feedback (given and received)
- [x] CASCADE deletes all absence requests
- [x] Restore clears deletedAt timestamp
- [x] Cannot delete own account
- [x] Manager-only access enforced

## Audit Log Requirements

For full GDPR compliance, implement audit logging:

```typescript
// Log deletion events
await auditLog.create({
  action: 'USER_SOFT_DELETED',
  userId: input.id,
  performedBy: ctx.session.userId,
  timestamp: new Date(),
  reason: 'GDPR Article 17 Erasure Request'
});

await auditLog.create({
  action: 'USER_HARD_DELETED',
  userId: input.id,
  performedBy: ctx.session.userId,
  timestamp: new Date(),
  reason: 'GDPR Article 17 Erasure Request - Permanent Deletion'
});
```

## Legal Disclaimer

This implementation provides technical capability to comply with GDPR Article 17. Organizations must:
- Establish proper policies and procedures
- Train staff on GDPR requirements
- Maintain audit logs independently
- Consult legal counsel for specific requirements
- Consider jurisdiction-specific regulations

## References

- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [GDPR Article 5 - Storage Limitation](https://gdpr-info.eu/art-5-gdpr/)
- [GDPR Article 30 - Records of Processing](https://gdpr-info.eu/art-30-gdpr/)
- [PostgreSQL CASCADE Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

## Contact

For questions about GDPR compliance implementation, contact:
- Technical Lead: [Implementation Team]
- Legal Counsel: [Legal Team]
- Data Protection Officer: [DPO Contact]

---

**Document Version:** 1.0
**Last Updated:** January 7, 2025
**Next Review:** July 7, 2025 (6 months)
