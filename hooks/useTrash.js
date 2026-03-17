import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import trashService from '@/services/trashService';
import { showSuccess, showError } from '@/utils/toast';

export const trashKeys = {
  all: ['trash'],
  lists: () => [...trashKeys.all, 'list'],
  list: (params) => [...trashKeys.lists(), { params }],
  summary: () => [...trashKeys.all, 'summary'],
};

/**
 * Hook for fetching trash items
 */
export const useTrashItems = (params = {}) => {
  return useQuery({
    queryKey: trashKeys.list(params),
    queryFn: () => trashService.getTrashItems(params),
    // keepPreviousData: true,
  });
};

/**
 * Hook for fetching trash summary
 */
export const useTrashSummary = () => {
  return useQuery({
    queryKey: trashKeys.summary(),
    queryFn: () => trashService.getTrashSummary(),
  });
};

/**
 * Hook for restoring an item from trash
 */
export const useRestoreTrashItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }) => trashService.restoreItem(type, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      showSuccess('Success', `${variables.type} restored successfully`);
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to restore item');
    },
  });
};

/**
 * Hook for permanently deleting an item from trash
 */
export const usePermanentDeleteTrashItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }) => trashService.permanentDelete(type, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      showSuccess('Success', `${variables.type} permanently deleted`);
    },
    onError: (error) => {
      showError('Error', error.response?.data?.error || 'Failed to delete item');
    },
  });
};
