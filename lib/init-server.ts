/**
 * Server startup initialization
 * Run this file to validate environment and initialize server
 */

import { validateEnv } from './validate-env';

// Validate environment variables on server startup
try {
  validateEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Environment validation failed');
  process.exit(1);
}

export {};
