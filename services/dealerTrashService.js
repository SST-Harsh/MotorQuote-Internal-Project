import api from '@/utils/api';

const dealerTrashService = {
  /**
   * Get trash items for dealer
   * @param {Object} params - { type, page, limit }
   */
  getTrashItems: async (params = {}) => {
    try {
      const response = await api.get('/trash', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get trash summary for dealer
   */
  getTrashSummary: async (params = {}) => {
    try {
      const response = await api.get('/trash/summary', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore a quote from trash
   * @param {string} quoteId - The ID of the quote to restore
   */
  restoreQuote: async (quoteId) => {
    try {
      const response = await api.post(`/trash/quote/${quoteId}/restore`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Permanently delete a quote from trash
   * @param {string} quoteId - The ID of the quote to permanently delete
   */
  permanentDeleteQuote: async (quoteId) => {
    try {
      const response = await api.delete(`/trash/quote/${quoteId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore a dealership from trash
   * @param {string} dealershipId - The ID of the dealership to restore
   */
  restoreDealership: async (dealershipId) => {
    try {
      const response = await api.post(`/trash/dealership/${dealershipId}/restore`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Permanently delete a dealership from trash
   * @param {string} dealershipId - The ID of the dealership to permanently delete
   */
  permanentDeleteDealership: async (dealershipId) => {
    try {
      const response = await api.delete(`/trash/dealership/${dealershipId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore a user from trash
   * @param {string} userId - The ID of the user to restore
   */
  restoreUser: async (userId) => {
    try {
      const response = await api.post(`/trash/user/${userId}/restore`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Permanently delete a user from trash
   * @param {string} userId - The ID of the user to permanently delete
   */
  permanentDeleteUser: async (userId) => {
    try {
      const response = await api.delete(`/trash/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default dealerTrashService;
