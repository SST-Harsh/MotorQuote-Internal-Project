'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePreference } from './PreferenceContext';
import { usePathname } from 'next/navigation';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { preferences, updatePreference } = usePreference();
  const [theme, setTheme] = useState('light');
  const pathname = usePathname();

  // Routes that should ALWAYS be light theme
  const isAuthRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/verify-otp') ||
    pathname.startsWith('/reset-password');

  // Initialize theme from preferences when they load
  useEffect(() => {
    if (isAuthRoute) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
      return;
    }

    if (preferences?.theme) {
      const currentTheme = preferences.theme;
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [preferences?.theme, isAuthRoute, pathname]);

  const changeTheme = async (newTheme) => {
    // Don't allow changing theme if we are on an auth route (though UI shouldn't allow it)
    if (isAuthRoute) return;

    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    // Sync with API/Global preferences
    await updatePreference('theme', newTheme);
  };

  // Prepare context value
  const value = {
    theme,
    changeTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
