'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
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

  // Build query params based on user role
  const queryParams = { page, limit };
  if (user?.role === 'admin') {
    const dealerId = user.dealership?.id || user.dealership_id || user.dealership;
    if (dealerId) {
      queryParams.dealership_id = dealerId;
    }
  }

  // Fetch data using React Query hooks
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers(queryParams);

  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();

  const { data: dealerships = [], isLoading: dealershipsLoading } = useDealerships();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // Extract users and total from response
  const users = Array.isArray(usersData) ? usersData : usersData?.users || usersData?.data || [];
  const totalUsers = usersData?.total || usersData?.totalUsers || users.length;

  // Combined loading state
  const isLoading = usersLoading || rolesLoading || permissionsLoading || dealershipsLoading;

  // Handle save user
  const handleSaveUser = async (formData) => {
    try {
      await createUser.mutateAsync(formData);
      refetchUsers();
    } catch (error) {
      console.error('Failed to save user', error);
    }
  };

  // Handle user actions
  const handleAction = async (action, data) => {
    try {
      if (action === 'delete') {
        await deleteUser.mutateAsync(data.id);
      } else if (action === 'suspend') {
        await updateUser.mutateAsync({
          id: data.id,
          data: { status: 'Suspended' },
        });
      } else if (action === 'activate') {
        await updateUser.mutateAsync({
          id: data.id,
          data: { status: 'Active' },
        });
      } else if (action === 'reset_password') {
        // Implement reset password
        console.log('Reset password for user:', data.id);
      }
      refetchUsers();
    } catch (error) {
      console.error('Failed to perform action', error);
    }
  };

  // Show loading skeleton
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

  // Check authentication
  if (!user) {
    return <div className="p-8">Please log in to view users.</div>;
  }

  // Common props for all views
  const commonProps = {
    users,
    roles,
    permissions,
    dealerships,
    loading: isLoading,
    onRefresh: refetchUsers,
    serverSide: true,
    serverTotalPages: Math.ceil(totalUsers / limit),
    serverCurrentPage: page,
    onServerPageChange: setPage,
    onSave: handleSaveUser,
    onAction: handleAction,
    assignedDealerships: dealerships,
  };

  // Render appropriate view based on role
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
