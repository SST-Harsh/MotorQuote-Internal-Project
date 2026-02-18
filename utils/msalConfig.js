export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Request scopes for the idToken and accessToken
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

let msalInstance = null;

export const getMsalInstance = async () => {
  if (typeof window === 'undefined') return null;

  if (!msalInstance) {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
};
