import api from '@/utils/api';

const auditService = {
  // --- 1. Audit Log APIs ---

  // Get audit logs with filters
  getAuditLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // 6.2 Get Audit Log by ID
  getAuditLogById: async (id) => {
    try {
      const response = await api.get(`/audit-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log by ID:', error);
      throw error;
    }
  },

  // Get complete history of a specific resource
  getResourceHistory: async (resource, resourceId, params = {}) => {
    try {
      const response = await api.get(`/audit-logs/resource/${resource}/${resourceId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resource history:', error);
      throw error;
    }
  },

  // Get activity summary for a user
  getUserActivity: async (userId, params = {}) => {
    try {
      const response = await api.get(`/audit-logs/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  },

  // Get failed actions
  getFailedActions: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/failed-actions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching failed actions:', error);
      throw error;
    }
  },

  // Get aggregated audit stats
  getAuditStats: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  },

  getLoginHistory: async (params = {}) => {
    try {
      const response = await api.get('/users/login-history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  },

  getLoginStats: async (params = {}) => {
    try {
      const response = await api.get('/users/login-history/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching login stats:', error);
      // Return empty stats structure to prevent UI crash if endpoint is missing
      return { total_attempts: 0, successful_logins: 0, failed_logins: 0, unique_ips: 0 };
    }
  },

  getErrorLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/errors', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching error logs:', error);
      throw error;
    }
  },

  getCriticalErrors: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/errors/critical', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching critical errors:', error);
      throw error;
    }
  },

  getErrorStats: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/errors/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching error stats:', error);
      throw error;
    }
  },

  // Get error trends
  getErrorTrends: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/errors/trends', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching error trends:', error);
      throw error;
    }
  },

  getSecurityEvents: async (params = {}) => {
    try {
      const response = await api.get('/audit-logs/failed-actions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching security events:', error);
      throw error;
    }
  },
  cleanLogs: async (data) => {
    try {
      const response = await api.delete('/audit-logs/cleanup', { data });
      return response.data;
    } catch (error) {
      console.error('Error cleaning logs:', error);
      throw error;
    }
  },

  // Export logs (Frontend Helper - Calls logs with export flag/limit if API supports, or fetches all for CSV)
  // Note: If backend doesn't support direct export, we fetch data and CSV it on client.
  // Assuming we fetch data for now.
  exportLogs: async (params = {}) => {
    // As per plan, we fetch data on client side if backend export stream isn't ready,
    // but here we just pass a high limit to existing endpoints.
    return auditService.getAuditLogs({ ...params, limit: 1000 });
  },
};

export default auditService;
