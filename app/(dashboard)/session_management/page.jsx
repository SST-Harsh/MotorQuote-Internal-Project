'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminSessionManagementView = dynamic(
  () => import('@/components/views/session_management/SuperAdminSessionManagementView')
);
const AdminSessionManagementView = dynamic(
  () => import('@/components/views/session_management/AdminSessionManagementView')
);
const DealerSessionManagementView = dynamic(
  () => import('@/components/views/session_management/DealerSessionManagementView')
);

export default function SessionManagementPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminSessionManagementView />;
    case 'admin':
      return <AdminSessionManagementView />;
    case 'dealer_manager':
      return <DealerSessionManagementView />;
    default:
      // Allow dealer manager to see it if role is strictly checked, otherwise show access denied
      if (user.role === 'dealer_admin') return <DealerSessionManagementView />;
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for Administrators and Managers only.
        </div>
      );
  }
}
