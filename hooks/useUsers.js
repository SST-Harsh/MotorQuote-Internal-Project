import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '@/services/userService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  activities: (id) => [...userKeys.detail(id), 'activities'],
  suspended: () => [...userKeys.all, 'suspended'],
};

/**
 * Fetch all users
 */
export const useUsers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getAllUsers(params),
    select: (data) => data?.data || data,
    ...options,
  });
};

/**
 * Fetch single user by ID
 */
export const useUser = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id, // Only fetch if ID exists
    select: (data) => data?.user || data?.data || data,
  });
};

/**
 * Create user mutation
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess('Success', 'User created successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to create user');
    },
  });
};

/**
 * Update user mutation
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: (data, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess('Success', 'User updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update user');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess('Success', 'User deleted successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to delete user');
    },
  });
};

export const useUserActivities = (id, params = {}) => {
  return useQuery({
    queryKey: userKeys.activities(id),
    queryFn: () => userService.getUserActivities(id, params),
    enabled: !!id,
    select: (data) => data?.activities || data?.data || [],
  });
};

export const useUserLoginHistory = (id, params = {}) => {
  return useQuery({
    queryKey: [...userKeys.detail(id), 'login-history'],
    queryFn: () => userService.getUserLoginHistory(id, params),
    enabled: !!id,
    select: (data) => data?.data || data || [],
  });
};

/**
 * Fetch suspended users
 */
export const useSuspendedUsers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.suspended(),
    queryFn: () => userService.getSuspendedUsers(params),
    select: (data) => {
      // Handle different response formats
      const usersArray = Array.isArray(data)
        ? data
        : data?.users || data?.data?.users || data?.data || [];
      return usersArray;
    },
    ...options,
  });
};

/**
 * Suspend user mutation
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }) => userService.suspendUser(userId, reason),
    onSuccess: () => {
      // Invalidate users list and suspended users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.suspended() });
      showSuccess('Success', 'User has been suspended');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to suspend user');
    },
  });
};

/**
 * Restore user mutation
 */
export const useRestoreUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => userService.restoreUser(userId),
    onSuccess: () => {
      // Invalidate users list and suspended users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.suspended() });
      showSuccess('Success', 'User has been restored');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to restore user');
    },
  });
};

/**
 * Bulk Activate Users mutation
 */
export const useBulkActivateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds) => userService.bulkActivate(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.suspended() });
      showSuccess('Success', 'Selected users have been activated');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to activate users');
    },
  });
};

/**
 * Bulk Deactivate Users mutation
 */
export const useBulkDeactivateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds) => userService.bulkDeactivate(userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.suspended() });
      showSuccess('Success', 'Selected users have been deactivated');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to deactivate users');
    },
  });
};
export const useEnable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => userService.enable2FA(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess('Success', '2FA enabled for user');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to enable 2FA');
    },
  });
};

/**
 * Disable 2FA for individual user
 */
export const useDisable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => userService.disable2FA(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      showSuccess('Success', '2FA disabled for user');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to disable 2FA');
    },
  });
};

export default {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserActivities,
  useUserLoginHistory,
  useSuspendedUsers,
  useSuspendUser,
  useRestoreUser,
  useBulkActivateUsers,
  useBulkDeactivateUsers,
};
