import api from '@/utils/api';

const supportService = {
  // 9.1 List Support Tickets
  getTickets: async (params = {}) => {
    const response = await api.get('/support/tickets', { params });
    return response.data;
  },

  // 9.2 Get Ticket by ID
  getTicketById: async (id) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  // 9.3 Create Ticket
  createTicket: async (data) => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },

  // 4. Update Ticket Status
  updateTicketStatus: async (id, statusData) => {
    // statusData: { status, resolution_note, notify_user }
    const response = await api.put(`/support/tickets/${id}/status`, statusData);
    return response.data;
  },

  // 4. Add Ticket Response (Public/User) - POST /support/tickets/:id/responses
  addResponse: async (id, responseData) => {
    // responseData: { comment, message, is_internal, attachments: [] }
    const payload = {
      ...responseData,
      message: responseData.message || responseData.comment,
      comment: responseData.comment || responseData.message,
    };
    const response = await api.post(`/support/tickets/${id}/responses`, payload);
    return response.data;
  },

  // 5. Close Ticket - POST /support/tickets/:id/close
  closeTicket: async (id, feedbackData) => {
    // feedbackData: { feedback, rating }
    const response = await api.post(`/support/tickets/${id}/close`, feedbackData);
    return response.data;
  },

  // 7.7 Get Documentation
  getDocs: async (params = {}) => {
    const response = await api.get('/support/docs', { params });
    return response.data;
  },

  // 7.8 Get Doc by ID
  getDocById: async (id) => {
    const response = await api.get(`/support/docs/${id}`);
    return response.data;
  },

  // 5. Create Doc
  createDoc: async (data) => {
    // data: { title, slug, content, category, tags, is_active, display_order }
    const response = await api.post('/support/docs', data);
    return response.data;
  },

  // 7. Update Doc
  updateDoc: async (id, data) => {
    const response = await api.put(`/support/docs/${id}`, data);
    return response.data;
  },

  // 8. Delete Doc
  deleteDoc: async (id) => {
    const response = await api.delete(`/support/docs/${id}`);
    return response.data;
  },

  // 7.10 Get FAQ
  getFAQ: async (params = {}) => {
    const response = await api.get('/support/faq', { params });
    return response.data;
  },
};

export default supportService;
