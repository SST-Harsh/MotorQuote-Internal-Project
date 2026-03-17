import api from '../utils/api';

const analyticsService = {
  getPlatformAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/platform', { params });
    return response.data;
  },

  getAnalyticsSummary: async (params = {}) => {
    const response = await api.get('/analytics/summary', { params });
    return response.data;
  },

  // Get Admin Dashboard Analytics
  getAdminAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/admin/dashboard', { params });
    return response.data;
  },

  // Get Dealer Performance Metrics (Admin/ID-based)
  getDealerPerformance: async (dealershipId, params = {}) => {
    const response = await api.get(`/analytics/dealer/${dealershipId}/performance`, { params });
    return response.data;
  },

  // Get Dealer Performance Metrics (Role-based/Current User)
  getDealerPerformanceRoleBased: async (params = {}) => {
    const response = await api.get('/dealer/analytics/performance', { params });
    return response.data;
  },

  // Get Dealer Summary Statistics
  getDealerSummary: async (params = {}) => {
    const response = await api.get('/dealer/analytics/summary', { params });
    return response.data;
  },

  getManagerPerformance: async (managerId, params = {}) => {
    const response = await api.get(`/analytics/manager/${managerId}/performance`, { params });
    return response.data;
  },

  exportAnalyticsData: async (type, format = 'csv', params = {}) => {
    try {
      const response = await api.get(`/analytics/export/${format}`, {
        params: { ...params, type },
        responseType: 'blob',
      });

      const file = new Blob([response.data], {
        type:
          format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
      });

      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute(
        'download',
        `${type}_export_${new Date().toISOString().split('T')[0]}.${extension}`
      );
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      URL.revokeObjectURL(fileURL);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  },

  // New Dealer specific export
  exportDealerCSV: async (params = {}) => {
    try {
      const response = await api.get('/dealer/export/csv', {
        params,
        responseType: 'blob',
      });

      const file = new Blob([response.data], { type: 'text/csv' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `dealer_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(fileURL);

      return { success: true };
    } catch (error) {
      console.error('Dealer export failed:', error);
      throw error;
    }
  },

  // New Dealer specific Excel export
  exportDealerExcel: async (params = {}) => {
    try {
      const response = await api.get('/dealer/export/excel', {
        params,
        responseType: 'blob',
      });

      const file = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `dealer_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      URL.revokeObjectURL(fileURL);

      return { success: true };
    } catch (error) {
      console.error('Dealer Excel export failed:', error);
      throw error;
    }
  },
};

export default analyticsService;
