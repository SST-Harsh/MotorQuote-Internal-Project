import api from '../utils/api';

const dealerService = {
  /**
   * Get summary data for dealer dashboard widgets
   * @param {Object} params - Query parameters (start_date, end_date)
   */
  getDashboardSummary: async (params = {}) => {
    try {
      const response = await api.get('/dealer/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dealer dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Get recent activity feed for the dealership
   * @param {Object} params - Pagination parameters (page, limit)
   */
  getRecentActivity: async (params = {}) => {
    try {
      const response = await api.get('/dealer/activities', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dealer recent activity:', error);
      throw error;
    }
  },
};

export default dealerService;
