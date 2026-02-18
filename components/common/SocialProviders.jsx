'use client';

import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/utils/msalConfig';

// Initialize MSAL instance outside of the component to ensure it's a singleton
// We only do this if we are in the browser
const msalInstance = typeof window !== 'undefined' ? new PublicClientApplication(msalConfig) : null;

export default function SocialProviders({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const azureClientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;

  // Initialize MSAL on the client side
  useEffect(() => {
    if (msalInstance && typeof window !== 'undefined') {
      // Check if already initialized to avoid re-init
      // MSAL v3 handles multiple init calls generally, but it's cleaner to check
      msalInstance.initialize().catch((err) => {
        // If it's already initialized, just ignore the error
        if (!err.message.includes('already exists')) {
          console.warn('MSAL initialization failed:', err);
        }
      });
    }

    if (!googleClientId) {
      console.warn('Google Client ID is missing. Google Login will be disabled.');
    }
    if (!azureClientId) {
      console.warn('Azure AD Client ID is missing. Microsoft Login will be disabled.');
    }
  }, [googleClientId, azureClientId]);

  const wrapProviders = (content) => {
    let wrappedContent = content;

    // Wrap with MSAL if client ID exists
    if (azureClientId && msalInstance) {
      wrappedContent = <MsalProvider instance={msalInstance}>{wrappedContent}</MsalProvider>;
    }

    // Wrap with Google if client ID exists
    if (googleClientId) {
      wrappedContent = (
        <GoogleOAuthProvider clientId={googleClientId}>{wrappedContent}</GoogleOAuthProvider>
      );
    }

    return wrappedContent;
  };

  return wrapProviders(children);
}
