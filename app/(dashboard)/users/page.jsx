'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import {
  useStaffList,
  useInviteStaff,
  useUpdateStaff,
  useDeactivateStaff,
  useReactivateStaff,
} from '@/hooks/useStaff';
import { useRoles, usePermissions } from '@/hooks/useRoles';
import { useDealerships } from '@/hooks/useDealerships';
import { SkeletonTable } from '@/components/common/Skeleton';

const SuperAdminUsers = dynamic(() => import('@/components/views/users/SuperAdminUsers'));
const StaffManagement = dynamic(() => import('@/components/views/users/StaffManagement'));
const SupportStaffUsers = dynamic(() => import('@/components/views/users/SupportStaffUsers'));

export default function UsersPage() {
  const { user } = useAuth();
  const USER_FILTERS_KEY = 'super_admin_users_filters';

  const pathname = usePathname();
  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [activeFilters, setActiveFilters] = useState(() => {
    const defaultFilters = {
      name: '',
      roles: [],
      statuses: [],
      dealership: '',
      tags: [],
    };
    if (typeof window !== 'undefined' && isRefresh) {
      try {
        const saved = sessionStorage.getItem(USER_FILTERS_KEY);
        return saved ? JSON.parse(saved) : defaultFilters;
      } catch (_) {}
    }
    return defaultFilters;
  });

  // Sync activeFilters to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(USER_FILTERS_KEY, JSON.stringify(activeFilters));
    sessionStorage.setItem('app_last_path', pathname);
  }, [activeFilters, pathname]);

  // Build query params for non-search filters only (search is handled client-side by DataTable)
  const queryParams = {};

  const isDealerManager = user?.role === 'dealer_manager';
  const isSuperAdmin = user?.role === 'super_admin';

  // User Management Hooks (Global) — fetch all users, DataTable handles client-side search/pagination
  const {
    data: globalUsersData,
    isLoading: globalUsersLoading,
    refetch: refetchGlobalUsers,
  } = useUsers(queryParams, { enabled: !!user && !isDealerManager });
  const createGlobalUser = useCreateUser();
  const updateGlobalUser = useUpdateUser();
  const deleteGlobalUser = useDeleteUser();

  // Staff Management Hooks (Dealer Specific)
  const {
    data: staffData,
    isLoading: staffLoading,
    refetch: refetchStaff,
  } = useStaffList(queryParams, { enabled: !!user && isDealerManager });
  const inviteStaff = useInviteStaff();
  const updateStaff = useUpdateStaff();
  const deactivateStaff = useDeactivateStaff();
  const reactivateStaff = useReactivateStaff();

  // Select correct data and loading state
  const usersData = isDealerManager ? staffData : globalUsersData;
  const usersLoading = isDealerManager ? staffLoading : globalUsersLoading;
  const refetchUsers = isDealerManager ? refetchStaff : refetchGlobalUsers;

  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();

  const { data: dealerships = [], isLoading: dealershipsLoading } = useDealerships(
    {},
    { enabled: !!user && user.role !== 'dealer_manager' }
  );

  // Robustly extract users array based on role and response structure
  const users = isDealerManager
    ? Array.isArray(usersData)
      ? usersData
      : usersData?.staff || usersData?.data?.staff || usersData?.data || []
    : Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data?.users || usersData?.data || [];

  // Extract dealerships array robustly
  const dealershipsArray = Array.isArray(dealerships)
    ? dealerships
    : dealerships?.dealerships || dealerships?.data?.dealerships || dealerships?.data || [];

  console.log('[UsersPage] Debug:', {
    isDealerManager,
    userRole: user?.role,
    usersCount: users.length,
    isLoadingDetails: { usersLoading, rolesLoading, permissionsLoading, dealershipsLoading },
  });

  const isLoading = usersLoading || rolesLoading || permissionsLoading || dealershipsLoading;

  const handleSaveUser = async (formData) => {
    try {
      if (isDealerManager) {
        await inviteStaff.mutateAsync(formData);
      } else {
        await createGlobalUser.mutateAsync(formData);
      }
      refetchUsers();
    } catch (error) {
      console.error('Failed to save user', error);
    }
  };

  const handleAction = async (action, data) => {
    try {
      if (isDealerManager) {
        if (action === 'suspend') {
          await deactivateStaff.mutateAsync({ id: data.id, reason: 'Suspended via Dashboard' });
        } else if (action === 'activate') {
          await reactivateStaff.mutateAsync(data.id);
        } else if (action === 'edit') {
          // Update user handled by form save
        }
      } else {
        if (action === 'delete') {
          await deleteGlobalUser.mutateAsync(data.id);
        } else if (action === 'suspend') {
          await updateGlobalUser.mutateAsync({
            id: data.id,
            data: { is_active: false },
          });
        } else if (action === 'activate') {
          await updateGlobalUser.mutateAsync({
            id: data.id,
            data: { is_active: true },
          });
        }
      }
      refetchUsers();
    } catch (error) {
      console.error('Failed to perform action', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <SkeletonTable rows={10} columns={6} />
      </div>
    );
  }

  if (!user) {
    return <div className="p-8">Please log in to view users.</div>;
  }

  // For dealer_manager: use the dealerships from the auth user object (returned by the API on the user profile).
  // For super_admin: use the global dealerships API fetch.
  const filteredDealerships = isDealerManager
    ? Array.isArray(user?.dealerships)
      ? user.dealerships
      : user?.dealership
        ? [user.dealership]
        : []
    : dealershipsArray;

  const commonProps = {
    users,
    roles,
    permissions,
    dealerships: filteredDealerships,
    loading: isLoading,
    onRefresh: refetchUsers,
    onSave: handleSaveUser,
    onAction: handleAction,
    assignedDealerships: filteredDealerships,
    activeFilters,
    setActiveFilters,
  };

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminUsers {...commonProps} />;
    case 'dealer_manager':
      return <StaffManagement {...commonProps} />;
    case 'support_staff':
      return <SupportStaffUsers />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
