'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminSettings = dynamic(() => import('@/components/views/settings/SuperAdminSettings'));
const DealerSettings = dynamic(() => import('@/components/views/settings/DealerSettings'));
const SupportStaffSettings = dynamic(
  () => import('@/components/views/settings/SupportStaffSettings')
);

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view settings.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminSettings />;
    case 'dealer_manager':
      return <DealerSettings />;
    case 'support_staff':
      return <SupportStaffSettings />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
