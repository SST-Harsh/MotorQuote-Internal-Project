import api from '@/utils/api';

const ENDPOINT = '/files';

const fileService = {
  // List files with filtering/sorting
  getFiles: async (params = {}) => {
    try {
      const response = await api.get(ENDPOINT, { params });
      // Handle both array and paginated response structures
      return Array.isArray(response.data) ? { data: response.data, meta: {} } : response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // Get file by ID
  getFileById: async (id) => {
    try {
      const response = await api.get(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching file by ID:', error);
      throw error;
    }
  },

  // Upload a new file
  uploadFile: async (formData, onProgress) => {
    try {
      const config = {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        },
      };

      // Log for debugging
      console.log(
        '[FileService] Uploading with context:',
        formData.get('context'),
        formData.get('context_id')
      );

      const response = await api.post(`${ENDPOINT}/upload`, formData, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Delete a file
  deleteFile: async (id) => {
    try {
      await api.delete(`${ENDPOINT}/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Update file metadata (Rename/Access Level)
  updateFile: async (id, data) => {
    try {
      // Specified payload: { filename, accessLevel }
      const response = await api.put(`${ENDPOINT}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  },

  // Backward compatibility for rename
  renameFile: async (id, newName) => {
    return fileService.updateFile(id, { filename: newName });
  },

  // Get storage quota usage
  getStorageUsage: async () => {
    try {
      const response = await api.get(`${ENDPOINT}/usage`);
      return response.data;
    } catch (error) {
      console.error('Error fetching storage usage:', error);
      return { used: 0, total: 0 };
    }
  },

  // Download file (Standard endpoint for both internal and public access)
  downloadFile: async (id, params = {}) => {
    try {
      const config = {
        responseType: 'blob',
        params: params,
      };
      // Using standard download path as requested: /files/{id}/download
      const response = await api.get(`${ENDPOINT}/${id}/download`, config);
      return response.data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Permanent Delete
  permanentDeleteFile: async (id) => {
    try {
      await api.delete(`${ENDPOINT}/${id}/permanent`);
      return true;
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      throw error;
    }
  },

  // Restore Deleted File
  restoreFile: async (id) => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring file:', error);
      throw error;
    }
  },

  // Share File (Generate Link)
  shareFile: async (id, data = {}) => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/share`, data);
      return response.data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  },

  // Share via OTP email
  shareFileViaOtp: async (id, email, options = {}) => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/share/otp`, { email, ...options });
      return response.data;
    } catch (error) {
      console.error('Error sharing file via OTP:', error);
      throw error;
    }
  },

  // Share with password
  shareFileViaPassword: async (id, payload) => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/share/password`, {
        password: payload?.password || null,
        maxAccessCount:
          payload?.maxAccessCount !== '' &&
          payload?.maxAccessCount !== null &&
          payload?.maxAccessCount !== undefined
            ? parseInt(payload.maxAccessCount, 10)
            : null,
        expiresAt: payload?.expiresAt || null,
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing file via password:', error);
      throw error;
    }
  },

  // Get Share Links
  getShareLinks: async (id) => {
    try {
      const response = await api.get(`${ENDPOINT}/${id}/shares`);
      return response.data;
    } catch (error) {
      console.error('Error fetching share links:', error);
      throw error;
    }
  },

  // Revoke Share Link
  revokeShareLink: async (fileId, shareId) => {
    try {
      await api.delete(`${ENDPOINT}/${fileId}/shares/${shareId}`);
      return true;
    } catch (error) {
      console.error('Error revoking share link:', error);
      throw error;
    }
  },

  // File Versions
  getFileVersions: async (id) => {
    try {
      const response = await api.get(`${ENDPOINT}/${id}/versions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching file versions:', error);
      throw error;
    }
  },

  // Upload New Version
  uploadVersion: async (id, formData, onProgress) => {
    try {
      const config = {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        },
      };
      const response = await api.post(`${ENDPOINT}/${id}/version`, formData, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading version:', error);
      throw error;
    }
  },

  // Set or Update File Password
  setFilePassword: async (id, password) => {
    try {
      const response = await api.put(`${ENDPOINT}/${id}/password`, { password });
      return response.data;
    } catch (error) {
      console.error('Error setting file password:', error);
      throw error;
    }
  },

  // Verify File Password
  verifyFilePassword: async (id, password) => {
    try {
      const response = await api.post(`${ENDPOINT}/${id}/verify-password`, { password });
      return response.data;
    } catch (error) {
      console.error('Error verifying file password:', error);
      throw error;
    }
  },

  // Upload multiple files at once
  uploadMultipleFiles: async (formData, onProgress) => {
    try {
      const config = {
        headers: { 'Content-Type': undefined },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        },
      };
      const response = await api.post(`${ENDPOINT}/upload/multiple`, formData, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },

  // Get OTP Shares
  getOTPShares: async (id) => {
    try {
      const response = await api.get(`${ENDPOINT}/${id}/shares/otp`);
      return response.data;
    } catch (error) {
      console.error('Error fetching OTP shares:', error);
      throw error;
    }
  },

  // Revoke OTP Share
  revokeOTPShare: async (fileId, otpId) => {
    try {
      // Using generic share revocation endpoint as per spec
      await api.delete(`${ENDPOINT}/${fileId}/shares/${otpId}`);
      return true;
    } catch (error) {
      console.error('Error revoking OTP share:', error);
      throw error;
    }
  },

  // Public: OTP entry form
  getOtpEntryForm: async (fileId) => {
    try {
      const response = await api.get(`${ENDPOINT}/shared/otp/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching OTP entry form:', error);
      throw error;
    }
  },

  // Public: Verify OTP
  verifySharedOtp: async (fileId, otp) => {
    try {
      const response = await api.post(`${ENDPOINT}/shared/otp/${fileId}/verify`, { otp });
      return response.data;
    } catch (error) {
      console.error('Error verifying shared OTP:', error);
      throw error;
    }
  },

  getPublicFileInfo: async (token) => {
    try {
      // Using blob response type to handle both JSON and Binary responses gracefully
      const response = await api.get(`${ENDPOINT}/shared/${token}`, { responseType: 'blob' });

      const contentType = response.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        // The endpoint returned the file directly. Extract metadata from headers.
        const contentDisposition = response.headers['content-disposition'] || '';
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        const filename = filenameMatch ? filenameMatch[1] : 'shared_file';
        const fileSize = response.headers['content-length']
          ? parseInt(response.headers['content-length'])
          : response.data.size;

        return {
          id: token,
          name: filename,
          size: fileSize,
          type: contentType,
          is_folder: false,
          is_direct_file: true,
          file_blob: response.data, // Keep the blob for immediate preview
        };
      }

      // It's JSON, we need to parse the blob content
      const text = await response.data.text();
      const data = JSON.parse(text);
      const rawData = data?.data || data;

      if (!rawData) throw new Error('File not found');

      // Extract the actual file/folder payload
      const shareable = rawData.shareable || rawData.file || rawData;
      const isFolder = !!(
        rawData.is_folder ||
        shareable.is_folder ||
        (rawData.files && !rawData.type)
      );

      const normalized = {
        ...rawData,
        id: shareable.id || rawData.file_id || rawData.id,
        name:
          shareable.name ||
          shareable.display_name ||
          shareable.filename ||
          shareable.file_name ||
          shareable.original_name ||
          shareable.title ||
          rawData.name ||
          'document',
        size:
          shareable.size ||
          shareable.file_size ||
          shareable.length ||
          shareable.file_size_bytes ||
          rawData.size ||
          0,
        type: shareable.type || shareable.mime_type || shareable.content_type || rawData.type || '',
        is_folder: isFolder,
        files: rawData.files || shareable.files || [],
        expires_at: rawData.expires_at || shareable.expires_at,
        password_protected: !!(
          rawData.password_protected ||
          rawData.has_password ||
          rawData.password ||
          shareable.password
        ),
        otp_required: !!(rawData.otp_required || rawData.requires_otp || rawData.has_otp),
      };

      return normalized;
    } catch (error) {
      console.error('Error fetching public file info:', error);
      throw error;
    }
  },

  // Download Shared File (Public handling)
  downloadSharedFile: async (token, params = {}) => {
    try {
      const config = {
        responseType: 'blob',
        params: params,
      };
      // Updated to use the main shared endpoint as per your spec
      const response = await api.get(`${ENDPOINT}/shared/${token}`, config);
      return response.data;
    } catch (error) {
      console.error('Error downloading shared file:', error);
      throw error;
    }
  },

  /**
   * Helper to trigger a browser download for a Blob
   * @param {Blob} blob
   * @param {string} filename
   */
  saveBlobAsFile: (blob, filename) => {
    if (!blob) return;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Robust filename resolution with extension fallback and version suffixing
   * @param {Object} file
   * @param {Object} [version]
   * @returns {string}
   */
  resolveFileName: (file, version = null) => {
    let fileName =
      file.name ||
      file.display_name ||
      file.file_name ||
      file.filename ||
      file.original_name ||
      'document';

    // If extension is missing, try to append it from MIME type
    if (!fileName.includes('.')) {
      const mime =
        file.type || file.mime_type || (version ? version.type || version.mime_type : '') || '';
      if (mime.includes('pdf')) fileName += '.pdf';
      else if (mime.includes('image/jpeg')) fileName += '.jpg';
      else if (mime.includes('image/png')) fileName += '.png';
      else if (mime.includes('image/gif')) fileName += '.gif';
      else if (mime.includes('word') || mime.includes('document')) fileName += '.docx';
      else if (mime.includes('spreadsheet') || mime.includes('excel')) fileName += '.xlsx';
    }

    if (version) {
      const versionSuffix = version.version_number || version.version || 'v';
      fileName = fileName.includes('.')
        ? fileName.replace(/(\.[^.]+)$/, `_${versionSuffix}$1`)
        : `${fileName}_v${versionSuffix}`;
    }

    return fileName;
  },
};

export default fileService;
