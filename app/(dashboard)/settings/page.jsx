'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminSettings = dynamic(() => import('@/components/views/settings/SuperAdminSettings'));
const AdminSettings = dynamic(() => import('@/components/views/settings/AdminSettings'));
const DealerSettings = dynamic(() => import('@/components/views/settings/DealerSettings'));

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view settings.</div>;
  }

  // Role-based rendering controller
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminSettings />;
    case 'admin':
      return <AdminSettings />;
    case 'dealer_manager':
      return <DealerSettings />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
