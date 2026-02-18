/**
 * Social Authentication Helper Functions
 * Utilities for handling OAuth authentication flow
 */

/**
 * Extract OAuth token from NextAuth session
 * @param {Object} session - NextAuth session object
 * @returns {Object} Object containing idToken and accessToken
 */
export const extractOAuthTokens = (session) => {
  if (!session) {
    throw new Error('No session provided');
  }

  const { idToken, accessToken } = session;

  if (!idToken || !accessToken) {
    throw new Error('Missing OAuth tokens in session');
  }

  return { idToken, accessToken };
};

/**
 * Validate OAuth provider response
 * @param {Object} response - OAuth provider response
 * @returns {boolean} True if valid
 */
export const validateOAuthResponse = (response) => {
  if (!response) {
    return false;
  }

  // Check for required fields
  if (!response.user || !response.user.email) {
    return false;
  }

  return true;
};

/**
 * Handle OAuth errors and return user-friendly messages
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const handleOAuthError = (error) => {
  const errorMessage = error?.message || '';

  // Map common OAuth errors to user-friendly messages
  const errorMap = {
    OAuthSignin: 'Error occurred during sign in with provider',
    OAuthCallback: 'Error occurred during callback from provider',
    OAuthCreateAccount: 'Could not create account with provider',
    EmailCreateAccount: 'Could not create account with email',
    Callback: 'Error in callback handler',
    OAuthAccountNotLinked: 'Account already exists with different provider',
    EmailSignin: 'Error sending verification email',
    CredentialsSignin: 'Invalid credentials provided',
    SessionRequired: 'Please sign in to access this page',
    AccessDenied: 'Access denied. You do not have permission to sign in.',
  };

  // Check if error message matches known error types
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return message;
    }
  }

  // Return generic error message
  return 'An error occurred during authentication. Please try again.';
};

/**
 * Map NextAuth provider names to backend provider names
 * @param {string} provider - NextAuth provider name
 * @returns {string} Backend provider name
 */
export const mapProviderName = (provider) => {
  const providerMap = {
    google: 'google',
    'azure-ad': 'microsoft',
    microsoft: 'microsoft',
  };

  return providerMap[provider] || provider;
};
