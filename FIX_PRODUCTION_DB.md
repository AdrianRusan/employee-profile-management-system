# Fix Production Database - Missing Tables

## Problem
The production database is missing the `User` table, which means the initial migration (`20251030120702_init`) never applied successfully.

Error: `relation "User" does not exist` when trying to apply migration `20250107000000_add_soft_delete_cascade`

---

## Solution: Reset and Apply All Migrations

### Step 1: Check Current State

First, let's see what's in your production database.

**Option A: Using Neon SQL Editor** (Recommended)
1. Go to https://console.neon.tech
2. Navigate to your project
3. Open the SQL Editor
4. Run this query:

```sql
-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check migration history
SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY started_at;
```

**Option B: Using Prisma CLI**
```bash
npx prisma db pull
# This will show you the current schema
```

---

### Step 2: Mark Failed Migration as Rolled Back

```bash
npx prisma migrate resolve --rolled-back "20250107000000_add_soft_delete_cascade"
```

Expected output: `Migration 20250107000000_add_soft_delete_cascade marked as rolled back`

---

### Step 3: Check if First Migration Exists in History

```bash
# This will show you which migrations Prisma thinks are applied
npx prisma migrate status
```

If you see that `20251030120702_init` is marked as applied but tables don't exist, mark it as rolled back too:

```bash
npx prisma migrate resolve --rolled-back "20251030120702_init"
```

---

### Step 4: Deploy All Migrations

Now apply all migrations from the beginning:

```bash
npx prisma migrate deploy
```

Expected output:
```
3 migrations found in prisma/migrations

Applying migration `20251030120702_init`
Applying migration `20250107000000_add_soft_delete_cascade`
Applying migration `20250111000000_add_composite_indexes`

All migrations have been successfully applied.
```

---

### Step 5: Verify Success

```bash
# Check migration status
npx prisma migrate status

# Should output:
# Database schema is up to date!

# Generate Prisma Client
npx prisma generate
```

---

## Alternative: Reset and Push Schema (NUCLEAR OPTION)

⚠️ **WARNING: This will delete ALL data in the production database!**

Only use this if:
- The database is brand new with no important data
- You've backed up any important data
- You're absolutely sure you want to start fresh

```bash
# Push the schema directly (bypasses migrations)
npx prisma db push --accept-data-loss

# Then mark all migrations as applied
npx prisma migrate resolve --applied "20251030120702_init"
npx prisma migrate resolve --applied "20250107000000_add_soft_delete_cascade"
npx prisma migrate resolve --applied "20250111000000_add_composite_indexes"
```

---

## Troubleshooting

### Error: "Cannot resolve migration that is not failed"

This means the migration is not recorded as failed. Mark it as rolled back first:
```bash
npx prisma migrate resolve --rolled-back "MIGRATION_NAME"
```

### Error: "Migration does not exist"

The migration history might be corrupted. Try:
```bash
# Check what Prisma sees
npx prisma migrate status

# View the _prisma_migrations table directly
# Use Neon SQL Editor
```

### Error: "Cannot connect to database"

Check your DATABASE_URL:
```powershell
echo $env:DATABASE_URL
```

Make sure it points to your Neon production database.

---

## Prevention for Next Time

To avoid this issue in the future:

1. **Always verify connection first**:
   ```bash
   npx prisma db pull
   ```

2. **Check migration status before deploying**:
   ```bash
   npx prisma migrate status
   ```

3. **Use staging environment**:
   - Test migrations on staging first
   - Only deploy to production after verification

4. **Monitor migration execution**:
   - Watch for errors during `migrate deploy`
   - Don't ignore warnings

---

## Next Steps After Fix

Once migrations are successfully applied:

1. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. Check your application can connect:
   ```bash
   # Test a simple query
   npx prisma studio
   ```

3. Continue with your deployment process

---

## Need Help?

If you encounter any issues:
1. Note the exact error message
2. Check migration status: `npx prisma migrate status`
3. Share the output and I'll help you debug further
