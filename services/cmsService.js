import api from '@/utils/api';
import axios from 'axios';

const ENDPOINT = '/cms/cms-contents';

const publicApi = axios.create({
  baseURL: '/api', // Local network backend
  headers: { 'Content-Type': 'application/json' },
});

const cmsService = {
  getAllContent: async () => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('authToken');
      }
      const config = {};

      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await publicApi.get(ENDPOINT, config);
      const data = response.data;

      if (Array.isArray(data)) return data;

      if (data && Array.isArray(data.data)) return data.data;

      if (data?.data?.contents && Array.isArray(data.data.contents)) return data.data.contents;

      if (data?.contents && Array.isArray(data.contents)) return data.contents;
      if (data && Array.isArray(data.items)) return data.items;

      return [];
    } catch (error) {
      console.error('Failed to fetch CMS content', error);

      return [];
    }
  },

  getContentById: async (id) => {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data;
  },
  createContent: async (data) => {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  },

  updateContent: async (id, data) => {
    const response = await api.put(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  deleteContent: async (id) => {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },

  getFAQs: async () => {
    const allContent = await cmsService.getAllContent();
    return allContent
      .filter((item) => (item.content_type || item.contentType) === 'faq')
      .map((item) => ({
        ...item,
        isActive: item.is_active !== undefined ? item.is_active : item.isActive,
        displayOrder: item.display_order || item.displayOrder,
        contentType: 'faq',
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  },

  createFAQ: async (faqData) => {
    const payload = {
      content_type: 'faq',
      title: faqData.title,
      slug:
        faqData.slug ||
        faqData.title
          .toLowerCase()
          .replace(/ /g, '-')
          .replace(/[^\w-]+/g, ''),
      content: faqData.content,
      is_active: faqData.isActive,
      display_order: parseInt(faqData.displayOrder) || 0,
    };
    const response = await api.post(ENDPOINT, payload);
    return response.data;
  },

  updateFAQ: async (id, faqData) => {
    const payload = {
      content_type: 'faq',
      title: faqData.title,
      slug: faqData.slug,
      content: faqData.content,
      is_active: faqData.isActive,
      display_order: parseInt(faqData.displayOrder) || 0,
    };
    const response = await api.put(`${ENDPOINT}/${id}`, payload);
    return response.data;
  },

  deleteFAQ: async (id) => {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  },

  // Terms & Privacy
  getTerms: async () => {
    const allContent = await cmsService.getAllContent();
    const terms = allContent.find((item) => (item.content_type || item.contentType) === 'terms');

    if (!terms || !terms.content) {
      return {
        id: terms?.id || null,
        contentType: 'terms',
        title: terms?.title || 'Terms of Service',
        content:
          '<h1>Terms of Service</h1><p>Welcome to MotorQuote. By using our services, you agree to these terms.</p>',
        version: '1.0',
        isActive: false,
      };
    }
    return {
      ...terms,
      contentType: 'terms', // Normalize for frontend
    };
  },

  saveTerms: async (data) => {
    const payload = {
      title: 'Terms of Service',
      slug: 'terms-of-service',
      ...data,
      content_type: 'terms',
    };

    if (data.id) {
      const response = await api.put(`${ENDPOINT}/${data.id}`, payload);
      return response.data;
    } else {
      const response = await api.post(ENDPOINT, payload);
      return response.data;
    }
  },

  getPrivacy: async () => {
    const allContent = await cmsService.getAllContent();
    const privacy = allContent.find(
      (item) => (item.content_type || item.contentType) === 'privacy'
    );

    if (!privacy || !privacy.content) {
      return {
        id: privacy?.id || null, // Keep ID if it exists
        contentType: 'privacy',
        title: 'Privacy Policy',
        content:
          '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we handle your data.</p>',
        version: '1.0',
        isActive: true,
      };
    }
    return {
      ...privacy,
      contentType: 'privacy',
    };
  },

  savePrivacy: async (data) => {
    const payload = {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      ...data,
      content_type: 'privacy',
    };

    if (data.id) {
      const response = await api.put(`${ENDPOINT}/${data.id}`, payload);
      return response.data;
    } else {
      const response = await api.post(ENDPOINT, payload);
      return response.data;
    }
  },

  getPricingConfigs: async (category = '') => {
    try {
      let url = '/cms/pricing-configs';
      if (category) url += `/category/${category}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing configs:', error);
      throw error;
    }
  },

  createPricingConfig: async (data) => {
    try {
      const response = await api.post('/cms/pricing-configs', data);
      return response.data;
    } catch (error) {
      console.error('Error creating pricing config:', error);
      throw error;
    }
  },

  getPricingCategories: async () => {
    try {
      const response = await api.get('/cms/pricing-configs/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing categories:', error);
      throw error;
    }
  },

  getConfigByKey: async (key) => {
    try {
      const response = await api.get(`/cms/pricing-configs/key/${key}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching config by key:', error);
      throw error;
    }
  },

  updatePricingConfig: async (id, data) => {
    try {
      const response = await api.put(`/cms/pricing-configs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating pricing config:', error);
      throw error;
    }
  },

  deletePricingConfig: async (id) => {
    try {
      const response = await api.delete(`/cms/pricing-configs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting pricing config:', error);
      throw error;
    }
  },

  getEmailTemplates: async () => {
    const response = await api.get('/cms/email-templates');
    const data = response.data;

    // Robustly check for array in likely locations
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.templates)) return data.templates;
    if (data && data.data && Array.isArray(data.data.templates)) return data.data.templates;
    if (data && data.data && Array.isArray(data.data)) return data.data;

    console.warn('Could not find email templates array in response:', data);
    return [];
  },

  getEmailTemplateById: async (id) => {
    const response = await api.get(`/cms/email-templates/${id}`);
    const data = response.data;

    // Robustly check for template object
    return data.template || data.data?.template || data;
  },

  saveEmailTemplate: async (data) => {
    if (data.id && !data.id.toString().startsWith('temp-')) {
      const response = await api.put(`/cms/email-templates/${data.id}`, data);
      return response.data;
    } else {
      const response = await api.post('/cms/email-templates', data);
      return response.data;
    }
  },

  deleteEmailTemplate: async (id) => {
    const response = await api.delete(`/cms/email-templates/${id}`);
    return response.data;
  },

  previewEmailTemplate: async (id, variables) => {
    try {
      const response = await api.post(`/cms/email-templates/${id}/preview`, { variables });
      return response.data;
    } catch (error) {
      console.error('Error previewing email template:', error);
      throw error;
    }
  },

  duplicateEmailTemplate: async (id) => {
    try {
      const response = await api.post(`/cms/email-templates/${id}/duplicate`);
      return response.data;
    } catch (error) {
      console.error('Error duplicating email template:', error);
      throw error;
    }
  },

  sendTestEmail: async (templateId, email) => {
    try {
      const response = await api.post(`/cms/email-templates/${templateId}/test`, { email });
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },

  // --- API KEYS MANAGEMENT ---
  getApiKeys: async () => {
    try {
      const response = await api.get('/cms/api-keys');
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.keys)) return data.keys;
      if (data && data.data && Array.isArray(data.data.keys)) return data.data.keys;
      return [];
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  },

  getApiKeyById: async (id) => {
    try {
      const response = await api.get(`/cms/api-keys/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching API key by ID:', error);
      throw error;
    }
  },

  createApiKey: async (data) => {
    try {
      const response = await api.post('/cms/api-keys', data);
      return response.data;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  },

  updateApiKey: async (id, data) => {
    try {
      const response = await api.put(`/cms/api-keys/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating API key:', error);
      throw error;
    }
  },

  regenerateApiSecret: async (id) => {
    try {
      const response = await api.post(`/cms/api-keys/${id}/regenerate-secret`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating API secret:', error);
      throw error;
    }
  },

  revokeApiKey: async (id) => {
    try {
      const response = await api.delete(`/cms/api-keys/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error revoking API key:', error);
      throw error;
    }
  },
};

export default cmsService;
