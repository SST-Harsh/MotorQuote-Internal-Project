import api from '@/utils/api';

const notificationService = {
  createBroadcast: async (data) => {
    try {
      const response = await api.post('/notifications/alerts/broadcast', data);
      return response.data;
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
  },

  createAnnouncement: async (data) => {
    try {
      const response = await api.post('/notifications/announcements', data);
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  getAllNotifications: async (params) => {
    try {
      const response = await api.get('/notifications/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      throw error;
    }
  },

  // 8.2 Get Notification by ID
  getNotificationById: async (id) => {
    try {
      const response = await api.get(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      throw error;
    }
  },

  getUserNotifications: async (params) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const isDealer = user?.role === 'dealer_manager' || user?.role === 'dealer';
      const endpoint = isDealer ? '/dealer/notifications' : '/notifications/user';

      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch user notifications, returning empty array:', error);
      return { success: true, data: { notifications: [] } };
    }
  },

  getUnreadCount: async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const isDealer = user?.role === 'dealer_manager' || user?.role === 'dealer';
      const endpoint = isDealer
        ? '/dealer/notifications/unread-count'
        : '/notifications/unread-count';

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch unread count, returning 0:', error);
      return { success: true, data: { unreadCount: 0 } };
    }
  },

  markAsRead: async (id) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const isDealer = user?.role === 'dealer_manager' || user?.role === 'dealer';
      const endpoint = isDealer ? `/dealer/notifications/${id}/read` : `/notifications/${id}/read`;

      const response = await api.post(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to mark notification as read on server:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const isDealer = user?.role === 'dealer_manager' || user?.role === 'dealer';

      // For dealers, we rely primarily on the individual marking in the UI history view
      // since a bulk endpoint /dealer/notifications/read-all may not exist.
      const endpoint = isDealer ? null : '/notifications/read-all';

      if (endpoint) {
        const response = await api.post(endpoint);
        return response.data;
      }
      return { success: true, message: 'Marked as read locally' };
    } catch (error) {
      console.error('Failed to mark all notifications as read on server:', error);
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  updateNotification: async (id, data) => {
    try {
      const response = await api.put(`/notifications/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  createTemplate: async (data) => {
    try {
      const response = await api.post('/notifications/templates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  getTemplates: async (params) => {
    try {
      const response = await api.get('/notifications/templates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  getTemplateById: async (id) => {
    try {
      const response = await api.get(`/notifications/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  updateTemplate: async (id, data) => {
    try {
      const response = await api.put(`/notifications/templates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/notifications/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  previewTemplate: async (id, variables) => {
    try {
      const response = await api.post(`/notifications/templates/${id}/preview`, { variables });
      return response.data;
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  },

  duplicateTemplate: async (id, name) => {
    try {
      const response = await api.post(`/notifications/templates/${id}/duplicate`, { name });
      return response.data;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  },

  sendFromTemplate: async (templateId, data) => {
    try {
      const response = await api.post(`/notifications/from-template/${templateId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error sending from template:', error);
      throw error;
    }
  },

  getTemplateCategories: async () => {
    try {
      const response = await api.get('/notifications/templates/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getTemplateTypes: async () => {
    try {
      const response = await api.get('/notifications/templates/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching types:', error);
      throw error;
    }
  },

  // 8.10 Get Preferences
  getPreferences: async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;

      if (user?.role === 'dealer_manager') {
        const dealershipId = user.dealership_id || user.roleDetails?.dealership_id;
        if (dealershipId) {
          const response = await api.get(`/dealer/settings/${dealershipId}/notifications`);
          return response.data;
        }
      }

      const response = await api.get('/users/profile/notification-preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  // 8.11 Update Preferences
  updatePreferences: async (data) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userStr ? JSON.parse(userStr) : null;

      if (user?.role === 'dealer_manager') {
        const dealershipId = user.dealership_id || user.roleDetails?.dealership_id;
        if (dealershipId) {
          const response = await api.put(`/dealer/settings/${dealershipId}/notifications`, data);
          return response.data;
        }
      }

      const response = await api.put('/users/profile/notification-preferences', data);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },
};

export default notificationService;
