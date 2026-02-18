import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import staffService from '@/services/staffService';
import { showSuccess, showError } from '@/utils/toast';

/**
 * Query Keys
 */
export const staffKeys = {
  all: ['staff'],
  lists: () => [...staffKeys.all, 'list'],
  list: (filters) => [...staffKeys.lists(), { filters }],
  details: () => [...staffKeys.all, 'detail'],
  detail: (id) => [...staffKeys.details(), id],
  performance: (id) => [...staffKeys.detail(id), 'performance'],
};

/**
 * Fetch all staff
 */
export const useStaffList = (params = {}, options = {}) => {
  return useQuery({
    queryKey: staffKeys.list(params),
    queryFn: () => staffService.getAllStaff(params),
    select: (data) => data?.data?.staff || data?.data || data,
    ...options,
  });
};

/**
 * Fetch single staff by ID
 */
export const useStaffMember = (id) => {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => staffService.getStaffById(id),
    enabled: !!id,
    select: (data) => data?.data || data,
  });
};

/**
 * Invite staff mutation
 */
export const useInviteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffData) => staffService.inviteStaff(staffData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      showSuccess('Success', 'Staff member invited successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to invite staff');
    },
  });
};

/**
 * Update staff mutation
 */
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => staffService.updateStaff(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      showSuccess('Success', 'Staff member updated successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to update staff');
    },
  });
};

/**
 * Deactivate staff mutation
 */
export const useDeactivateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => staffService.deactivateStaff(id, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      showSuccess('Success', 'Staff member deactivated');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to deactivate staff');
    },
  });
};

/**
 * Reactivate staff mutation
 */
export const useReactivateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => staffService.reactivateStaff(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      showSuccess('Success', 'Staff member reactivated');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to reactivate staff');
    },
  });
};

/**
 * Fetch staff performance
 */
export const useStaffPerformance = (id, params = {}) => {
  return useQuery({
    queryKey: staffKeys.performance(id),
    queryFn: () => staffService.getStaffPerformance(id, params),
    enabled: !!id,
    select: (data) => data?.data || data,
  });
};

/**
 * Resend invitation mutation
 */
export const useResendInvitation = () => {
  return useMutation({
    mutationFn: (id) => staffService.resendInvitation(id),
    onSuccess: () => {
      showSuccess('Success', 'Invitation resent successfully');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to resend invitation');
    },
  });
};

/**
 * Cancel invitation mutation
 */
export const useCancelInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => staffService.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() });
      showSuccess('Success', 'Invitation cancelled');
    },
    onError: (error) => {
      showError('Error', error.response?.data?.message || 'Failed to cancel invitation');
    },
  });
};

export default {
  useStaffList,
  useStaffMember,
  useInviteStaff,
  useUpdateStaff,
  useDeactivateStaff,
  useReactivateStaff,
  useStaffPerformance,
  useResendInvitation,
  useCancelInvitation,
};
