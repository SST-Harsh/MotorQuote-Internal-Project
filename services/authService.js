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
      id_token: idToken,
      access_token: accessToken,
    });
    return response.data;
  },

  // 1.3 Verify 2FA
  verify2FA: async (tempToken, code) => {
    const response = await api.post('/auth/verify-2fa', { temp_token: tempToken, code });
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
    const response = await api.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },

  // 1.8 Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refresh_token: refreshToken });
    return response.data;
  },

  // 1.9 Logout
  logout: async (token) => {
    const response = await api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  },

  // 2.1 Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
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

  // // 2.4 Setup 2FA
  // setup2FA: async (role = null) => {
  //     const payload = role ? { role, enforce: true } : {};
  //     const response = await api.post('/auth/setup-2fa', payload);
  //     return response.data;
  // },

  // 2.5 Verify 2FA Setup
  // verify2FASetup: async (code, role = null) => {
  //     const payload = role ? { code, role, enforce: true } : { code };
  //     const response = await api.post('/auth/verify-2fa-setup', payload);
  //     return response.data;
  // },
  enable2fa: async (role = null) => {
    const payload = role ? { role, enforce: true } : {};
    const response = await api.post('/auth/enable-2fa', payload);
    return response.data;
  },
  // 2.6 Disable 2FA
  disable2FA: async (role = null) => {
    const payload = role ? { role, enforce: false } : {};
    const response = await api.post('/auth/disable-2fa', payload);
    return response.data;
  },

  // 2.7 Get Security Logs
  getSecurityLogs: async (params = {}) => {
    const response = await api.get('/auth/security-logs', { params });
    return response.data;
  },
};

export default authService;
