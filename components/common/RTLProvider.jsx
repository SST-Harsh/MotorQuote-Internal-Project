'use client';

import { useEffect } from 'react';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']; // Arabic, Hebrew, Persian, Urdu

export default function RTLProvider({ children, locale }) {
  useEffect(() => {
    const isRTL = RTL_LANGUAGES.includes(locale);

    // Set document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;

    // Add RTL class to body for additional styling if needed
    if (isRTL) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    // Update CSS custom properties for RTL
    if (isRTL) {
      document.documentElement.style.setProperty('--text-align-start', 'right');
      document.documentElement.style.setProperty('--text-align-end', 'left');
      document.documentElement.style.setProperty('--flex-direction', 'row-reverse');
    } else {
      document.documentElement.style.setProperty('--text-align-start', 'left');
      document.documentElement.style.setProperty('--text-align-end', 'right');
      document.documentElement.style.setProperty('--flex-direction', 'row');
    }
  }, [locale]);

  return <>{children}</>;
}
