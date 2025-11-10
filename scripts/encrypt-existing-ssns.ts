/**
 * Migration Script: Encrypt Existing SSNs
 *
 * This script encrypts all plaintext SSNs in the database using AES-256-GCM encryption.
 * It's designed to be run once during the deployment of the encryption feature.
 *
 * Usage:
 *   npx ts-node scripts/encrypt-existing-ssns.ts
 *
 * Safety Features:
 * - Dry-run mode by default (set DRY_RUN=false to actually encrypt)
 * - Checks if SSN is already encrypted before attempting encryption
 * - Logs all operations for audit trail
 * - Handles errors gracefully per-user (doesn't fail entire migration)
 * - Creates backup recommendation before running
 *
 * IMPORTANT:
 * 1. Backup your database before running this script!
 * 2. Ensure ENCRYPTION_KEY is set in your .env file
 * 3. Run with DRY_RUN=true first to preview changes
 * 4. Then run with DRY_RUN=false to actually encrypt
 *
 * Example:
 *   # Preview changes (dry run)
 *   npx ts-node scripts/encrypt-existing-ssns.ts
 *
 *   # Actually encrypt the data
 *   DRY_RUN=false npx ts-node scripts/encrypt-existing-ssns.ts
 */

import { PrismaClient } from '@prisma/client';
import { encrypt, isEncrypted } from '../lib/encryption';

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run for safety

interface MigrationStats {
  total: number;
  alreadyEncrypted: number;
  encrypted: number;
  skipped: number;
  errors: number;
}

/**
 * Main migration function
 */
async function main() {
  console.log('='.repeat(70));
  console.log('SSN Encryption Migration Script');
  console.log('='.repeat(70));
  console.log();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No data will be modified');
    console.log('   To actually encrypt data, run: DRY_RUN=false npx ts-node scripts/encrypt-existing-ssns.ts');
  } else {
    console.log('⚠️  LIVE MODE - Data will be encrypted!');
    console.log('   Make sure you have a database backup!');
  }

  console.log();
  console.log('Fetching users with SSN data...');

  // Fetch all users that have SSN data
  const users = await prisma.user.findMany({
    where: {
      ssn: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      ssn: true,
    },
  });

  console.log(`Found ${users.length} users with SSN data\n`);

  if (users.length === 0) {
    console.log('✅ No users with SSN data found. Nothing to migrate.');
    return;
  }

  const stats: MigrationStats = {
    total: users.length,
    alreadyEncrypted: 0,
    encrypted: 0,
    skipped: 0,
    errors: 0,
  };

  console.log('Processing users...\n');

  // Process each user
  for (const user of users) {
    const { id, name, email, ssn } = user;

    // Skip if SSN is null or empty (shouldn't happen due to query filter, but safety check)
    if (!ssn || ssn.trim() === '') {
      console.log(`⏭️  Skipping user ${name} (${email}) - Empty SSN`);
      stats.skipped++;
      continue;
    }

    // Check if SSN is already encrypted
    if (isEncrypted(ssn)) {
      console.log(`✓  User ${name} (${email}) - Already encrypted`);
      stats.alreadyEncrypted++;
      continue;
    }

    // Encrypt the SSN
    try {
      const encryptedSSN = encrypt(ssn);

      if (DRY_RUN) {
        console.log(`🔍 User ${name} (${email}) - Would encrypt SSN`);
        console.log(`   Original length: ${ssn.length} chars`);
        console.log(`   Encrypted length: ${encryptedSSN.length} chars`);
      } else {
        // Actually update the database
        await prisma.user.update({
          where: { id },
          data: { ssn: encryptedSSN },
        });

        console.log(`✅ User ${name} (${email}) - SSN encrypted successfully`);
      }

      stats.encrypted++;
    } catch (error) {
      console.error(`❌ User ${name} (${email}) - Encryption failed:`);
      console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
      stats.errors++;
    }
  }

  // Print summary
  console.log();
  console.log('='.repeat(70));
  console.log('Migration Summary');
  console.log('='.repeat(70));
  console.log(`Total users processed:    ${stats.total}`);
  console.log(`Already encrypted:        ${stats.alreadyEncrypted}`);
  console.log(`Newly encrypted:          ${stats.encrypted}`);
  console.log(`Skipped:                  ${stats.skipped}`);
  console.log(`Errors:                   ${stats.errors}`);
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log();
    console.log('🔍 This was a DRY RUN - No data was modified');
    console.log('   To actually encrypt data, run:');
    console.log('   DRY_RUN=false npx ts-node scripts/encrypt-existing-ssns.ts');
  } else {
    console.log();
    if (stats.errors > 0) {
      console.log('⚠️  Migration completed with errors. Please review the error messages above.');
    } else {
      console.log('✅ Migration completed successfully!');
    }
  }

  console.log();
}

/**
 * Run the migration
 */
main()
  .catch((error) => {
    console.error('❌ Migration failed with error:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
