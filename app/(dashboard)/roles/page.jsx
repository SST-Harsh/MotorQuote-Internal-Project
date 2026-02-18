'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import roleService from '@/services/roleService';
import Swal from 'sweetalert2';

const RolePermissionView = dynamic(
  () => import('@/components/views/super-admin/RolePermissionView')
);

export default function RolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [permsData, rolesData] = await Promise.all([
        roleService.getAllPermissions(),
        roleService.getAllRoles(),
      ]);
      const extractedPerms = Array.isArray(permsData)
        ? permsData
        : permsData?.permissions || permsData?.data || permsData?.data?.permissions || [];
      const extractedRoles = Array.isArray(rolesData)
        ? rolesData
        : rolesData?.roles || rolesData?.data || [];

      setAllPermissions(extractedPerms);
      setRoles(extractedRoles);
    } catch (error) {
      console.error('Failed to load roles/permissions', error);
      Swal.fire('Error', 'Failed to load access control data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchData();
    }
  }, [user, fetchData]);

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  const commonProps = {
    roles,
    permissions: allPermissions,
    loading: isLoading,
    onRefresh: fetchData,
  };

  // Role-based rendering controller
  switch (user.role) {
    case 'super_admin':
      return <RolePermissionView {...commonProps} />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for Super Admins only.
        </div>
      );
  }
}
