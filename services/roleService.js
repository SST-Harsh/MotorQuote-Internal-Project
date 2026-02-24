import api from '@/utils/api';

const roleService = {
  getAllRoles: async () => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  getRoleById: async (id) => {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching role ${id}:`, error);
      throw error;
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await api.post('/roles', roleData);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  updateRole: async (id, roleData) => {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating role ${id}:`, error);
      throw error;
    }
  },

  deleteRole: async (id) => {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting role ${id}:`, error);
      throw error;
    }
  },

  assignRoleToUser: async (userId, roleId) => {
    try {
      const response = await api.post('/roles/assign', { userId, roleId });
      return response.data;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  },

  removeRoleFromUser: async (userId, roleId) => {
    try {
      const response = await api.post('/roles/remove', { userId, roleId });
      return response.data;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  },

  getUsersWithRole: async (id) => {
    try {
      const response = await api.get(`/roles/${id}/users`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users for role ${id}:`, error);
      throw error;
    }
  },

  getUserRoles: async (userId) => {
    try {
      const response = await api.get(`/roles/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching roles for user ${userId}:`, error);
      throw error;
    }
  },

  assignPermissionsToRole: async (id, permissionIds) => {
    try {
      const response = await api.post(`/roles/${id}/permissions`, { permissionIds });
      return response.data;
    } catch (error) {
      console.error(`Error assigning permissions to role ${id}:`, error);
      throw error;
    }
  },

  getRolePermissions: async (id) => {
    try {
      const response = await api.get(`/roles/${id}/permissions`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permissions for role ${id}:`, error);
      throw error;
    }
  },
};

export default roleService;
