/**
 * Internationalization Utilities
 * Provides formatting functions for dates, times, numbers, and currencies
 * based on user's locale preference
 */

/**
 * Get current locale from localStorage or default to 'en'
 */
export const getCurrentLocale = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('language') || 'en';
};

/**
 * Get date format from localStorage or default
 */
export const getDateFormat = () => {
  if (typeof window === 'undefined') return 'MM/DD/YYYY';
  return localStorage.getItem('date_format') || 'MM/DD/YYYY';
};

/**
 * Convert template format (DD/MM/YYYY) to Intl options
 */
const getIntlOptionsFromFormat = (format) => {
  switch (format) {
    case 'DD/MM/YYYY':
      return { day: '2-digit', month: '2-digit', year: 'numeric' };
    case 'MM/DD/YYYY':
      return { month: '2-digit', day: '2-digit', year: 'numeric' };
    case 'YYYY-MM-DD':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    default:
      return { day: 'numeric', month: 'short', year: 'numeric' };
  }
};

/**
 * Default date format options by locale
 */
const DATE_FORMATS = {
  en: { day: '2-digit', month: '2-digit', year: 'numeric' },
  es: { day: '2-digit', month: '2-digit', year: 'numeric' },
  ar: { day: '2-digit', month: '2-digit', year: 'numeric' },
  fr: { day: '2-digit', month: '2-digit', year: 'numeric' },
  de: { day: '2-digit', month: '2-digit', year: 'numeric' },
  hi: { day: '2-digit', month: '2-digit', year: 'numeric' },
  gu: { day: '2-digit', month: '2-digit', year: 'numeric' },
};

/**
 * Format date according to user's locale and format preference
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();
  const format = getDateFormat();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  try {
    // If it's a standard format we recognize, use simple string replacement or Intl with specific options
    const options = getIntlOptionsFromFormat(format);
    return new Intl.DateTimeFormat(currentLocale, options).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format date and time according to user's locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  try {
    const format = getDateFormat();
    const dateOptions = getIntlOptionsFromFormat(format);
    return new Intl.DateTimeFormat(currentLocale, {
      ...dateOptions,
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('DateTime formatting error:', error);
    return dateObj.toLocaleString();
  }
};

/**
 * Format time only according to user's locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted time string
 */
export const formatTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(currentLocale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Time formatting error:', error);
    return dateObj.toLocaleTimeString();
  }
};

/**
 * Format number according to user's locale
 * @param {number} number - Number to format
 * @param {string} locale - Optional locale override
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, locale = null, decimals = 2) => {
  if (number === null || number === undefined) return '';

  const currentLocale = locale || getCurrentLocale();
  const num = typeof number === 'string' ? parseFloat(number) : number;

  if (isNaN(num)) return '';

  try {
    return new Intl.NumberFormat(currentLocale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (error) {
    console.error('Number formatting error:', error);
    return num.toFixed(decimals);
  }
};

/**
 * Currency symbols by locale
 */
const CURRENCY_SYMBOLS = {
  en: { code: 'USD', symbol: '$' },
  es: { code: 'EUR', symbol: '€' },
  ar: { code: 'SAR', symbol: 'ر.س' },
  fr: { code: 'EUR', symbol: '€' },
  de: { code: 'EUR', symbol: '€' },
  hi: { code: 'INR', symbol: '₹' },
  gu: { code: 'INR', symbol: '₹' },
};

/**
 * Format currency according to user's locale
 * @param {number} amount - Amount to format
 * @param {string} locale - Optional locale override
 * @param {string} currencyCode - Optional currency code override (USD, EUR, SAR, etc.)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, locale = null, currencyCode = null) => {
  if (amount === null || amount === undefined) return '';

  const currentLocale = locale || getCurrentLocale();
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '';

  const currency = currencyCode || CURRENCY_SYMBOLS[currentLocale]?.code || 'USD';

  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currency,
    }).format(num);
  } catch (error) {
    console.error('Currency formatting error:', error);
    const symbol = CURRENCY_SYMBOLS[currentLocale]?.symbol || '$';
    return `${symbol}${num.toFixed(2)}`;
  }
};

/**
 * Format currency in compact notation (e.g., $1.2M)
 * @param {number} amount - Amount to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted compact currency string
 */
