import api from '@/utils/api';

const quoteService = {
  getQuotes: async (params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? '/dealer/quotes' : '/quotes';
      const response = await api.get(endpoint, { params: requestParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getQuoteById: async (id, params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? `/dealer/quotes/${id}` : `/quotes/${id}`;
      const response = await api.get(endpoint, { params: requestParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createQuote: async (data) => {
    try {
      const useDealerEndpoint = data._useDealerEndpoint;
      const requestData = { ...data };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? '/dealer/quotes' : '/quotes';
      const response = await api.post(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateQuote: async (id, data) => {
    try {
      console.log('DEBUG updateQuote', { id, data, flag: data._useDealerEndpoint });
      const useDealerEndpoint = data._useDealerEndpoint;
      const requestData = { ...data };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? `/dealer/quotes/${id}` : `/quotes/${id}`;
      console.log('DEBUG updateQuote endpoint', endpoint);
      const response = await api.put(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  patchQuote: async (id, data) => {
    try {
      const useDealerEndpoint = data._useDealerEndpoint;
      const requestData = { ...data };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? `/dealer/quotes/${id}` : `/quotes/${id}`;
      const response = await api.patch(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteQuote: async (id, params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const endpoint = useDealerEndpoint ? `/dealer/quotes/${id}` : `/quotes/${id}`;
      await api.delete(endpoint);
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id, payload) => {
    try {
      const useDealerEndpoint = payload._useDealerEndpoint;
      const requestData = { ...payload };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? `/dealer/quotes/${id}/status` : `/quotes/${id}/status`;
      const response = await api.post(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  overrideStatus: async (id, payload) => {
    try {
      const useDealerEndpoint = payload._useDealerEndpoint;
      const requestData = { ...payload };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint
        ? `/dealer/quotes/${id}/override-status`
        : `/quotes/${id}/override-status`;
      const response = await api.post(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDashboardStats: async (params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? '/dealer/dashboard' : '/quotes/dashboard'; // Assuming /quotes/dashboard for non-dealer
      const response = await api.get(endpoint, { params: requestParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRecentActivity: async (params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? '/dealer/activity' : '/quotes/activity'; // Assuming /quotes/activity for non-dealer
      const response = await api.get(endpoint, { params: requestParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCommunicationLogs: async (id, params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint
        ? `/dealer/quotes/${id}/communication-logs`
        : `/quotes/${id}/communication-logs`;
      const response = await api.get(endpoint, { params: requestParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addCommunicationLog: async (id, logData) => {
    try {
      const useDealerEndpoint = logData._useDealerEndpoint;
      const requestData = { ...logData };
      delete requestData._useDealerEndpoint;

      const endpoint = useDealerEndpoint
        ? `/dealer/quotes/${id}/communication-logs`
        : `/quotes/${id}/communication-logs`;
      const response = await api.post(endpoint, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  exportQuotes: async (format = 'csv', params = {}) => {
    try {
      const useDealerEndpoint = params._useDealerEndpoint;
      const requestParams = { ...params };
      delete requestParams._useDealerEndpoint;

      const endpoint = useDealerEndpoint ? '/dealer/quotes/export' : '/quotes/export';
      const response = await api.get(endpoint, {
        params: { ...requestParams, format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default quoteService;
