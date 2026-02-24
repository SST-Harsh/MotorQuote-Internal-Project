import api from '@/utils/api';

const authService = {
  // 1.1 Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // 1.2 Social Login
  socialLogin: async (provider, idToken, accessToken) => {
    const response = await api.post(`/auth/login/${provider}`, {
      idToken,
      accessToken,
    });
    return response.data;
  },

  // 1.3 Verify 2FA
  verify2FA: async (tempToken, code) => {
    const response = await api.post('/auth/verify-2fa', { tempToken, code });
    return response.data;
  },

  // 1.4 Send Login OTP
  sendLoginOTP: async (email) => {
    const response = await api.post('/auth/send-login-otp', { email });
    return response.data;
  },

  // 1.5 Forgot Password (Temporary)
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // 1.6 Forgot Password Link
  forgotPasswordLink: async (email) => {
    const response = await api.post('/auth/forgot-password-link', { email });
    return response.data;
  },

  // 1.7 Reset Password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  // 1.8 Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // 1.9 Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // 2.1 Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // 2.2 Update Profile (Dealer)
  updateDealerProfile: async (data) => {
    const response = await api.put('/dealer/me', data);
    return response.data;
  },

  // 2.3 Change Password
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // 2.4 Setup 2FA
  setup2FA: async () => {
    const response = await api.post('/auth/setup-2fa');
    return response.data;
  },

  // 2.5 Verify 2FA Setup
  verify2FASetup: async (code) => {
    const response = await api.post('/auth/verify-2fa-setup', { code });
    return response.data;
  },

  // 2.6 Disable 2FA
  disable2FA: async (password) => {
    const response = await api.post('/auth/disable-2fa', { password });
    return response.data;
  },

  // 2.7 Get Security Logs
  getSecurityLogs: async (params = {}) => {
    const response = await api.get('/auth/security-logs', { params });
    return response.data;
  },
};

export default authService;
