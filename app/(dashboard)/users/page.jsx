'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
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
const AdminUsers = dynamic(() => import('@/components/views/users/AdminUsers'));
const StaffManagement = dynamic(() => import('@/components/views/users/StaffManagement'));

export default function UsersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activeFilters, setActiveFilters] = useState({
    name: '',
    roles: [],
    statuses: [],
    dealership: '',
    tags: [],
  });

  const queryParams = {
    page,
    limit,
    search: activeFilters.name,
    role_ids: activeFilters.roles,
    status: activeFilters.statuses,
    tag_ids: activeFilters.tags,
    dealership_id: activeFilters.dealership,
  };

  if (user?.role === 'admin' && !activeFilters.dealership) {
    const dealerId = user.dealership?.id || user.dealership_id || user.dealership;
    if (dealerId) {
      queryParams.dealership_id = dealerId;
    }
  }

  const isDealerManager = user?.role === 'dealer_manager';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  // User Management Hooks (Global)
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

  const totalUsers = usersData?.total || usersData?.totalUsers || users.length;

  console.log('[UsersPage] Debug:', {
    isDealerManager,
    userRole: user?.role,
    usersDataLength: Array.isArray(usersData) ? usersData.length : 'Not Array',
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
  // Filter dealerships based on role
  const filteredDealerships = isAdmin
    ? dealershipsArray.filter(
        (d) =>
          d.id === (user.dealership?.id || user.dealership_id) ||
          d.dealer_owner === user?.id ||
          d.dealer_owner_name === user?.id ||
          d.primary_admin_id === user?.id ||
          d.dealer?.id === user?.id
      )
    : isDealerManager && user?.dealership_id
      ? dealershipsArray.filter((d) => d.id === (user.dealership?.id || user.dealership_id))
      : dealershipsArray;

  const commonProps = {
    users,
    roles,
    permissions,
    dealerships: filteredDealerships,
    loading: isLoading,
    onRefresh: refetchUsers,
    serverSide: true,
    serverTotalPages: Math.ceil(totalUsers / limit),
    serverCurrentPage: page,
    onServerPageChange: setPage,
    onSave: handleSaveUser,
    onAction: handleAction,
    assignedDealerships: filteredDealerships,
    activeFilters,
    setActiveFilters,
  };

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminUsers {...commonProps} />;
    case 'admin':
      return <AdminUsers {...commonProps} />;
    case 'dealer_manager':
      return <StaffManagement {...commonProps} />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
