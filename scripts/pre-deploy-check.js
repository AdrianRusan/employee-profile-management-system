#!/usr/bin/env node
/**
 * Pre-Deployment Validation Script
 *
 * Run this script before deploying to production to verify:
 * - All required environment variables are set
 * - Database connection works
 * - All tests pass
 * - Build succeeds
 * - No security issues
 *
 * Usage: node scripts/pre-deploy-check.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { promisify } = require('util');
const execAsync = promisify(exec);

// Load environment variables from .env file
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

// Track overall status
let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`${icons.success} ${message}`, colors.green);
}

function error(message) {
  log(`${icons.error} ${message}`, colors.red);
  hasErrors = true;
}

function warning(message) {
  log(`${icons.warning} ${message}`, colors.yellow);
  hasWarnings = true;
}

function info(message) {
  log(`${icons.info} ${message}`, colors.cyan);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`${title}`, colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

async function runCommand(command, errorMessage) {
  try {
    const { stdout, stderr } = await execAsync(command);
    // Ignore stderr if it only contains warnings (Prisma, npm, etc. often write warnings to stderr)
    if (stderr && !stderr.toLowerCase().includes('warn') && !stderr.includes('deprecated')) {
      throw new Error(stderr);
    }
    return { success: true, output: stdout };
  } catch (err) {
    error(`${errorMessage}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function checkEnvironmentVariables() {
  section('Checking Environment Variables');

  const required = {
    DATABASE_URL: 'Database connection string',
    SESSION_SECRET: 'Session encryption key (min 32 chars)',
    ENCRYPTION_KEY: 'Field encryption key (64 hex chars)',
    NEXT_PUBLIC_APP_URL: 'Public application URL',
  };

  const recommended = {
    SENTRY_DSN: 'Sentry error tracking',
    NEXT_PUBLIC_SENTRY_DSN: 'Sentry client-side tracking',
    HUGGINGFACE_API_KEY: 'AI feedback polishing',
  };

  let allRequiredSet = true;

  // Check required variables
  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      error(`Missing required: ${key} (${description})`);
      allRequiredSet = false;
    } else {
      // Validate format
      if (key === 'SESSION_SECRET' && process.env[key].length < 32) {
        error(`${key} must be at least 32 characters long`);
        allRequiredSet = false;
      } else if (key === 'ENCRYPTION_KEY' && process.env[key].length !== 64) {
        error(`${key} must be exactly 64 hexadecimal characters`);
        allRequiredSet = false;
      } else if (key === 'NEXT_PUBLIC_APP_URL' && !process.env[key].startsWith('http')) {
        error(`${key} must be a valid URL starting with http:// or https://`);
        allRequiredSet = false;
      } else {
        success(`${key} is set`);
      }
    }
  }

  // Check recommended variables
  for (const [key, description] of Object.entries(recommended)) {
    if (!process.env[key]) {
      warning(`Recommended: ${key} (${description})`);
    } else {
      success(`${key} is set`);
    }
  }

  return allRequiredSet;
}

async function checkDatabaseConnection() {
  section('Checking Database Connection');

  if (!process.env.DATABASE_URL) {
    error('DATABASE_URL not set, skipping database check');
    return false;
  }

  info('Testing database connection...');

  // Use Prisma validate which checks schema and DB connection
  // This is cross-platform compatible (Windows, Linux, macOS)
  const validateResult = await runCommand(
    'npx prisma validate',
    'Prisma schema validation failed'
  );

  if (!validateResult.success) {
    return false;
  }

  // Check migration status - this also validates DB connection
  info('Checking migration status...');
  const migrationResult = await runCommand(
    'npx prisma migrate status',
    'Failed to check migration status (database may be unreachable)'
  );

  if (migrationResult.success) {
    success('Database connection successful');
    if (migrationResult.output.includes('Database schema is up to date')) {
      success('All migrations applied');
    } else {
      warning('Pending migrations detected - run "npx prisma migrate deploy"');
    }
    return true;
  }

  return false;
}

async function checkTypeScript() {
  section('Checking TypeScript');

  info('Running type check...');
  const result = await runCommand('npm run type-check', 'TypeScript errors found');

  if (result.success) {
    success('No TypeScript errors');
  }

  return result.success;
}

async function checkLinting() {
  section('Checking Linting');

  info('Running ESLint...');
  const result = await runCommand('npm run lint', 'Linting errors found');

  if (result.success) {
    success('No linting errors');
  }

  return result.success;
}

async function checkTests() {
  section('Checking Tests');

  info('Running test suite...');
  const result = await runCommand('npm test', 'Test failures detected');

  if (result.success) {
    success('All tests passed');
  }

  return result.success;
}

async function checkBuild() {
  section('Checking Production Build');

  info('Running production build (this may take a minute)...');
  const result = await runCommand('npm run build', 'Build failed');

  if (result.success) {
    success('Build successful');
  }

  return result.success;
}

async function checkDependencies() {
  section('Checking Dependencies');

  info('Checking for outdated dependencies...');
  try {
    const { stdout } = await execAsync('npm outdated || true');
    if (stdout.trim()) {
      warning('Some dependencies are outdated:');
      console.log(stdout);
      info('Run "npm update" to update dependencies');
    } else {
      success('All dependencies are up to date');
    }
  } catch (_err) {
    // npm outdated returns non-zero when there are outdated packages
    // This is expected, so we don't treat it as an error
  }

  info('Checking for security vulnerabilities...');
  const auditResult = await runCommand(
    'npm audit --omit=dev --audit-level=moderate',
    'Security vulnerabilities found'
  );

  if (!auditResult.success) {
    warning('Run "npm audit fix" to fix vulnerabilities');
  } else {
    success('No security vulnerabilities found');
  }

  return true;
}

async function checkGitStatus() {
  section('Checking Git Status');

  info('Checking for uncommitted changes...');
  const statusResult = await execAsync('git status --porcelain');

  if (statusResult.stdout.trim()) {
    warning('You have uncommitted changes:');
    console.log(statusResult.stdout);
    info('Commit changes before deploying');
  } else {
    success('Working directory is clean');
  }

  info('Checking current branch...');
  const branchResult = await execAsync('git branch --show-current');
  const currentBranch = branchResult.stdout.trim();

  if (currentBranch === 'main' || currentBranch === 'master') {
    success(`On ${currentBranch} branch`);
  } else {
    warning(`On ${currentBranch} branch (typically deploy from main/master)`);
  }

  return true;
}

async function printSummary() {
  section('Summary');

  if (hasErrors) {
    error('\nDeployment readiness: FAILED');
    error('Fix all errors above before deploying to production');
    process.exit(1);
  } else if (hasWarnings) {
    warning('\nDeployment readiness: PASSED WITH WARNINGS');
    warning('Review warnings above - they may impact production');
    info('\nYou can proceed with deployment, but address warnings soon');
  } else {
    success('\nDeployment readiness: PASSED');
    success('All checks passed! Ready to deploy to production');
    info('\nNext steps:');
    info('1. Review PRODUCTION_DEPLOYMENT_GUIDE.md');
    info('2. Ensure all environment variables are set in Vercel');
    info('3. Deploy via: git push origin main');
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.blue);
  log('Pre-Deployment Validation Check', colors.blue);
  log('='.repeat(60) + '\n', colors.blue);

  info('This script validates your application is ready for production deployment');
  info('Estimated time: 2-3 minutes\n');

  try {
    // Run all checks
    await checkEnvironmentVariables();
    await checkDatabaseConnection();
    await checkTypeScript();
    await checkLinting();
    await checkTests();
    await checkBuild();
    await checkDependencies();
    await checkGitStatus();

    // Print summary
    await printSummary();
  } catch (err) {
    error(`\nUnexpected error during validation: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
main();
