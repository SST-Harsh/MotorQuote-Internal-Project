import api from '@/utils/api';

const securityService = {
  // Password Policies
  getSettings: async () => {
    try {
      const response = await api.get('/security-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching security settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await api.put('/security-settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  },

  // IP Blacklist/Whitelist
  getIPWhitelist: async () => {
    try {
      const response = await api.get('/security-settings/whitelist');
      return response.data;
    } catch (error) {
      console.error('Error fetching IP whitelist:', error);
      throw error;
    }
  },

  addToWhitelist: async (ip, reason) => {
    try {
      const response = await api.post('/security-settings/whitelist', { ip, reason });
      return response.data;
    } catch (error) {
      console.error('Error adding to IP whitelist:', error);
      throw error;
    }
  },

  removeFromWhitelist: async (id) => {
    try {
      const response = await api.delete(`/security-settings/whitelist/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from IP whitelist:', error);
      throw error;
    }
  },

  getIPBlacklist: async () => {
    try {
      const response = await api.get('/security-settings/blacklist');
      return response.data;
    } catch (error) {
      console.error('Error fetching IP blacklist:', error);
      throw error;
    }
  },

  addToBlacklist: async (ip, reason) => {
    try {
      const response = await api.post('/security-settings/blacklist', { ip, reason });
      return response.data;
    } catch (error) {
      console.error('Error adding to IP blacklist:', error);
      throw error;
    }
  },

  removeFromBlacklist: async (id) => {
    try {
      const response = await api.delete(`/security-settings/blacklist/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from IP blacklist:', error);
      throw error;
    }
  },

  // Session Management
  getActiveSessions: async (userId) => {
    try {
      const response = await api.get(`/security-settings/sessions/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw error;
    }
  },

  revokeSession: async (sessionId) => {
    try {
      const response = await api.delete(`/security-settings/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  },
};

export default securityService;
