import api from '@/utils/api';

const trashService = {
  /**
   * List all trash items with pagination and type filtering
   * @param {Object} params - { page, limit, type }
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
   * Get summary of trash items by type
   */
  getTrashSummary: async () => {
    try {
      const response = await api.get('/trash/summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restore an item from trash
   * @param {string} itemType - user, quote, dealership, etc.
   * @param {string} itemId - The ID of the item to restore
   */
  restoreItem: async (itemType, itemId) => {
    try {
      const response = await api.post(`/trash/${itemType}/${itemId}/restore`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Permanently delete an item from trash
   * @param {string} itemType - user, quote, dealership, etc.
   * @param {string} itemId - The ID of the item to delete
   */
  permanentDelete: async (itemType, itemId) => {
    try {
      const response = await api.delete(`/trash/${itemType}/${itemId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default trashService;
