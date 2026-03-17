'use client';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../services/authService';
import userService from '../services/userService';
import impersonationService from '../services/impersonationService';
import api from '../utils/api';
import Cookies from 'js-cookie';
import { showSuccess, showWarning } from '../utils/toast';
import { jwtDecode } from 'jwt-decode';
import { logAuditEntry } from '../utils/auditLogger';
import { normalizeRole } from '../utils/roleUtils';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tokenType') === 'impersonation';
    }
    return false;
  });

  const [impersonationData, setImpersonationData] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem('impersonationData');
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Failed to parse impersonation data:', error);
        return null;
      }
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const tokenType = localStorage.getItem('tokenType');
        const impDataStr = localStorage.getItem('impersonationData');

        if (tokenType === 'impersonation' && impDataStr) {
          try {
            const impData = JSON.parse(impDataStr);
            if (impData.impersonated_user) {
              return {
                ...impData.impersonated_user,
                role: normalizeRole(impData.impersonated_user.role),
              };
            }
          } catch (e) {
            console.error('Failed to parse impersonation data for user init:', e);
          }
        }

        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken') || Cookies.get('authToken');

        if (token) {
          try {
            const decoded = jwtDecode(token);
          } catch (e) {
            console.error('Failed to decode token for debug', e);
          }
        }
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);

          // Normalize role using utility
          if (parsedUser.role) {
            const normalizedRole = normalizeRole(parsedUser.role);
            parsedUser.role = normalizedRole;
            parsedUser.roleDetails = typeof parsedUser.role === 'object' ? parsedUser.role : null;
            localStorage.setItem('user', JSON.stringify(parsedUser));
            Cookies.set('role', normalizedRole, { expires: 7 });
          }

          return parsedUser;
        }
        return null;
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        return null;
      }
    }
    return null;
  });

  const router = useRouter();

  const socialLogin = useCallback(async (provider, idToken, accessToken) => {
    try {
      // Call backend social login endpoint
      const resData = await authService.socialLogin(provider, idToken, accessToken);

      if (resData.requiresTwoFactor || resData.requires_two_factor) {
        sessionStorage.setItem('tempToken', resData.tempToken || resData.temp_token);

        if (resData.otp || resData.code) {
          sessionStorage.setItem('debug_otp', resData.otp || resData.code);
        }
        return { success: true, requires2FA: true };
      }

      if (resData.token) {
        const { token, expiresAt } = resData;

        const decoded = jwtDecode(token);

        const backendUser = resData.user || {};

        // Use role normalization utility
        const roleName = normalizeRole(backendUser.role || decoded.role);

        const user = {
          ...backendUser,
          name: backendUser.name || decoded.name || decoded.sub || backendUser.email,
          email: backendUser.email || decoded.email,
          role: roleName,
          roleDetails: backendUser.role,
          id: backendUser.id || decoded.id || decoded.userId,
          loginMethod: 'social',
          provider: provider,
        };

        let rolePermissions = [];
        if (backendUser.role_id) {
          try {
            const roleRes = await api.get(`/roles/${backendUser.role_id}`);
            const roleData = roleRes.data;

            if (roleData && roleData.permissions) {
              rolePermissions = roleData.permissions;
            }
          } catch (err) {
            console.error('Failed to fetch role permissions', err);
          }
        }

        user.permissions = rolePermissions;
        user.roleDetails = backendUser.role;

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        const defaultDuration = 7 * 24 * 3600 * 1000; // 7 days for social login
        const expiryTime = expiresAt || new Date(Date.now() + defaultDuration).toISOString();
        localStorage.setItem('authTokenExpiresAt', expiryTime);

        const cookieExpires = 7;

        // Set cookies for middleware authentication
        Cookies.set('authToken', token, { expires: cookieExpires });
        Cookies.set('role', user.role, { expires: cookieExpires });

        setUser(user);

        logAuditEntry(
          'Social Login Success',
          user,
          `User logged in via ${provider}`,
          'Info',
          'Auth'
        );

        return { success: true, role: user.role, requires2FA: false };
      }
    } catch (error) {
      console.error('Social Login API Error:', error);
      logAuditEntry(
        'Social Login Failed',
        { provider, role: 'N/A' },
        `API Error: ${error.response?.data?.message || error.message}`,
        'Critical',
        'Auth'
      );
      const backendMessage =
        error.response?.data?.message || error.message || 'Social login failed';
      throw new Error(backendMessage);
    }
  }, []);

  const logout = useCallback(
    async (reason = 'user') => {
      // 0. Get the token BEFORE clearing it
      const token = localStorage.getItem('authToken');

      // 1. Immediate Local State & Cookie Cleanup
      Cookies.remove('authToken');
      Cookies.remove('role');
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpiresAt');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('impersonationData');
      localStorage.removeItem('user_preferences');
      sessionStorage.removeItem('tempToken');

      const oldUser = user;
      setIsImpersonating(false);
      setImpersonationData(null);
      setUser(null);

      // 2. Immediate Redirect to Login
      router.push('/login');

      // 3. Show Toast Notification
      const isExpired = reason === 'expired';
      const isSuspended = reason === 'suspended';

      if (isSuspended) {
        showError(
          'Account Suspended',
          'Your account has been suspended by an administrator. You have been logged out.',
          5000
        );
      } else if (isExpired) {
        showWarning('Session Expired', 'Your session has expired. Please log in again.', 3000);
      } else {
        showSuccess('Logged Out', 'See you soon!', 1500);
      }

      // 4. Background Server-side Logout (don't block the UI)
      if (oldUser) {
        let auditReason = 'User Logged Out Manually';
        if (reason === 'expired') auditReason = 'Session Expired - Auto Logout';
        if (reason === 'suspended') auditReason = 'Account Suspended - Auto Logout';
        logAuditEntry('Logout', oldUser, auditReason, 'Info', 'Auth');

        authService.logout(token).catch((e) => console.error('Logout server error', e));
      }
    },
    [router, user]
  );

  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      // Use authService.login instead of direct api.post
      const resData = await authService.login({ email, password });

      // const resData = response.data; // authService returns response.data directly

      if (resData.requiresTwoFactor || resData.requires_two_factor) {
        sessionStorage.setItem('tempToken', resData.tempToken || resData.temp_token);

        if (resData.otp || resData.code) {
          sessionStorage.setItem('debug_otp', resData.otp || resData.code);
        }
        return { success: true, requires2FA: true };
      }

      if (resData.token) {
        const { token, expiresAt } = resData;

        const decoded = jwtDecode(token);

        const backendUser = resData.user || {};

        // Use role normalization utility
        const roleName = normalizeRole(backendUser.role || decoded.role);

        const user = {
          ...backendUser,
          name: backendUser.name || decoded.name || decoded.sub || email.split('@')[0],
          email: backendUser.email || decoded.email || email,
          role: roleName,
          roleDetails: backendUser.role,
          id: backendUser.id || decoded.id || decoded.userId,
        };

        let rolePermissions = [];
        if (backendUser.role_id) {
          try {
            const roleRes = await api.get(`/roles/${backendUser.role_id}`);
            const roleData = roleRes.data;

            if (roleData && roleData.permissions) {
              rolePermissions = roleData.permissions;
            }
          } catch (err) {
            console.error('Failed to fetch role permissions', err);
          }
        }

        user.permissions = rolePermissions;
        user.roleDetails = backendUser.role;

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        const defaultDuration = rememberMe ? 7 * 24 * 3600 * 1000 : 3600 * 1000;
        const expiryTime = expiresAt || new Date(Date.now() + defaultDuration).toISOString();
        localStorage.setItem('authTokenExpiresAt', expiryTime);

        const cookieExpires = rememberMe ? 7 : 1;

        // Set cookies for middleware authentication
        Cookies.set('authToken', token, { expires: cookieExpires });
        Cookies.set('role', user.role, { expires: cookieExpires });

        setUser(user);

        logAuditEntry('Login Success', user, 'User logged in successfully.', 'Info', 'Auth');

        return { success: true, role: user.role, requires2FA: false };
      }
    } catch (error) {
      console.error('Login API Error:', error);
      logAuditEntry(
        'Login Failed',
        { email, role: 'N/A' },
        `API Error: ${error.response?.data?.message || error.message}`,
        'Critical',
        'Auth'
      );

      const resData = error.response?.data;
      const status = error.response?.status;
      const backendMessage = resData?.message || error.message || 'An unexpected error occurred';

      // Extremely robust check for suspension
      const isSuspended =
        status === 403 ||
        resData?.status === 'suspended' ||
        resData?.suspended === true ||
        backendMessage.toLowerCase().includes('suspended') ||
        backendMessage.toLowerCase().includes('account is inactive') ||
        backendMessage.toLowerCase().includes('access restricted');

      const suspensionReason =
        resData?.suspension_reason ||
        resData?.suspensionReason ||
        resData?.suspend_reason ||
        resData?.reason ||
        resData?.suspension_message;

      const finalError = new Error(backendMessage);
      if (isSuspended) {
        finalError.isSuspended = true;
        finalError.suspensionReason = suspensionReason;
      }

      throw finalError;
    }
  }, []);

  // Centralized session sync (Permissions + Profile Data)
  const syncSession = useCallback(async () => {
    if (!user || isImpersonating) return;

    try {
      const freshProfile = await authService.getProfile();
      const backendUser = freshProfile.user || freshProfile;

      if (backendUser) {
        const roleName = normalizeRole(backendUser.role);
        const freshAvatar = backendUser.profile_picture || backendUser.avatar;

        const updatedUser = {
          ...user,
          ...backendUser,
          role: roleName,
          roleDetails: backendUser.role,
          profile_picture: freshAvatar || user.profile_picture,
          avatar: freshAvatar || user.avatar,
        };

        // Comparison to avoid redundant state updates
        const oldState = JSON.stringify({ p: user.permissions, r: user.role, a: user.avatar });
        const newState = JSON.stringify({
          p: backendUser.permissions,
          r: roleName,
          a: freshAvatar,
        });

        if (oldState !== newState) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error('Session sync failed:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        const msg = err.response?.data?.message || '';
        const suspended =
          msg.toLowerCase().includes('suspended') || msg.toLowerCase().includes('inactive');
        logout(suspended ? 'suspended' : 'expired');
      }
    }
  }, [user?.id, isImpersonating, logout]);

  useEffect(() => {
    if (!user?.id) return;

    // Initial sync on mount/login
    syncSession();

    const checkTokenExpiry = () => {
      const expiresAt = localStorage.getItem('authTokenExpiresAt');
      if (!expiresAt) return;
      if (new Date(expiresAt).getTime() <= Date.now()) {
        logout('expired');
      }
    };

    const expiryInterval = setInterval(checkTokenExpiry, 5000);
    const syncInterval = setInterval(syncSession, 60 * 1000); // Periodic sync every 60s

    const handleGlobalSync = () => syncSession();
    window.addEventListener('auth:refresh-permissions', handleGlobalSync);
    window.addEventListener('focus', handleGlobalSync);

    return () => {
      clearInterval(expiryInterval);
      clearInterval(syncInterval);
      window.removeEventListener('auth:refresh-permissions', handleGlobalSync);
      window.removeEventListener('focus', handleGlobalSync);
    };
  }, [user?.id, syncSession, logout]);

  const updateProfile = useCallback(
    (updates) => {
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to save user to localStorage:', error);
        Swal.fire({
          icon: 'warning',
          title: 'Storage Full',
          text: 'Your profile changes were applied but could not be saved to storage. They will reset on refresh.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 5000,
        });
      }
      return updatedUser;
    },
    [user]
  );

  // Shared helper for cleaning up impersonation state
  const clearImpersonationState = useCallback(() => {
    localStorage.removeItem('impersonationData');
    localStorage.removeItem('tokenType');
    setIsImpersonating(false);
    setImpersonationData(null);
  }, []);

  const startImpersonation = useCallback(
    async (userId) => {
      try {
        const response = await impersonationService.startImpersonation(userId);
        const data = response.success && response.data ? response.data : response;

        if (data && data.token) {
          const { token, refresh_token, impersonated_user, original_admin } = data;
          const normalizedRole = normalizeRole(impersonated_user.role);

          localStorage.setItem('authToken', token);
          localStorage.setItem('tokenType', 'impersonation');
          if (refresh_token) localStorage.setItem('refreshToken', refresh_token);

          const impData = {
            impersonated_user,
            original_admin,
            started_at: new Date().toISOString(),
          };
          localStorage.setItem('impersonationData', JSON.stringify(impData));

          Cookies.set('authToken', token, { expires: 1 });
          Cookies.set('role', normalizedRole, { expires: 1 });

          const normalizedImpersonatedUser = {
            ...impersonated_user,
            role: normalizedRole,
          };
          localStorage.setItem('user', JSON.stringify(normalizedImpersonatedUser));

          const expiryTime = new Date(Date.now() + 3600 * 1000).toISOString();
          localStorage.setItem('authTokenExpiresAt', expiryTime);

          setIsImpersonating(true);
          setImpersonationData(impData);
          setUser(normalizedImpersonatedUser);

          showSuccess('Impersonation Started', `Now viewing as ${impersonated_user.email}`);
          router.push('/dashboard');
          router.refresh();
          return { success: true };
        } else {
          throw new Error('Impersonation response did not include a valid token');
        }
      } catch (error) {
        console.error('Impersonation start failed:', error);
        const message = error.response?.data?.message || 'Failed to start impersonation';
        showWarning('Impersonation Failed', message);
        throw error;
      }
    },
    [router]
  );

  const exitImpersonation = useCallback(async () => {
    try {
      const response = await impersonationService.exitImpersonation();
      const data = response.success && response.data ? response.data : response;

      if (data && data.token) {
        const { token, refresh_token, token_type, user: adminUser } = data;
        const normalizedRole = normalizeRole(adminUser.role);

        localStorage.setItem('authToken', token);
        localStorage.setItem('tokenType', token_type || 'Bearer');
        if (refresh_token) localStorage.setItem('refreshToken', refresh_token);

        clearImpersonationState();
        Cookies.set('authToken', token, { expires: 7 });
        Cookies.set('role', normalizedRole, { expires: 7 });

        const normalizedAdminUser = { ...adminUser, role: normalizedRole };
        localStorage.setItem('user', JSON.stringify(normalizedAdminUser));

        const adminExpiryTime = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        localStorage.setItem('authTokenExpiresAt', adminExpiryTime);

        setUser(normalizedAdminUser);
        showSuccess('Impersonation Ended', 'Returned to admin session');
        router.push('/users');
        router.refresh();
        return { success: true };
      } else {
        throw new Error('Exit impersonation response did not include a valid token');
      }
    } catch (error) {
      console.error('Impersonation exit failed:', error);

      // If we're here, the API failed (likely 401). We MUST clean up local state anyway
      // to allow the user to escape the impersonation loop.
      clearImpersonationState();
      setUser(null);
      Cookies.remove('authToken');
      Cookies.remove('role');

      const message = error.response?.data?.message || 'Failed to exit impersonation smoothly';
      showWarning('Session Reset', message);

      router.push('/login');
      router.refresh();
      throw error;
    }
  }, [router, clearImpersonationState]);

  const authValue = useMemo(
    () => ({
      user,
      login,
      socialLogin,
      logout,
      isImpersonating,
      impersonationData,
      updateProfile,
      startImpersonation,
      exitImpersonation,
    }),
    [
      user,
      login,
      socialLogin,
      logout,
      isImpersonating,
      impersonationData,
      updateProfile,
      startImpersonation,
      exitImpersonation,
    ]
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
