/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_API_URL'];

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: 'development',
};

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check optional variables
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set, using default: ${defaultValue}`);
      process.env[varName] = defaultValue;
    }
  });

  // Log warnings
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Environment Variable Warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Throw error if required variables are missing
  if (missing.length > 0) {
    const errorMessage = `
❌ Missing required environment variables:
${missing.map((v) => `   - ${v}`).join('\n')}

Please create a .env.local file with these variables.
See .env.example for reference.
    `.trim();

    throw new Error(errorMessage);
  }

  // Log success in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
  }
};

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export const getEnv = (key, fallback = '') => {
  return process.env[key] || fallback;
};

/**
 * Check if running in production
 * @returns {boolean}
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if running in test
 * @returns {boolean}
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

export default {
  validateEnv,
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
};
