import api from '@/utils/api';

/**
 * Tag Service
 * Handles all tag-related API calls
 * Based on API Version 1.0.0
 */
const tagService = {
  /**
   * Helper to extract tag array from various response formats
   */
  _extractTags(response) {
    console.log('[TagService] _extractTags input:', response);
    console.log(
      '[TagService] _extractTags type:',
      typeof response,
      'isArray:',
      Array.isArray(response)
    );

    if (!response) return [];

    // Direct array
    if (Array.isArray(response)) {
      console.log('[TagService] Returning direct array, length:', response.length);
      return response;
    }

    // Common API response formats
    if (response.suggestions && Array.isArray(response.suggestions)) {
      console.log(
        '[TagService] Returning response.suggestions, length:',
        response.suggestions.length
      );
      return response.suggestions;
    }
    if (response.tags && Array.isArray(response.tags)) {
      console.log('[TagService] Returning response.tags, length:', response.tags.length);
      return response.tags;
    }
    if (response.data && Array.isArray(response.data)) {
      console.log('[TagService] Returning response.data, length:', response.data.length);
      return response.data;
    }
    if (response.data?.tags && Array.isArray(response.data.tags)) {
      console.log('[TagService] Returning response.data.tags, length:', response.data.tags.length);
      return response.data.tags;
    }

    // Additional formats
    if (response.results && Array.isArray(response.results)) {
      console.log('[TagService] Returning response.results, length:', response.results.length);
      return response.results;
    }
    if (response.items && Array.isArray(response.items)) {
      console.log('[TagService] Returning response.items, length:', response.items.length);
      return response.items;
    }
    if (response.success && response.data) {
      console.log('[TagService] Found success wrapper, recursing with response.data');
      return this._extractTags(response.data);
    }

    console.warn('[TagService] Could not extract tags from response:', response);
    return [];
  },

  /**
   * Get all tags with optional filtering
   * @param {Object} params - Query parameters (page, limit, type, search, colour)
   * @returns {Promise<Array>} List of tags
   */
  async getAllTags(params = {}) {
    try {
      const response = await api.get('/tags', { params });
      return this._extractTags(response.data);
    } catch (error) {
      console.error('[TagService] Failed to fetch tags:', error);
      throw error;
    }
  },

  /**
   * Get a single tag by ID
   * @param {string} id - Tag ID
   * @returns {Promise<Object>} Tag details
   */
  async getTag(id) {
    try {
      const response = await api.get(`/tags/${id}`);
      // Individual tag might be wrapped in { tag: {} } or { data: {} }
      const data = response.data;
      if (data?.tag) return data.tag;
      if (data?.data && !Array.isArray(data.data)) return data.data;
      return data;
    } catch (error) {
      console.error(`[TagService] Failed to fetch tag ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search tags for autocomplete
   * @param {string} query - Search query
   * @param {string} type - Optional type filter
   * @param {number} limit - Max results (default 10)
   * @returns {Promise<Array>} List of matching tags
   */
  async autocompleteTags(query, type = null, limit = 10) {
    try {
      // Validate query is not empty to prevent "'term' key is required" error
      if (!query || !query.trim()) {
        return [];
      }

      const params = { q: query.trim() }; // 'q' is the required parameter per Swagger docs
      if (type) params.type = type;
      if (limit) params.limit = limit;

      const response = await api.get('/tags/autocomplete', { params });

      // Debug logging
      console.log('[TagService] Autocomplete response:', response.data);

      // Extract tags from response
      const tags = this._extractTags(response.data);
      console.log('[TagService] Extracted tags:', tags);

      return tags;
    } catch (error) {
      console.error('[TagService] Autocomplete failed:', error);
      // Fallback to getAllTags if autocomplete fails
      try {
        return this.getAllTags({ search: query, type, limit });
      } catch (err) {
        return [];
      }
    }
  },

  /**
   * Create a new tag (Admin only)
   * @param {Object} data - { name, colour, type }
   * @returns {Promise<Object>} Created tag
   */
  async createTag(data) {
    try {
      const response = await api.post('/tags', data);
      return response.data;
    } catch (error) {
      console.error('[TagService] Create failed:', error);
      throw error;
    }
  },

  /**
   * Update a tag (Admin only)
   * @param {string} id - Tag ID
   * @param {Object} data - { name, colour }
   * @returns {Promise<Object>} Updated tag
   */
  async updateTag(id, data) {
    try {
      const response = await api.put(`/tags/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`[TagService] Update failed for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a tag (Admin only)
   * @param {string} id - Tag ID
   * @param {boolean} force - Force delete even if in use
   * @returns {Promise<void>}
   */
  async deleteTag(id, force = false) {
    try {
      const params = force ? { force: true } : {};
      await api.delete(`/tags/${id}`, { params });
    } catch (error) {
      console.error(`[TagService] Delete failed for ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get tags attached to an entity
   * @param {string} taggableType - Entity type (quote, user, etc)
   * @param {string} taggableId - Entity ID
   * @returns {Promise<Array>} List of attached tags
   */
  async getEntityTags(taggableType, taggableId) {
    try {
      const response = await api.get(`/tags/entity/${taggableType}/${taggableId}`);
      return this._extractTags(response.data);
    } catch (error) {
      console.error(`[TagService] Failed to fetch entity tags:`, error);
      return [];
    }
  },

  /**
   * Attach a tag to an entity
   * @param {string} taggableType - Entity type
   * @param {string} taggableId - Entity ID
   * @param {string} tagId - Tag ID to attach
   * @returns {Promise<Object>} Success message
   */
  async attachTag(taggableType, taggableId, tagId) {
    try {
      const response = await api.post(`/tags/entity/${taggableType}/${taggableId}/attach`, {
        tagId,
      });
      return response.data;
    } catch (error) {
      console.error(`[TagService] Attach failed:`, error);
      throw error;
    }
  },

  /**
   * Detach a tag from an entity
   * @param {string} taggableType - Entity type
   * @param {string} taggableId - Entity ID
   * @param {string} tagId - Tag ID to detach
   * @returns {Promise<void>}
   */
  async detachTag(taggableType, taggableId, tagId) {
    try {
      await api.delete(`/tags/entity/${taggableType}/${taggableId}/detach/${tagId}`);
    } catch (error) {
      console.error(`[TagService] Detach failed:`, error);
      throw error;
    }
  },

  /**
   * Sync tags for an entity (Replace all)
   * @param {string} taggableType - Entity type
   * @param {string} taggableId - Entity ID
   * @param {Array<string>} tagIds - List of Tag IDs
   * @returns {Promise<Array>} New list of tags
   */
  async syncTags(taggableType, taggableId, tagIds) {
    try {
      const response = await api.post(`/tags/entity/${taggableType}/${taggableId}/sync`, {
        tagIds,
      });
      // Sync might also return nested tags
      const data = response.data;
      return this._extractTags(data);
    } catch (error) {
      console.error(`[TagService] Sync failed:`, error);
      throw error;
    }
  },

  /**
   * Find entities by tags
   * @param {string} taggableType - Entity type to search
   * @param {Array<string>} tagIds - List of Tag IDs
   * @param {boolean} matchAll - If true, entity must have ALL tags
   * @returns {Promise<Object>} { taggable_type, entity_ids, count }
   */
  async filterEntitiesByTags(taggableType, tagIds, matchAll = false) {
    try {
      const params = {
        tags: tagIds.join(','),
        matchAll,
      };
      const response = await api.get(`/tags/filter/${taggableType}`, { params });
      return response.data;
    } catch (error) {
      console.error(`[TagService] Filter failed:`, error);
      throw error;
    }
  },
};

export default tagService;
