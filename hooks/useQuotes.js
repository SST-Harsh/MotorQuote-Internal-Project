import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import quoteService from '@/services/quoteService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const quoteKeys = {
  all: ['quotes'],
  lists: () => [...quoteKeys.all, 'list'],
  list: (filters) => [...quoteKeys.lists(), { filters }],
  details: () => [...quoteKeys.all, 'detail'],
  detail: (id) => [...quoteKeys.details(), id],
};

/**
 * Fetch all quotes
 */
export const useQuotes = (params = {}) => {
  return useQuery({
    queryKey: quoteKeys.list(params),
    queryFn: () => quoteService.getQuotes(params),
    select: (data) => data?.data || data,
  });
};

/**
 * Fetch single quote by ID
 */
export const useQuote = (id) => {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => quoteService.getQuoteById(id),
    enabled: !!id,
    select: (data) => data?.data || data,
  });
};

/**
 * Create quote mutation
 */
export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteData) => quoteService.createQuote(quoteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Quote created successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to create quote');
    },
  });
};

/**
 * Update quote mutation
 */
export const useUpdateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quoteService.updateQuote(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Quote updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update quote');
    },
  });
};

/**
 * Delete quote mutation
 */
export const useDeleteQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variable) => {
      // Support object with id and params, or just id string/number
      if (typeof variable === 'object' && variable !== null && variable.id) {
        const { id, ...params } = variable;
        return quoteService.deleteQuote(id, params);
      }
      return quoteService.deleteQuote(variable);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Quote deleted successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to delete quote');
    },
  });
};

/**
 * Patch quote mutation
 */
export const usePatchQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quoteService.patchQuote(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Quote updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to patch quote');
    },
  });
};

/**
 * Update status mutation
 */
export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      const { id, ...payload } = variables;
      return quoteService.updateStatus(id, payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Status updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update status');
    },
  });
};

/**
 * Override status mutation (Super Admin)
 */
export const useOverrideStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      const { id, ...payload } = variables;
      return quoteService.overrideStatus(id, payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      showSuccess('Success', 'Status overridden successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to override status');
    },
  });
};

/**
 * Fetch dashboard stats
 */
export const useDashboardStats = (params = {}) => {
  return useQuery({
    queryKey: [...quoteKeys.all, 'stats', params],
    queryFn: () => quoteService.getDashboardStats(params),
    select: (data) => data?.data || data,
  });
};

/**
 * Fetch recent activity
 */
export const useRecentActivity = (params = {}) => {
  return useQuery({
    queryKey: [...quoteKeys.all, 'activity', params],
    queryFn: () => quoteService.getRecentActivity(params),
    select: (data) => data?.data || data,
  });
};

/**
 * Fetch communication logs
 */
export const useCommunicationLogs = (id, params = {}) => {
  return useQuery({
    queryKey: [...quoteKeys.detail(id), 'logs', params],
    queryFn: () => quoteService.getCommunicationLogs(id, params),
    enabled: !!id,
    select: (data) => data?.data || data,
  });
};

/**
 * Add communication log mutation
 */
export const useAddCommunicationLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => quoteService.addCommunicationLog(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...quoteKeys.detail(variables.id), 'logs'] });
      showSuccess('Success', 'Log added successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to add log');
    },
  });
};

export default {
  useQuotes,
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  usePatchQuote,
  useUpdateStatus,
  useOverrideStatus,
  useDashboardStats,
  useRecentActivity,
  useCommunicationLogs,
  useAddCommunicationLog,
};
