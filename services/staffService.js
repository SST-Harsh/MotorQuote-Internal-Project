import api from '@/utils/api';

const staffService = {
  // 5.1 List All Staff
  getAllStaff: async (params = {}) => {
    const response = await api.get('/dealer/staff', { params });
    return response.data;
  },

  // 5.2 Get Staff by ID
  getStaffById: async (id) => {
    const response = await api.get(`/dealer/staff/${id}`);
    return response.data;
  },

  // 5.3 Invite Staff Member
  inviteStaff: async (staffData) => {
    const response = await api.post('/dealer/staff/invite', staffData);
    return response.data;
  },

  // 5.4 Update Staff
  updateStaff: async (id, staffData) => {
    const response = await api.put(`/dealer/staff/${id}`, staffData);
    return response.data;
  },

  // 5.5 Deactivate Staff
  deactivateStaff: async (id, reason) => {
    const response = await api.post(`/dealer/staff/${id}/deactivate`, { reason });
    return response.data;
  },

  // 5.6 Reactivate Staff
  reactivateStaff: async (id) => {
    const response = await api.post(`/dealer/staff/${id}/reactivate`);
    return response.data;
  },

  // 5.7 Get Staff Performance
  getStaffPerformance: async (id, params = {}) => {
    const response = await api.get(`/dealer/staff/${id}/performance`, { params });
    return response.data;
  },

  // 5.8 Resend Invitation
  resendInvitation: async (id) => {
    const response = await api.post(`/dealer/staff/${id}/invite/resend`);
    return response.data;
  },

  // 5.9 Cancel Invitation
  cancelInvitation: async (id) => {
    const response = await api.delete(`/dealer/staff/${id}/invite`);
    return response.data;
  },

  // 5.10 Get Staff Activities
  getStaffActivities: async (id, params = {}) => {
    const response = await api.get(`/dealer/staff/${id}/activities`, { params });
    return response.data;
  },
};

export default staffService;
