import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dealershipService from '@/services/dealershipService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const dealershipKeys = {
  all: ['dealerships'],
  lists: () => [...dealershipKeys.all, 'list'],
  list: (filters) => [...dealershipKeys.lists(), { filters }],
  details: () => [...dealershipKeys.all, 'detail'],
  detail: (id) => [...dealershipKeys.details(), id],
};

/**
 * Fetch all dealerships
 */
export const useDealerships = (params = {}, options = {}) => {
  return useQuery({
    queryKey: dealershipKeys.list(params),
    queryFn: () => dealershipService.getAllDealerships(params),
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
  return useQuery({
    queryKey: dealershipKeys.detail(id),
    queryFn: () => dealershipService.getById(id),
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

  return useMutation({
    mutationFn: (dealershipData) => dealershipService.createDealership(dealershipData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.lists() });
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

  return useMutation({
    mutationFn: ({ id, data }) => dealershipService.updateDealership(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dealershipKeys.lists() });
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

  return useMutation({
    mutationFn: (id) => dealershipService.deleteDealership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.lists() });
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
