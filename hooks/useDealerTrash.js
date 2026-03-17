import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import dealerTrashService from '@/services/dealerTrashService';
import { showSuccess, showError } from '@/utils/toast';

export const dealerTrashKeys = {
  all: ['dealerTrash'],
  lists: () => [...dealerTrashKeys.all, 'list'],
  list: (params) => [...dealerTrashKeys.lists(), { params }],
  summary: (params) => [...dealerTrashKeys.all, 'summary', params],
};

/**
 * Hook for fetching dealer trash items
 */
export const useDealerTrashItems = (params = {}) => {
  const { user } = useAuth();

  // Get dealership_id from user - check multiple possible locations
  const dealershipId =
    user?.dealership_id ||
    user?.roleDetails?.dealership_id ||
    user?.dealer_id ||
    user?.roleDetails?.dealer_id ||
    user?.dealership?.id;

  // Add dealership_id to params if available
  const enhancedParams = dealershipId ? { ...params, dealership_id: dealershipId } : params;

  return useQuery({
    queryKey: dealerTrashKeys.list(enhancedParams),
    queryFn: () => dealerTrashService.getTrashItems(enhancedParams),
  });
};

/**
 * Hook for fetching dealer trash summary
 */
export const useDealerTrashSummary = () => {
  const { user } = useAuth();

  // Get dealership_id from user - check multiple possible locations
  const dealershipId =
    user?.dealership_id ||
    user?.roleDetails?.dealership_id ||
    user?.dealer_id ||
    user?.roleDetails?.dealer_id ||
    user?.dealership?.id;

  // Add dealership_id to params if available
  const params = dealershipId ? { dealership_id: dealershipId } : {};

  return useQuery({
    queryKey: dealerTrashKeys.summary(params),
    queryFn: () => dealerTrashService.getTrashSummary(params),
  });
};

/**
 * Hook for restoring a quote from trash
 */
export const useRestoreQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId) => dealerTrashService.restoreQuote(quoteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'Quote restored successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to restore quote');
    },
  });
};

/**
 * Hook for permanently deleting a quote from trash
 */
export const usePermanentDeleteQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId) => dealerTrashService.permanentDeleteQuote(quoteId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'Quote permanently deleted');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to permanently delete quote');
    },
  });
};

/**
 * Hook for restoring a dealership from trash
 */
export const useRestoreDealership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealershipId) => dealerTrashService.restoreDealership(dealershipId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'Dealership restored successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to restore dealership');
    },
  });
};

/**
 * Hook for permanently deleting a dealership from trash
 */
export const usePermanentDeleteDealership = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealershipId) => dealerTrashService.permanentDeleteDealership(dealershipId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'Dealership permanently deleted');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to permanently delete dealership');
    },
  });
};

/**
 * Hook for restoring a user from trash
 */
export const useRestoreUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => dealerTrashService.restoreUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'User restored successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to restore user');
    },
  });
};

/**
 * Hook for permanently deleting a user from trash
 */
export const usePermanentDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => dealerTrashService.permanentDeleteUser(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealerTrashKeys.all });
      showSuccess('Success', 'User permanently deleted');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to permanently delete user');
    },
  });
};

export default {
  useDealerTrashItems,
  useDealerTrashSummary,
  useRestoreQuote,
  usePermanentDeleteQuote,
  useRestoreDealership,
  usePermanentDeleteDealership,
  useRestoreUser,
  usePermanentDeleteUser,
};
