const localizationService = {
  /**
   * Fetches translations from local JSON files in public/locales
   * @param {string} locale - e.g., 'en', 'es', 'ar'
   * @param {string} category - e.g., 'common', 'nav', 'dashboard'
   * @returns {Promise<Object>} Transformed translations
   */
  getTranslations: async (locale, category) => {
    try {
      console.log(`[Localization] Fetching local JSON for ${locale}/${category}`);
      const response = await fetch(`/locales/${locale}/${category}.json`);

      if (!response.ok) {
        console.warn(`[Localization] Local file not found: /locales/${locale}/${category}.json`);
        return {};
      }

      const localData = await response.json();

      // Transform nested JSON into dot-notation if needed,
      // but usually we just want to return it under the namespace
      const transformed = transformTranslations(localData, category);
      console.log(`[Localization] Loaded ${locale}/${category}:`, transformed);
      return transformed;
    } catch (error) {
      console.error(
        `[Localization] Failed to load local translations for ${locale}/${category}:`,
        error
      );
      return {};
    }
  },

  /**
   * Hardcoded list of supported locales (Frontend only)
   */
  getLocales: async () => {
    return ['en', 'es', 'ar', 'hi', 'gu'];
  },

  /**
   * Hardcoded list of available categories/namespaces
   */
  getCategories: async () => {
    return ['common', 'nav', 'dashboard'];
  },

  // ==========================================
  // USER PREFERENCES (LocalStorage Only)
  // ==========================================

  getLanguagePreference: async () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language');
    }
    return null;
  },

  updateLanguagePreference: async (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      return true;
    }
    return false;
  },

  // ==========================================
  // DEPRECATED / REMOVED BACKEND METHODS
  // ==========================================

  createTranslation: async () => {
    console.warn('createTranslation is disabled in JSON-only mode');
    return null;
  },
  updateTranslation: async () => {
    console.warn('updateTranslation is disabled in JSON-only mode');
    return null;
  },
  deleteTranslation: async () => {
    console.warn('deleteTranslation is disabled in JSON-only mode');
    return null;
  },
  clearCache: async () => {
    return true;
  },
  translateText: async (text) => {
    return text;
  }, // No-op fallback
  translateBatch: async (texts) => {
    return texts;
  }, // No-op fallback
  detectLanguage: async () => {
    return null;
  },
};

/**
 * Transforms JSON data into the format expected by the LanguageContext.
 * If data is already nested, it can either flatten it or keep it as is.
 * Our LanguageContext expects { namespace: { key: value } }
 */
const transformTranslations = (data, category) => {
  const result = {};

  const addKey = (key, value) => {
    if (!key) return;

    const fullKey = category && !key.startsWith(category + '.') ? `${category}.${key}` : key;
    const parts = fullKey.split('.');
    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  };

  const processItems = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;

    Object.entries(obj).forEach(([k, v]) => {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        processItems(v, fullKey);
      } else if (typeof v === 'string') {
        addKey(fullKey, v);
      }
    });
  };

  processItems(data);
  return result;
};

export default localizationService;
