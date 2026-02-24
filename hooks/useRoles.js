import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roleService from '@/services/roleService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const roleKeys = {
  all: ['roles'],
  lists: () => [...roleKeys.all, 'list'],
  list: (filters) => [...roleKeys.lists(), { filters }],
  details: () => [...roleKeys.all, 'detail'],
  detail: (id) => [...roleKeys.details(), id],
  permissions: () => [...roleKeys.all, 'permissions'],
};

/**
 * Fetch all roles
 */
export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => roleService.getAllRoles(params),
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.roles)) return data.roles;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.roles)) return data.data.roles;
      return data?.roles || data?.data || data;
    },
  });
};

/**
 * Fetch single role by ID
 */
export const useRole = (id) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: !!id,
    select: (data) => data?.role || data?.data?.role || data?.data || data,
  });
};

/**
 * Fetch all permissions
 */
export const usePermissions = (params) => {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => permissionService.getAllPermissions(params),
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.permissions)) return data.permissions;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.permissions)) return data.data.permissions;
      return data?.permissions || data?.data || data;
    },
    staleTime: 10 * 60 * 1000, // Permissions rarely change, cache for 10 minutes
  });
};

/**
 * Create role mutation
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData) => roleService.create(roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      showSuccess('Success', 'Role created successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to create role');
    },
  });
};

/**
 * Update role mutation
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => roleService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      showSuccess('Success', 'Role updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update role');
    },
  });
};

/**
 * Delete role mutation
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => roleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      showSuccess('Success', 'Role deleted successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to delete role');
    },
  });
};

export default {
  useRoles,
  useRole,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
};
