import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get current locale from localStorage or default to 'en'
 */
export const getCurrentLocale = () => 'en';

/**
 * Get date format from localStorage or default
 */
export const getDateFormat = () => {
  if (typeof window === 'undefined') return 'MM/DD/YYYY';
  // Check both user_preferences object and individual key
  const prefs = localStorage.getItem('user_preferences');
  if (prefs) {
    try {
      const parsed = JSON.parse(prefs);
      if (parsed.date_format) return parsed.date_format;
    } catch (e) {}
  }
  return localStorage.getItem('date_format') || 'MM/DD/YYYY';
};

/**
 * Get current timezone from localStorage or default
 */
export const getTimezone = () => {
  if (typeof window === 'undefined') return 'UTC';
  const prefs = localStorage.getItem('user_preferences');
  if (prefs) {
    try {
      const parsed = JSON.parse(prefs);
      if (parsed.timezone) return parsed.timezone;
    } catch (e) {}
  }
  return 'UTC';
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
};

/**
 * Format date according to user's locale and format preference
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = null) => {
  if (!date) return '';

  const format = getDateFormat();
  const tz = getTimezone();
  const dateObj = dayjs(date).tz(tz);

  if (!dateObj.isValid()) return '';

  return dateObj.format(format);
};

/**
 * Format date and time according to user's locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = null) => {
  if (!date) return '';

  const tz = getTimezone();
  const dateObj = dayjs(date).tz(tz);
  if (!dateObj.isValid()) return '';

  const format = getDateFormat();
  // Add time for DateTime
  const dateTimeFormat = `${format} hh:mm A`;
  return dateObj.format(dateTimeFormat);
};

/**
 * Format time only according to user's locale
 * @param {Date|string} date - Date to format
 * @param {string} locale - Optional locale override
 * @returns {string} Formatted time string
 */
export const formatTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = 'en';
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

  const currentLocale = 'en';
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

  const currentLocale = 'en';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '';

  const currency = currencyCode || 'USD';

  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currency,
    }).format(num);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `$${num.toFixed(2)}`;
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
  const currentLocale = 'en';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';

  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: 'USD',
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
  const currentLocale = 'en';
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

  const currentLocale = 'en';
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

  const currentLocale = 'en';
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
  const currentLocale = 'en';
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
