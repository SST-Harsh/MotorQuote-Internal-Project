import api from '@/utils/api';

const preferenceService = {
  /**
   * Get current user's preferences
   * GET /preference/me
   */
  getPreferences: async () => {
    try {
      const response = await api.get('/preferences/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  },

  /**
   * Update current user's preferences
   * PUT /preference/update
   */
  updatePreferences: async (data) => {
    try {
      const response = await api.put('/preferences/update', data);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },
};

export default preferenceService;
