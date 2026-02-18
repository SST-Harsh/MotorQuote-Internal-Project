import Swal from 'sweetalert2';

/**
 * Toast Notification Utility
 * Centralized toast notifications to avoid code duplication
 */

const DEFAULT_CONFIG = {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: true,
};

/**
 * Show a toast notification
 * @param {string} type - Icon type: 'success', 'error', 'warning', 'info', 'question'
 * @param {string} title - Toast title
 * @param {string} text - Toast message (optional)
 * @param {number} timer - Auto-close timer in ms (default: 5000)
 * @param {Object} customConfig - Additional Swal config to override defaults
 */
export const showToast = (type, title, text = '', timer = 5000, customConfig = {}) => {
  return Swal.fire({
    ...DEFAULT_CONFIG,
    icon: type,
    title,
    text,
    timer,
    ...customConfig,
  });
};

/**
 * Show success toast
 */
export const showSuccess = (title, text = '', timer = 3000) => {
  return showToast('success', title, text, timer);
};

/**
 * Show error toast
 */
export const showError = (title, text = '', timer = 5000) => {
  return showToast('error', title, text, timer);
};

/**
 * Show warning toast
 */
export const showWarning = (title, text = '', timer = 4000) => {
  return showToast('warning', title, text, timer);
};

/**
 * Show info toast
 */
export const showInfo = (title, text = '', timer = 4000) => {
  return showToast('info', title, text, timer);
};

/**
 * Show confirmation dialog (not a toast)
 */
export const showConfirm = async (
  title,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel'
) => {
  return Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: 'rgb(var(--color-primary))',
    cancelButtonColor: 'rgb(var(--color-error))',
  });
};

/**
 * Show loading toast
 */
export const showLoading = (title = 'Loading...', text = 'Please wait') => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Close any active Swal
 */
export const closeToast = () => {
  Swal.close();
};

export default {
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showLoading,
  closeToast,
};
