import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import cmsService from '@/services/cmsService';
import { showSuccess, showError } from '@/utils/toast';

// Query key factory for organized cache management
export const apiKeysQueryKeys = {
  all: ['apiKeys'],
  lists: () => [...apiKeysQueryKeys.all, 'list'],
  list: (filters) => [...apiKeysQueryKeys.lists(), { filters }],
  details: () => [...apiKeysQueryKeys.all, 'detail'],
  detail: (id) => [...apiKeysQueryKeys.details(), id],
};

/**
 * Fetch all API keys
 */
export function useApiKeys() {
  return useQuery({
    queryKey: apiKeysQueryKeys.lists(),
    queryFn: async () => {
      const data = await cmsService.getApiKeys();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch single API key by ID
 */
export function useApiKey(id) {
  return useQuery({
    queryKey: apiKeysQueryKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      return await cmsService.getApiKeyById(id);
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Create new API key mutation
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      return await cmsService.createApiKey(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      showSuccess('API key created successfully');
      return data;
    },
    onError: (error) => {
      console.error('Error creating API key:', error);
      showError('Failed to create API key');
    },
  });
}

/**
 * Update API key mutation
 */
export function useUpdateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await cmsService.updateApiKey(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.detail(variables.id) });
      showSuccess('API key updated successfully');
    },
    onError: (error) => {
      console.error('Error updating API key:', error);
      showError('Failed to update API key');
    },
  });
}

/**
 * Revoke API key mutation
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await cmsService.revokeApiKey(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      showSuccess('API key revoked successfully');
    },
    onError: (error) => {
      console.error('Error revoking API key:', error);
      showError('Failed to revoke API key');
    },
  });
}

/**
 * Regenerate API secret mutation
 */
export function useRegenerateApiSecret() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await cmsService.regenerateApiSecret(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiKeysQueryKeys.lists() });
      // Don't show success toast here - will be shown in component with the new secret
      return data;
    },
    onError: (error) => {
      console.error('Error regenerating API secret:', error);
      showError('Failed to regenerate API secret');
    },
  });
}
