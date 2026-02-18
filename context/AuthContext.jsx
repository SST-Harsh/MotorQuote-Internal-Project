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

      if (resData.requiresTwoFactor || resData.requires_two_factor || resData.requiresMFA) {
        sessionStorage.setItem('tempToken', resData.tempToken || resData.temp_token);

        if (resData.otp || resData.code) {
          sessionStorage.setItem('debug_otp', resData.otp || resData.code);
        }
        return { success: true, requires2FA: true };
      }

      const token = resData.token || resData.accessToken;
      if (token) {
        const { expiresAt } = resData;

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

  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      // Use authService.login instead of direct api.post
      const resData = await authService.login({ email, password });

      // const resData = response.data; // authService returns response.data directly

      if (resData.requiresTwoFactor || resData.requires_two_factor || resData.requiresMFA) {
        sessionStorage.setItem('tempToken', resData.tempToken || resData.temp_token);

        if (resData.otp || resData.code) {
          sessionStorage.setItem('debug_otp', resData.otp || resData.code);
        }
        return { success: true, requires2FA: true };
      }

      const token = resData.token || resData.accessToken;
      if (token) {
        const { expiresAt } = resData;

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
      const backendMessage =
        error.response?.data?.message || error.message || 'An unexpected error occurred';
      throw new Error(backendMessage);
    }
  }, []);

  const logout = useCallback(
    async (reason = 'user') => {
      if (user) {
        logAuditEntry(
          'Logout',
          user,
          reason === 'expired' ? 'Session Expired - Auto Logout' : 'User Logged Out Manually',
          'Info',
          'Auth'
        );
      }

      let backendMessage = 'See you soon!';
      try {
        const resData = await authService.logout();
        if (resData && resData.message) {
          backendMessage = resData.message;
        }
      } catch (e) {
        console.error('Logout server error', e);
      }

      const isExpired = reason === 'expired';

      // Use toast utility
      if (isExpired) {
        showWarning('Session Expired', 'Your session has expired. Please log in again.', 3000);
      } else {
        showSuccess('Logged Out', backendMessage, 1500);
      }

      // Remove cookies
      Cookies.remove('authToken');
      Cookies.remove('role');

      // Remove localStorage items
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenExpiresAt');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('impersonationData');
      sessionStorage.removeItem('tempToken');

      setIsImpersonating(false);
      setImpersonationData(null);
      setUser(null);
      router.push('/login');
    },
    [router, user]
  );

  useEffect(() => {
    if (!user) return;

    // Fetch fresh profile image to ensure Sidebar is up to date
    const refreshProfileImage = async () => {
      try {
        const imageResponse = await userService.getProfileImage();
        const freshAvatar =
          imageResponse?.profile_picture || imageResponse?.avatar || imageResponse?.url;

        if (freshAvatar && freshAvatar !== user.profile_picture && freshAvatar !== user.avatar) {
          const updatedUser = {
            ...user,
            profile_picture: freshAvatar,
            avatar: freshAvatar, // Maintain backward compatibility if needed
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Failed to refresh profile image', error);
      }
    };

    // Run once on mount (per user session)
    refreshProfileImage();

    const checkTokenExpiry = () => {
      const expiresAt = localStorage.getItem('authTokenExpiresAt');
      if (!expiresAt) return;

      const expiryTime = new Date(expiresAt).getTime();
      const currentTime = Date.now();
      const timeLeft = expiryTime - currentTime;

      if (timeLeft <= 0) {
        logout('expired');
        return;
      }
    };

    const intervalId = setInterval(checkTokenExpiry, 5000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

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

  // Impersonation methods
  const startImpersonation = useCallback(
    async (userId) => {
      try {
        const response = await impersonationService.startImpersonation(userId);

        const data = response.success && response.data ? response.data : response;

        if (data && data.token) {
          const { token, refresh_token, token_type, impersonated_user, original_admin } = data;

          // Store impersonation token
          localStorage.setItem('authToken', token);
          localStorage.setItem('tokenType', 'impersonation'); // Force 'impersonation' for detection on refresh
          localStorage.setItem('refreshToken', refresh_token);

          // Store impersonation context
          const impData = {
            impersonated_user,
            original_admin,
            started_at: new Date().toISOString(),
          };
          localStorage.setItem('impersonationData', JSON.stringify(impData));

          // Update cookies
          Cookies.set('authToken', token, { expires: 1 });
          Cookies.set('role', impersonated_user.role, { expires: 1 });

          // Update auth user in localStorage to satisfy direct reads in other components
          const normalizedImpersonatedUser = {
            ...impersonated_user,
            role: normalizeRole(impersonated_user.role),
          };
          localStorage.setItem('user', JSON.stringify(normalizedImpersonatedUser));

          // Update expiry time to prevent immediate logout if admin was old
          const defaultDuration = 3600 * 1000; // 1 hour for impersonation
          const expiryTime = new Date(Date.now() + defaultDuration).toISOString();
          localStorage.setItem('authTokenExpiresAt', expiryTime);

          // Update state
          setIsImpersonating(true);
          setImpersonationData(impData);
          setUser(normalizedImpersonatedUser);

          showSuccess('Impersonation Started', `Now viewing as ${impersonated_user.email}`);

          router.push('/dashboard');
          router.refresh();

          return { success: true };
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

        // Restore admin token
        localStorage.setItem('authToken', token);
        localStorage.setItem('tokenType', token_type || 'Bearer');
        localStorage.setItem('refreshToken', refresh_token);

        // Clear impersonation data
        localStorage.removeItem('impersonationData');

        // Update cookies
        Cookies.set('authToken', token, { expires: 7 });
        Cookies.set('role', adminUser.role, { expires: 7 });

        // Restore admin user in localStorage
        const normalizedAdminUser = {
          ...adminUser,
          role: normalizeRole(adminUser.role),
        };
        localStorage.setItem('user', JSON.stringify(normalizedAdminUser));

        // Refresh expiry time for admin session
        const adminDuration = 7 * 24 * 3600 * 1000; // 7 days
        const adminExpiryTime = new Date(Date.now() + adminDuration).toISOString();
        localStorage.setItem('authTokenExpiresAt', adminExpiryTime);

        // Update state
        setIsImpersonating(false);
        setImpersonationData(null);
        setUser(normalizedAdminUser);

        showSuccess('Impersonation Ended', 'Returned to admin session');

        // Redirect to users page
        router.push('/users');
        router.refresh();

        return { success: true };
      }
    } catch (error) {
      console.error('Impersonation exit failed:', error);
      const message = error.response?.data?.message || 'Failed to exit impersonation';
      showWarning('Exit Failed', message);
      throw error;
    }
  }, [router]);

  const authValue = useMemo(
    () => ({
      user,
      login,
      socialLogin,
      logout,
      updateProfile,
      isImpersonating,
      impersonationData,
      startImpersonation,
      exitImpersonation,
    }),
    [
      user,
      login,
      socialLogin,
      logout,
      updateProfile,
      isImpersonating,
      impersonationData,
      startImpersonation,
      exitImpersonation,
    ]
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
