/**
 * Validates required environment variables at startup.
 * Must be called BEFORE NestFactory.create() so the app fails fast
 * with a clear message when configuration is missing.
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // --- Always required ---
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'PORTAL_JWT_SECRET',
    'REDIS_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // --- Optional with defaults (set them so the rest of the app can rely on them) ---
  const optionalDefaults: Record<string, string> = {
    PORT: '3000',
    NODE_ENV: 'development',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    CORS_ORIGINS: 'http://localhost:3001',
    FIELD_ENCRYPTION_KEY: '0'.repeat(64), // dev-only fallback — blocked in production
  };

  for (const [key, defaultValue] of Object.entries(optionalDefaults)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // --- Production-only requirements ---
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    const prodRequired = [
      'MAIL_HOST', 'MAIL_USER', 'MAIL_PASS',
      'S3_ACCESS_KEY', 'S3_SECRET_KEY',
      'FIELD_ENCRYPTION_KEY', 'CORS_ORIGINS',
      'JWT_MOBILE_SECRET',
    ];
    for (const key of prodRequired) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }

    // Block startup if encryption key is the dev fallback
    if (process.env.FIELD_ENCRYPTION_KEY === '0'.repeat(64)) {
      missing.push('FIELD_ENCRYPTION_KEY (cannot use dev fallback in production)');
    }

    // SMSAPI_TOKEN: warn only, do not block startup
    if (!process.env.SMSAPI_TOKEN) {
      warnings.push('SMSAPI_TOKEN is not set — SMS notifications will be unavailable');
    }
  }

  // --- Report ---
  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`[ENV WARNING] ${w}`);
    }
  }

  if (missing.length > 0) {
    console.error('');
    console.error('=== MISSING ENVIRONMENT VARIABLES ===');
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error('');
    console.error('The application cannot start without these variables.');
    console.error('=====================================');
    process.exit(1);
  }
}
