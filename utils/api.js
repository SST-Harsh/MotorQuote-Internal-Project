import axios from 'axios';
import Cookies from 'js-cookie';
import { showError, showWarning } from './toast';
import { logAuditEntry } from './auditLogger';

// ============================================
// Configuration
// ============================================
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000, // 30 seconds
};

const isDevelopment = process.env.NODE_ENV === 'development';
const isBrowser = typeof window !== 'undefined';

// ============================================
// Axios Instance
// ============================================
const api = axios.create(API_CONFIG);

// ============================================
// Helper Functions
// ============================================

/**
 * Safely get item from localStorage (SSR-safe)
 */
const getStorageItem = (key) => {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Safely set item in localStorage (SSR-safe)
 */
const setStorageItem = (key, value) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

/**
 * Safely remove item from localStorage (SSR-safe)
 */
const removeStorageItem = (key) => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

/**
 * Get stored user data
 */
const getStoredUser = () => {
  if (!isBrowser) return null;
  try {
    const userStr = getStorageItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
const clearAuthData = () => {
  removeStorageItem('authToken');
  removeStorageItem('user');
  removeStorageItem('authTokenExpiresAt');
  Cookies.remove('role');
  Cookies.remove('authToken');
};

/**
 * Redirect to login page
 */
const redirectToLogin = () => {
  if (isBrowser && !window.location.pathname.includes('/login')) {
    // Small delay to show toast message
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }
};

/**
 * Log request in development
 */
const logRequest = (config) => {
  if (isDevelopment) {
    console.log(
      `%c[API Request] ${config.method?.toUpperCase()} ${config.url}`,
      'color: #4CAF50; font-weight: bold',
      {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params,
      }
    );
  }
};

/**
 * Log response in development
 */
const logResponse = (response) => {
  if (isDevelopment) {
    console.log(
      `%c[API Response] ${response.status} ${response.config.url}`,
      'color: #2196F3; font-weight: bold',
      {
        status: response.status,
        data: response.data,
      }
    );
  }
};

/**
 * Log error in development
 */
const logError = (error) => {
  if (isDevelopment) {
    console.error(
      `%c[API Error] ${error.response?.status || 'Network Error'} ${error.config?.url || 'Unknown'}`,
      'color: #f44336; font-weight: bold',
      {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      }
    );
  }
};

// ============================================
// Error Handlers
// ============================================

/**
 * Handle 401 Unauthorized
 */
const handle401Error = (error) => {
  clearAuthData();

  // Skip toast if it's an auth-related request (handled locally)
  const isAuthRequest = error.config?.url?.match(
    /\/auth\/(login|verify-2fa|send-login-otp|forgot-password|reset-password)/
  );
  const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');

  if (!isAuthRequest && !isLoginPage) {
    showWarning('Session Expired', 'Please log in again to continue.', 3000);
  }

  redirectToLogin();
};

/**
 * Handle 403 Forbidden
 */
const handle403Error = (error) => {
  const user = getStoredUser();
  const url = error.config?.url || 'Unknown URL';

  logAuditEntry('Access Denied', user, `Forbidden access attempt to ${url}`, 'Warning', 'Security');

  // Skip toast if it's an auth-related request (handled locally)
  const isAuthRequest = error.config?.url?.match(
    /\/auth\/(login|verify-2fa|send-login-otp|forgot-password|reset-password)/
  );

  const resData = error.response?.data;
  const message = resData?.message || '';
  const isSuspended =
    resData?.status === 'suspended' ||
    message.toLowerCase().includes('suspended') ||
    message.toLowerCase().includes('account is inactive');

  if (!isAuthRequest) {
    // Only show Access Denied if it's NOT a suspension
    if (!isSuspended) {
      showError('Access Denied', 'You do not have permission to access this resource.');
    } else {
      // Clear data and redirect to login with parameter as per documentation
      clearAuthData();
      if (typeof window !== 'undefined') {
        window.location.href = '/login?suspended=true';
      }
    }

    // Trigger proactive UI permission sync as a secondary safety
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:refresh-permissions'));
    }
  }
};

/**
 * Handle 404 Not Found
 */
const handle404Error = () => {
  showError('Not Found', 'The requested resource was not found.', 4000);
};

/**
 * Handle 400 Bad Request
 */
const handle400Error = (error) => {
  const errorMessage = error.response?.data?.message || 'Invalid request. Please check your input.';
  // Skip toast if it's an auth-related request (handled locally)
  const isAuthRequest = error.config?.url?.match(
    /\/auth\/(login|verify-2fa|send-login-otp|forgot-password|reset-password)/
  );
  if (!isAuthRequest) {
    showError('Invalid Request', errorMessage);
  }
};

/**
 * Handle 500+ Server Errors
 */
const handleServerError = (status) => {
  showError('Server Error', `An error occurred on the server (${status}). Please try again later.`);
};

/**
 * Handle Network Errors
 */
const handleNetworkError = (error) => {
  if (isDevelopment) {
    console.error('Network Error Details:', {
      message: error.message,
      code: error.code,
    });
  }
  showError(
    'Network Error',
    'Unable to connect to the server. Please check your internet connection.'
  );
};

/**
 * Handle Timeout Errors
 */
const handleTimeoutError = () => {
  showError('Request Timeout', 'The request took too long. Please try again.');
};

// ============================================
// Request Interceptor
// ============================================
api.interceptors.request.use(
  (config) => {
    // Attach authentication token if available
    const token = getStorageItem('authToken');
    if (token && !config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    logRequest(config);

    return config;
  },
  (error) => {
    logError(error);
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor
// ============================================
api.interceptors.response.use(
  (response) => {
    // Log response in development
    logResponse(response);
    return response;
  },
  (error) => {
    // Log error in development
    logError(error);

    // Handle different error scenarios
    if (!error.response) {
      // Network error or request timeout
      if (error.code === 'ECONNABORTED') {
        handleTimeoutError();
      } else if (error.code === 'ERR_NETWORK') {
        handleNetworkError(error);
      } else {
        handleNetworkError(error);
      }
    } else {
      // HTTP error responses
      const status = error.response.status;

      switch (status) {
        case 400:
          handle400Error(error);
          break;
        case 401:
          handle401Error(error);
          break;
        case 403:
          handle403Error(error);
          break;
        case 404:
          handle404Error();
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          handleServerError(status);
          break;
        default:
          // Handle other errors with generic message
          if (isDevelopment) {
            showError(
              `Error ${status}`,
              error.response?.data?.message || 'An unexpected error occurred.'
            );
          }
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// API Helper Methods
// ============================================

/**
 * Enhanced API client with utilities
 */
export const apiClient = {
  /**
   * GET request
   */
  get: (url, config = {}) => api.get(url, config),

  /**
   * POST request
   */
  post: (url, data, config = {}) => api.post(url, data, config),

  /**
   * PUT request
   */
  put: (url, data, config = {}) => api.put(url, data, config),

  /**
   * PATCH request
   */
  patch: (url, data, config = {}) => api.patch(url, data, config),

  /**
   * DELETE request
   */
  delete: (url, config = {}) => api.delete(url, config),

  /**
   * Upload file with progress tracking
   */
  upload: (url, formData, onProgress) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },

  /**
   * Download file
   */
  download: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);

      return response;
    } catch (error) {
      showError('Download Failed', 'Unable to download the file.');
      throw error;
    }
  },

  /**
   * Set auth token
   */
  setAuthToken: (token) => {
    if (token) {
      setStorageItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },

  /**
   * Clear auth token
   */
  clearAuthToken: () => {
    clearAuthData();
    delete api.defaults.headers.common['Authorization'];
  },

  /**
   * Get current base URL
   */
  getBaseURL: () => api.defaults.baseURL,

  /**
   * Update base URL dynamically
   */
  setBaseURL: (newBaseURL) => {
    api.defaults.baseURL = newBaseURL;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!getStorageItem('authToken');
  },

  /**
   * Get current user
   */
  getCurrentUser: () => {
    return getStoredUser();
  },
};

// Export default axios instance for backward compatibility
export default api;
