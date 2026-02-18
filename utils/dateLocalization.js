/**
 * Utility for localizing dates, times, and numbers strings.
 * Uses native Intl APIs.
 */

const DateLocalizationUtil = {
  /**
   * Format a date string or Date object into localized date string.
   * @param {Date|string} date
   * @param {string} locale - e.g. 'en', 'es'
   * @param {Object} options - formatting options
   * @returns {string}
   */
  formatDate: (date, locale = 'en', options = {}) => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      }).format(dateObj);
    } catch (e) {
      console.error('Date formatting error:', e);
      return String(date);
    }
  },

  /**
   * Format a date string or Date object into localized time string.
   * @param {Date|string} date
   * @param {string} locale
   * @returns {string}
   */
  formatTime: (date, locale = 'en') => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(dateObj);
    } catch (e) {
      console.error('Time formatting error:', e);
      return String(date);
    }
  },

  /**
   * Format a date object into localized date + time string.
   * @param {Date|string} date
   * @param {string} locale
   * @returns {string}
   */
  formatDateTime: (date, locale = 'en') => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(dateObj);
    } catch (e) {
      console.error('DateTime formatting error:', e);
      return String(date);
    }
  },

  /**
   * Format relative time (e.g. "2 hours ago").
   * Uses Intl.RelativeTimeFormat.
   * @param {Date|string} date
   * @param {string} locale
   * @returns {string}
   */
  formatRelativeTime: (date, locale = 'en') => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((dateObj - now) / 1000);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
      };

      for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        if (Math.abs(diffInSeconds) >= secondsInUnit || unit === 'second') {
          const value = Math.round(diffInSeconds / secondsInUnit);
          return rtf.format(value, unit);
        }
      }
      return '';
    } catch (e) {
      console.error('Relative time formatting error:', e);
      return String(date);
    }
  },

  /**
   * Format number according to locale.
   * @param {number} number
   * @param {string} locale
   * @returns {string}
   */
  formatNumber: (number, locale = 'en') => {
    if (number === undefined || number === null || isNaN(number)) return '';
    return new Intl.NumberFormat(locale).format(number);
  },

  /**
   * Format currency amount.
   * @param {number} amount
   * @param {string} locale
   * @param {string} currency - ISO 4217 code like 'USD', 'EUR'
   * @returns {string}
   */
  formatCurrency: (amount, locale = 'en', currency = 'USD') => {
    if (amount === undefined || amount === null || isNaN(amount)) return '';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      // Fallback for invalid currency codes
      return new Intl.NumberFormat(locale).format(amount) + ' ' + currency;
    }
  },
};

export default DateLocalizationUtil;
