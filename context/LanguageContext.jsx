'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import localizationService from '@/services/localizationService';

const LanguageContext = createContext();

// Supported languages and their configuration
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', dir: 'ltr' },
];

const RTL_LANGUAGES = ['ar'];

const NAMESPACE_ALIASES = {
  statistics: 'dash',
  stats: 'dash',
  settings: 'common',
};

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState({});
  const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_LANGUAGES);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        let startLang = 'en';

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlLocale = params.get('locale');
          const availableLocales = DEFAULT_LANGUAGES.map((l) => l.code);

          if (urlLocale && availableLocales.includes(urlLocale)) {
            startLang = urlLocale;
          } else {
            const storedLang = localStorage.getItem('language');
            if (storedLang && availableLocales.includes(storedLang)) {
              startLang = storedLang;
            }
          }
        }

        await loadTranslations(startLang);
        setLocale(startLang);
        applyLanguageSettings(startLang);
      } catch (err) {
        console.error('Language initialization failed', err);
        await loadTranslations('en');
        setLocale('en');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const LOCAL_CATEGORIES = ['common', 'nav', 'dashboard', 'auth', 'users'];

  const loadTranslations = async (langCode) => {
    try {
      console.log(`[LanguageContext] Loading local translations for: ${langCode}`);

      const translationPromises = LOCAL_CATEGORIES.map((cat) =>
        localizationService.getTranslations(langCode, cat)
      );

      const jsonResults = await Promise.all(translationPromises);

      const mergedTranslations = {};
      jsonResults.forEach((translationsSubset) => {
        if (!translationsSubset) return;

        Object.keys(translationsSubset).forEach((ns) => {
          if (typeof translationsSubset[ns] === 'object' && translationsSubset[ns] !== null) {
            mergedTranslations[ns] = {
              ...(mergedTranslations[ns] || {}),
              ...translationsSubset[ns],
            };
          } else if (translationsSubset[ns] !== undefined) {
            mergedTranslations[ns] = translationsSubset[ns];
          }
        });
      });

      console.log(
        `[LanguageContext] Final ${langCode} translations (JSON + Overrides):`,
        mergedTranslations
      );
      setTranslations(mergedTranslations);
    } catch (error) {
      console.error(`Failed to load translations for ${langCode}`, error);
    }
  };

  const applyLanguageSettings = (langCode) => {
    const language = DEFAULT_LANGUAGES.find((l) => l.code === langCode);
    if (!language) return;

    document.documentElement.lang = langCode;
    document.documentElement.dir = language.dir;

    if (language.dir === 'rtl') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  const changeLanguage = async (newLocale) => {
    if (newLocale === locale) return;

    setIsLoading(true);

    try {
      await loadTranslations(newLocale);

      setLocale(newLocale);
      localStorage.setItem('language', newLocale);
      applyLanguageSettings(newLocale);

      router.refresh();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = React.useCallback(
    (key, namespace = 'common', params = {}) => {
      if (!key || typeof key !== 'string') return key;

      let actualNamespace = namespace;
      let actualKey = key;

      if (key.includes(':')) {
        const parts = key.split(':');
        actualNamespace = parts[0];
        actualKey = parts[1];
      } else if (key.includes('.')) {
        const firstPart = key.split('.')[0];
        const mappedPart = NAMESPACE_ALIASES[firstPart] || firstPart;
        if (mappedPart === actualNamespace) {
          actualKey = key.split('.').slice(1).join('.');
        }
      }

      const resolveInNamespace = (ns, k) => {
        let data = translations[ns];
        if (!data) {
          const aliased = NAMESPACE_ALIASES[ns];
          if (aliased) data = translations[aliased];
        }
        if (!data) return null;

        const bits = k.split('.');
        let value = data;
        for (const b of bits) {
          if (value && typeof value === 'object' && b in value) {
            value = value[b];
          } else {
            return null;
          }
        }
        return value;
      };

      let result = resolveInNamespace(actualNamespace, actualKey);

      if (result === null && !key.includes(':') && key.includes('.')) {
        const parts = key.split('.');
        const potentialNS = parts[0];
        const mappedNS = NAMESPACE_ALIASES[potentialNS] || potentialNS;

        if (mappedNS !== actualNamespace && (translations[potentialNS] || translations[mappedNS])) {
          result = resolveInNamespace(mappedNS, parts.slice(1).join('.'));
        }
      }

      // 4. Final Fallback: Try 'common' namespace with the original key
      if (result === null && actualNamespace !== 'common') {
        result = resolveInNamespace('common', key);
      }

      if (result === null) return key;

      if (typeof result === 'string' && Object.keys(params).length > 0) {
        return result.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match;
        });
      }

      if (typeof result === 'string' || typeof result === 'number') return result;

      return key;
    },
    [translations]
  );

  const currentLanguage = supportedLanguages.find((l) => l.code === locale) || DEFAULT_LANGUAGES[0];
  const isRTL = RTL_LANGUAGES.includes(locale);

  const value = {
    locale,
    currentLanguage,
    supportedLanguages,
    isRTL,
    isLoading,
    changeLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation(namespace = 'common') {
  const { t, isLoading } = useLanguage();

  const tWrapper = React.useCallback(
    (key, params) => {
      return t(key, namespace, params);
    },
    [t, namespace]
  );

  return {
    t: tWrapper,
    isLoading,
  };
}
