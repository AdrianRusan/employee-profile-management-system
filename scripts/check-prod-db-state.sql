-- Check if the _prisma_migrations table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = '_prisma_migrations'
) as prisma_migrations_table_exists;

-- Check what migrations are recorded (if table exists)
SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations
ORDER BY started_at;

-- Check what tables actually exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
