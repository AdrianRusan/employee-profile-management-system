/**
 * Environment Variable Validation
 * Validates all required environment variables at application startup
 * Fails fast with clear error messages if configuration is invalid
 */

interface EnvVar {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_VARS: EnvVar[] = [
  // Database
  {
    key: 'DATABASE_URL',
    required: true,
    validator: (val) => val.startsWith('postgresql://'),
    errorMessage: 'DATABASE_URL must be a PostgreSQL connection string',
  },

  // Security - Session
  {
    key: 'SESSION_SECRET',
    required: true,
    validator: (val) => val.length >= 32,
    errorMessage: 'SESSION_SECRET must be at least 32 characters long',
  },

  // Security - Encryption
  {
    key: 'ENCRYPTION_KEY',
    required: true,
    validator: (val) => val.length === 64 && /^[0-9a-f]{64}$/i.test(val),
    errorMessage: 'ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)',
  },

  // Application URL
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
  },

  // Optional: AI Integration
  {
    key: 'HUGGINGFACE_API_KEY',
    required: false,
  },

  // Optional: Error Tracking
  {
    key: 'SENTRY_DSN',
    required: false,
  },

  // Optional: Sentry Auth Token (for source maps)
  {
    key: 'SENTRY_AUTH_TOKEN',
    required: false,
  },
];

/**
 * Validates all environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): void {
  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`❌ ${envVar.key} is required but not set`);
      continue;
    }

    // Skip validation for optional missing variables
    if (!value) {
      continue;
    }

    // Run custom validator if provided
    if (envVar.validator && !envVar.validator(value)) {
      errors.push(
        `❌ ${envVar.key} is invalid: ${envVar.errorMessage || 'Validation failed'}`
      );
    }
  }

  // If there are errors, throw with detailed message
  if (errors.length > 0) {
    const errorMessage = [
      '',
      '═══════════════════════════════════════════════════════════',
      '  ⚠️  ENVIRONMENT CONFIGURATION ERROR',
      '═══════════════════════════════════════════════════════════',
      '',
      ...errors,
      '',
      'Please check your .env file and ensure all required variables',
      'are set correctly. See .env.example for reference.',
      '',
      '═══════════════════════════════════════════════════════════',
      '',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log success in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
  }
}

/**
 * Get environment information for debugging
 */
export function getEnvInfo(): Record<string, string> {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    HAS_DATABASE_URL: !!process.env.DATABASE_URL ? 'Yes' : 'No',
    HAS_SESSION_SECRET: !!process.env.SESSION_SECRET ? 'Yes' : 'No',
    HAS_ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY ? 'Yes' : 'No',
    HAS_HUGGINGFACE_KEY: !!process.env.HUGGINGFACE_API_KEY ? 'Yes' : 'No',
    HAS_SENTRY_DSN: !!process.env.SENTRY_DSN ? 'Yes' : 'No',
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
  };
}
