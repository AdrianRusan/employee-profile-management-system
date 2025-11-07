-- GDPR Compliance Migration: Add Soft Delete Pattern with CASCADE
-- Article 17: Right to Erasure Implementation
-- This migration enables proper user deletion while maintaining audit trails

-- Step 1: Add deletedAt columns for soft delete pattern
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP;
ALTER TABLE "Feedback" ADD COLUMN "deletedAt" TIMESTAMP;
ALTER TABLE "AbsenceRequest" ADD COLUMN "deletedAt" TIMESTAMP;

-- Step 2: Create indexes for efficient soft delete filtering
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX "Feedback_deletedAt_idx" ON "Feedback"("deletedAt");
CREATE INDEX "AbsenceRequest_deletedAt_idx" ON "AbsenceRequest"("deletedAt");

-- Step 3: Create composite indexes for common query patterns
CREATE INDEX "Feedback_receiverId_createdAt_deletedAt_idx" ON "Feedback"("receiverId", "createdAt" DESC, "deletedAt");
CREATE INDEX "AbsenceRequest_userId_deletedAt_idx" ON "AbsenceRequest"("userId", "deletedAt");

-- Step 4: Drop existing RESTRICT constraints
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_giverId_fkey";
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_receiverId_fkey";
ALTER TABLE "AbsenceRequest" DROP CONSTRAINT "AbsenceRequest_userId_fkey";

-- Step 5: Add CASCADE constraints for GDPR compliance
-- When a user is hard-deleted, all related data is automatically removed
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_giverId_fkey"
  FOREIGN KEY ("giverId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AbsenceRequest" ADD CONSTRAINT "AbsenceRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration Notes:
-- 1. Soft Delete: Use deletedAt for standard user removal (preserves audit trail)
-- 2. Hard Delete: Use actual DELETE for GDPR erasure requests (CASCADE removes all data)
-- 3. All queries MUST filter WHERE deletedAt IS NULL to exclude soft-deleted records
-- 4. Authentication MUST reject users with deletedAt != NULL
