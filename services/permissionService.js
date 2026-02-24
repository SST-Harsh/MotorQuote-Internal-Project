import api from '@/utils/api';

const permissionService = {
  // 1. Get All Permissions
  getAllPermissions: async (params = {}) => {
    try {
      const response = await api.get('/permissions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // 2. Get Permissions by Resource
  getPermissionsByResource: async () => {
    try {
      const response = await api.get('/permissions/by-resource');
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions by resource:', error);
      throw error;
    }
  },

  // 3. Get Unique Resources
  getUniqueResources: async () => {
    try {
      const response = await api.get('/permissions/resources');
      return response.data;
    } catch (error) {
      console.error('Error fetching permission resources:', error);
      throw error;
    }
  },

  // 4. Get Permission by ID
  getPermissionById: async (id) => {
    try {
      const response = await api.get(`/permissions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permission ${id}:`, error);
      throw error;
    }
  },

  // 5. Create Permission (Admin Only)
  createPermission: async (data) => {
    try {
      const response = await api.post('/permissions', data);
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  // 6. Update Permission (Admin Only)
  updatePermission: async (id, data) => {
    try {
      const response = await api.put(`/permissions/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating permission ${id}:`, error);
      throw error;
    }
  },

  // 7. Delete Permission (Admin Only)
  deletePermission: async (id) => {
    try {
      const response = await api.delete(`/permissions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting permission ${id}:`, error);
      throw error;
    }
  },

  // 8. Get Permissions by Resource Name
  getPermissionsByResourceName: async (resource) => {
    try {
      const response = await api.get(`/permissions/resource/${resource}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permissions for resource ${resource}:`, error);
      throw error;
    }
  },

  // 9. Initialize Predefined Permissions (Admin Only)
  initializePermissions: async () => {
    try {
      const response = await api.post('/permissions/initialize');
      return response.data;
    } catch (error) {
      console.error('Error initializing permissions:', error);
      throw error;
    }
  },
};

export default permissionService;
