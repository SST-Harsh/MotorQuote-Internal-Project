import api from '@/utils/api';

const isDevelopment = process.env.NODE_ENV === 'development';

const dealershipService = {
  // ==========================================
  // SUPER ADMIN METHODS (Manage All Dealerships)
  // ==========================================

  // Get all dealerships
  getAllDealerships: async (params = {}) => {
    try {
      const response = await api.get('/dealerships', { params });
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch dealerships:', error);
      // Return empty array as fallback
      return { success: true, data: { dealerships: [] } };
    }
  },

  // Create a new dealership
  createDealership: async (data) => {
    try {
      let payload = data;
      let headers = {};

      if (data instanceof FormData) {
        payload = data;
        headers['Content-Type'] = undefined;
      } else {
        const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);
        const isEmptyObj = (obj) => isObject(obj) && Object.keys(obj).length === 0;

        if (isEmptyObj(data.logo_url)) {
          data.logo_url = null;
        }

        if (data.logo_url instanceof File) {
          payload = new FormData();
          Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
              payload.append(key, data[key]);
            }
          });
          headers['Content-Type'] = undefined;
        }
      }

      if (isDevelopment) {
        let logoDebug = 'N/A';
        if (payload instanceof FormData) {
          logoDebug =
            payload.get('logo_url') instanceof File ? 'File Object' : payload.get('logo_url');
        } else {
          logoDebug = data.logo_url;
        }

        console.log(`DEBUG: createDealership()`, {
          isFormData: payload instanceof FormData,
          logo_url: logoDebug,
          payload,
        });
      }

      const response = await api.post('/dealerships', payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to create dealership:', error);
      throw error;
    }
  },

  // Update an existing dealership
  updateDealership: async (id, data) => {
    try {
      let payload = data;
      let headers = {};

      if (data instanceof FormData) {
        payload = data;
        // Explicitly set multipart header for PUT requests (some backends/proxies require it)
        headers['Content-Type'] = undefined;
      } else {
        // Gaurd against persistent '{}' empty objects from logo_url field
        const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);
        const isEmptyObj = (obj) => isObject(obj) && Object.keys(obj).length === 0;

        if (isEmptyObj(data.logo_url)) {
          data.logo_url = null;
        }

        if (data.logo_url instanceof File) {
          payload = new FormData();
          Object.keys(data).forEach((key) => {
            if (data[key] !== null && data[key] !== undefined) {
              payload.append(key, data[key]);
            }
          });
          headers['Content-Type'] = undefined;
        }
      }

      if (isDevelopment) {
        let logoDebug = 'N/A';
        if (payload instanceof FormData) {
          logoDebug =
            payload.get('logo_url') instanceof File ? 'File Object' : payload.get('logo_url');
        } else {
          logoDebug = data.logo_url;
        }

        console.log(`DEBUG: updateDealership(${id})`, {
          isFormData: payload instanceof FormData,
          logo_url: logoDebug,
          payload,
        });
      }

      const response = await api.put(`/dealerships/${id}`, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Failed to update dealership:', error);
      throw error;
    }
  },

  deleteDealership: async (id) => {
    try {
      const response = await api.delete(`/dealerships/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete dealership:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/dealerships/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dealership:', error);
      throw error;
    }
  },

  getDealershipStatistics: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch dealership statistics:', error);
      return { success: true, data: { stats: {} } };
    }
  },

  // 6.1 Get Dealership Settings
  getDealershipSettings: async (dealershipId) => {
    try {
      const response = await api.get(`/dealer/settings/${dealershipId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6.2 Update Dealership Settings
  updateDealershipSettings: async (dealershipId, data) => {
    try {
      const response = await api.put(`/dealer/settings/${dealershipId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6.3 Get Notification Preferences
  getNotificationPreferences: async (dealershipId) => {
    try {
      const response = await api.get(`/dealer/settings/${dealershipId}/notifications`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6.4 Update Notification Preferences
  updateNotificationPreferences: async (dealershipId, data) => {
    try {
      const response = await api.put(`/dealer/settings/${dealershipId}/notifications`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadDealershipLogo: async (dealershipId, formData) => {
    try {
      const response = await api.post(`/dealer/settings/${dealershipId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadDealershipLogoAdmin: async (dealershipId, formData) => {
    try {
      const response = await api.post(`/dealer/settings/${dealershipId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDealershipOptions: async () => {
    try {
      const response = await api.get('/dealerships');
      const items = Array.isArray(response.data)
        ? response.data
        : response.data?.dealerships ||
          response.data?.data?.dealerships ||
          response.data?.data ||
          [];
      return items.map((d) => ({ label: d.name, value: d.id, code: d.code }));
    } catch (error) {
      return [];
    }
  },
};

export default dealershipService;
