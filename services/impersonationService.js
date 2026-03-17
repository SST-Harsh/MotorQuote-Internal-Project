import api from '@/utils/api';

/**
 * Impersonation Service
 * Handles all impersonation-related API calls
 */

const impersonationService = {
  /**
   * Start impersonating a user
   * @param {string} userId - Target user ID to impersonate
   * @returns {Promise<Object>} Impersonation session data with new token
   */
  async startImpersonation(userId) {
    try {
      const response = await api.post(`/admin/impersonate/${userId}`);
      console.log('[Impersonation] Started:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Impersonation] Start failed:', error);
      throw error;
    }
  },

  /**
   * Exit impersonation and restore original admin session
   * @returns {Promise<Object>} Restored admin session data
   */
  async exitImpersonation() {
    try {
      const response = await api.post('/admin/exit-impersonation');
      console.log('[Impersonation] Exited:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Impersonation] Exit failed:', error);
      throw error;
    }
  },

  /**
   * Get current impersonation status
   * @returns {Promise<Object>} Current impersonation status
   */
  async getImpersonationStatus() {
    try {
      const response = await api.get('/admin/impersonation/status');
      return response.data;
    } catch (error) {
      console.error('[Impersonation] Status check failed:', error);
      throw error;
    }
  },

  /**
   * Get impersonation history
   * @param {Object} params - Query parameters (page, limit, user_id)
   * @returns {Promise<Object>} Impersonation history with pagination
   */
  async getImpersonationHistory(params = {}) {
    try {
      const response = await api.get('/admin/impersonation/history', { params });
      return response.data;
    } catch (error) {
      console.error('[Impersonation] History fetch failed:', error);
      throw error;
    }
  },

  /**
   * Get all active impersonation sessions (super_admin only)
   * @returns {Promise<Object>} List of active impersonation sessions
   */
  async getActiveImpersonations() {
    try {
      const response = await api.get('/admin/impersonation/active');
      return response.data;
    } catch (error) {
      console.error('[Impersonation] Active sessions fetch failed:', error);
      throw error;
    }
  },
};

export default impersonationService;
