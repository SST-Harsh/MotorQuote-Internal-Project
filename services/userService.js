import api from '@/utils/api';
import { normalizeRole } from '@/utils/roleUtils';

const userService = {
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const isFormData = userData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
      const response = await api.post('/users', userData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update User
  updateUser: async (id, userData) => {
    try {
      const isFormData = userData instanceof FormData;
      const config = isFormData ? { headers: { 'Content-Type': undefined } } : {};
      const response = await api.put(`/users/${id}`, userData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete User (Soft Delete or Permanent)
  deleteUser: async (id, permanent = false) => {
    try {
      const params = permanent ? { permanent: true } : {};
      const response = await api.delete(`/users/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update User Status (Active/Inactive/Suspended)
  updateUserStatus: async (id, status) => {
    try {
      const response = await api.patch(`/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetCredentials: async (id) => {
    try {
      const response = await api.post(`/users/${id}/reset-credentials`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (userId, data) => {
    try {
      const response = await api.post(`/users/${userId}/reset-password`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserLoginHistory: async (userId, params = {}) => {
    try {
      const response = await api.get(`/users/${userId}/login-history`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSecurityLogs: async (params = {}) => {
    try {
      const response = await api.get('/auth/security-logs', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkActivate: async (userIds) => {
    try {
      const response = await api.post('/users/bulk-activate', { userIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  bulkDeactivate: async (userIds) => {
    try {
      const response = await api.post('/users/bulk-deactivate', { userIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==========================================================
  // BASIC USER MANAGEMENT API (/users) - For Non-Admin contexts
  // ==========================================================

  // List Users (Basic access)
  getUsers: async (params = {}) => {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyProfile: async () => {
    try {
      // Standardize to documented endpoint
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserActivities: async (userId, params = {}) => {
    try {
      const response = await api.get(`/users/${userId}/activities`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMyProfile: async (data) => {
    try {
      // Standardize to documented endpoint for updating current user profile
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPublicUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyActivity: async (params = {}) => {
    try {
      const response = await api.get('/users/profile/activity', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getLoginHistory: async (params = {}) => {
    try {
      const response = await api.get('/users/profile/login-history', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProfileImage: async () => {
    try {
      const response = await api.get('/auth/me'); // Get user profile which contains avatar
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (data) => {
    try {
      const response = await api.post('/users/change-password', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateNotificationPreferences: async (data) => {
    try {
      const response = await api.put('/users/profile/notification-preferences', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==========================================================
  // DEALER STAFF MANAGEMENT API (/dealer/staff)
  // ==========================================================

  getDealerStaff: async (params = {}) => {
    try {
      const response = await api.get('/dealer/staff', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDealerStaffById: async (id) => {
    try {
      const response = await api.get(`/dealer/staff/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  inviteDealerStaff: async (data) => {
    try {
      const response = await api.post('/dealer/staff/invite', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateDealerStaff: async (id, data) => {
    try {
      const response = await api.put(`/dealer/staff/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deactivateDealerStaff: async (id, reason) => {
    try {
      const response = await api.post(`/dealer/staff/${id}/deactivate`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  reactivateDealerStaff: async (id) => {
    try {
      const response = await api.post(`/dealer/staff/${id}/reactivate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDealerStaffPerformance: async (id, params = {}) => {
    try {
      const response = await api.get(`/dealer/staff/${id}/performance`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
