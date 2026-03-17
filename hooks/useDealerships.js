import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dealershipService from '@/services/dealershipService';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { normalizeRole } from '@/utils/roleUtils';

/**
 * Query Keys
 */
export const dealershipKeys = {
  all: ['dealerships'],
  lists: (isAdmin) => [...dealershipKeys.all, 'list', { isAdmin }],
  list: (filters, isAdmin) => [...dealershipKeys.lists(isAdmin), { filters }],
  details: (isAdmin) => [...dealershipKeys.all, 'detail', { isAdmin }],
  detail: (id, isAdmin) => [...dealershipKeys.details(isAdmin), id],
};

/**
 * Fetch all dealerships
 */
export const useDealerships = (params = {}, options = {}) => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'super_admin';

  return useQuery({
    queryKey: dealershipKeys.list(params, isAdmin),
    queryFn: () => dealershipService.getAllDealerships(params, isAdmin),
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.dealerships)) return data.dealerships;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.dealerships)) return data.data.dealerships;
      return data?.dealerships || data?.data || data;
    },
    ...options,
  });
};

/**
 * Fetch single dealership by ID
 */
export const useDealership = (id) => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'super_admin';

  return useQuery({
    queryKey: dealershipKeys.detail(id, isAdmin),
    queryFn: () => dealershipService.getById(id, isAdmin),
    enabled: !!id,
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.dealerships)) return data.dealerships;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.data?.dealerships)) return data.data.dealerships;
      return data?.dealerships || data?.data || data;
    },
  });
};

/**
 * Create dealership mutation
 */
export const useCreateDealership = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'super_admin';

  return useMutation({
    mutationFn: (dealershipData) => dealershipService.createDealership(dealershipData, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.all });
      showSuccess('Success', 'Dealership created successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to create dealership');
    },
  });
};

/**
 * Update dealership mutation
 */
export const useUpdateDealership = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'super_admin';

  return useMutation({
    mutationFn: ({ id, data }) => dealershipService.updateDealership(id, data, isAdmin),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.all });
      showSuccess('Success', 'Dealership updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update dealership');
    },
  });
};

/**
 * Delete dealership mutation
 */
export const useDeleteDealership = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'super_admin';

  return useMutation({
    mutationFn: (id) => dealershipService.deleteDealership(id, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.all });
      showSuccess('Success', 'Dealership deleted successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to delete dealership');
    },
  });
};

export default {
  useDealerships,
  useDealership,

  useCreateDealership,
  useUpdateDealership,
  useDeleteDealership,
};
