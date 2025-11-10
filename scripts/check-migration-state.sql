-- Check which parts of the 20250107000000_add_soft_delete_cascade migration were applied
-- Run this against your production database to understand the current state

-- Check if deletedAt columns exist
SELECT
  'User.deletedAt' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'deletedAt'
  ) as exists;

SELECT
  'Feedback.deletedAt' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Feedback' AND column_name = 'deletedAt'
  ) as exists;

SELECT
  'AbsenceRequest.deletedAt' as check_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'AbsenceRequest' AND column_name = 'deletedAt'
  ) as exists;

-- Check if indexes exist
SELECT
  'User_deletedAt_idx' as check_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'User' AND indexname = 'User_deletedAt_idx'
  ) as exists;

SELECT
  'Feedback_deletedAt_idx' as check_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'Feedback' AND indexname = 'Feedback_deletedAt_idx'
  ) as exists;

SELECT
  'AbsenceRequest_deletedAt_idx' as check_name,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'AbsenceRequest' AND indexname = 'AbsenceRequest_deletedAt_idx'
  ) as exists;

-- Check current foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('Feedback', 'AbsenceRequest')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
