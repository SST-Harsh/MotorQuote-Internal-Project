/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 */

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for the measurement
 * @returns {Function} Wrapped function
 */
export const measurePerformance = (fn, label) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      const duration = end - start;

      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ [Performance] ${label}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;

      if (process.env.NODE_ENV === 'development') {
        console.error(`⏱️ [Performance] ${label} (failed): ${duration.toFixed(2)}ms`);
      }

      throw error;
    }
  };
};

/**
 * Log page load performance
 */
export const logPagePerformance = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 [Performance Metrics]');
        console.log(`   Page Load Time: ${pageLoadTime}ms`);
        console.log(`   Connect Time: ${connectTime}ms`);
        console.log(`   Render Time: ${renderTime}ms`);
      }

      // You can send these metrics to an analytics service
      // analytics.track('page_performance', { pageLoadTime, connectTime, renderTime });
    }, 0);
  });
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images
 * @param {string} selector - CSS selector for images
 */
export const lazyLoadImages = (selector = 'img[data-src]') => {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll(selector);

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
};

/**
 * Check if browser supports WebP
 * @returns {Promise<boolean>}
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Preload critical resources
 * @param {string[]} urls - Array of URLs to preload
 * @param {string} as - Resource type (script, style, image, etc.)
 */
export const preloadResources = (urls, as = 'fetch') => {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Monitor long tasks (> 50ms)
 */
export const monitorLongTasks = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ [Long Task] Duration: ${entry.duration.toFixed(2)}ms`);
        }
        // You can send this to analytics
        // analytics.track('long_task', { duration: entry.duration });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.error('Long task monitoring not supported:', error);
  }
};

export default {
  measurePerformance,
  logPagePerformance,
  debounce,
  throttle,
  lazyLoadImages,
  supportsWebP,
  preloadResources,
  monitorLongTasks,
};