export const formatCompactCurrency = (amount, locale = null) => {
  if (amount === null || amount === undefined) return '';
  const currentLocale = locale || getCurrentLocale();
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  const currency = CURRENCY_SYMBOLS[currentLocale]?.code || 'USD';

  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch (error) {
    return formatCurrency(amount, currentLocale);
  }
};

/**
 * Format number in compact notation (e.g., 1.2M)
 * @param {number} value - Value to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted compact number string
 */
export const formatCompactNumber = (value, locale = null) => {
  if (value === null || value === undefined) return '';
  const currentLocale = locale || getCurrentLocale();
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';

  try {
    return new Intl.NumberFormat(currentLocale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  } catch (error) {
    return formatNumber(value, currentLocale);
  }
};

/**
 * Format percentage according to user's locale
 * @param {number} value - Value to format (0.15 = 15%)
 * @param {string} locale - Optional locale override
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, locale = null, decimals = 1) => {
  if (value === null || value === undefined) return '';

  const currentLocale = locale || getCurrentLocale();
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '';

  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return `${(num * 100).toFixed(decimals)}%`;
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (Math.abs(diffInSeconds) < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (Math.abs(diffInSeconds) < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
};

/**
 * Get locale-specific examples for documentation
 */
export const getLocaleExamples = (locale = null) => {
  const currentLocale = locale || getCurrentLocale();
  const now = new Date();
  const sampleAmount = 1234.56;

  return {
    date: formatDate(now, currentLocale),
    dateTime: formatDateTime(now, currentLocale),
    time: formatTime(now, currentLocale),
    number: formatNumber(sampleAmount, currentLocale),
    currency: formatCurrency(sampleAmount, currentLocale),
    percentage: formatPercentage(0.1556, currentLocale),
    relativeTime: formatRelativeTime(new Date(now - 7200000), currentLocale), // 2 hours ago
  };
};

/**
 * Translate user role
 * @param {string} role - Role string or key
 * @param {function} t - Translation function from useTranslation
 * @returns {string} Translated role
 */
export const translateUserRole = (role, t) => {
  if (!role) return '';
  const r = String(role).toLowerCase().trim();
  if (r === 'super_admin' || r === 'superadmin' || r === 'super admin')
    return t('roles.super_admin');
  if (r === 'admin') return t('roles.admin');
  if (r === 'dealer_manager' || r === 'dealer manager') return t('roles.dealer_manager');
  if (r === 'user') return t('roles.user');
  if (r === 'admin_work' || r === 'admin work') return t('roles.admin_work');
  // Fallback: capitalize
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

/**
 * Translate User Name (handles role-as-username)
 * @param {string} userName - The name to translate
 * @param {function} tCommon - Translation function (usually from common namespace)
 * @returns {string} Translated username or original
 */
export const translateUserName = (userName, tCommon) => {
  if (!userName) return 'Admin';

  const name = String(userName).trim();

  if (name.startsWith('common:roles.')) {
    const roleKey = name.replace('common:roles.', 'roles.');
    return tCommon(roleKey);
  }

  const roleMap = {
    'super admin': 'roles.super_admin',
    super: 'roles.super_admin',
    admin: 'roles.admin',
    'dealer manager': 'roles.dealer_manager',
    dealer_manager: 'roles.dealer_manager',
    'admin work': 'roles.admin_work',
    'dealer work': 'roles.dealer_work',
    'dealer worker': 'roles.dealer_work',
    dealer: 'roles.dealer',
    user: 'roles.user',
    superadmin: 'roles.super_admin',
  };

  const lowerName = name.toLowerCase();
  for (const [roleName, translationKey] of Object.entries(roleMap)) {
    if (lowerName === roleName) {
      return tCommon(translationKey);
    }
  }

  return userName;
};
