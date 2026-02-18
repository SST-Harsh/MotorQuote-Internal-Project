import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import cmsService from '@/services/cmsService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const pricingConfigKeys = {
  all: ['pricingConfigs'],
  lists: () => [...pricingConfigKeys.all, 'list'],
  list: (category) => [...pricingConfigKeys.lists(), { category }],
  details: () => [...pricingConfigKeys.all, 'detail'],
  detail: (id) => [...pricingConfigKeys.details(), id],
  categories: () => [...pricingConfigKeys.all, 'categories'],
  byKey: (key) => [...pricingConfigKeys.all, 'key', key],
};

/**
 * Fetch all pricing configs (optionally filtered by category)
 */
const selectConfigs = (response) => {
  // Robust data extraction
  if (Array.isArray(response)) return response;
  if (response.configs && Array.isArray(response.configs)) return response.configs;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.data?.configs && Array.isArray(response.data.configs)) return response.data.configs;
  if (response.data?.configurations && Array.isArray(response.data.configurations))
    return response.data.configurations;
  return [];
};

export const usePricingConfigs = (category = '') => {
  return useQuery({
    queryKey: pricingConfigKeys.list(category),
    queryFn: () => cmsService.getPricingConfigs(category),
    select: selectConfigs,
  });
};

/**
 * Fetch pricing categories
 */
export const usePricingCategories = () => {
  return useQuery({
    queryKey: pricingConfigKeys.categories(),
    queryFn: cmsService.getPricingCategories,
    select: (response) => {
      if (Array.isArray(response)) return response;
      if (response.categories && Array.isArray(response.categories)) return response.categories;
      if (response.data && Array.isArray(response.data)) return response.data;
      return [];
    },
    staleTime: 5 * 60 * 1000, // Categories don't change often, cache for 5 minutes
  });
};

/**
 * Fetch pricing config by key
 */
export const usePricingConfigByKey = (key) => {
  return useQuery({
    queryKey: pricingConfigKeys.byKey(key),
    queryFn: () => cmsService.getConfigByKey(key),
    enabled: !!key,
    select: (response) => response?.data || response,
  });
};

/**
 * Create pricing config mutation
 */
export const useCreatePricingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configData) => cmsService.createPricingConfig(configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingConfigKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pricingConfigKeys.categories() });
      showSuccess('Success', 'Pricing config created successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to create pricing config');
    },
  });
};

/**
 * Update pricing config mutation
 */
export const useUpdatePricingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => cmsService.updatePricingConfig(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pricingConfigKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: pricingConfigKeys.lists() });
      showSuccess('Success', 'Pricing config updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update pricing config');
    },
  });
};

/**
 * Delete pricing config mutation
 */
export const useDeletePricingConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cmsService.deletePricingConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingConfigKeys.lists() });
      showSuccess('Success', 'Pricing config deleted successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to delete pricing config');
    },
  });
};

export default {
  usePricingConfigs,
  usePricingCategories,
  usePricingConfigByKey,
  useCreatePricingConfig,
  useUpdatePricingConfig,
  useDeletePricingConfig,
};
