'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminSupportView = dynamic(
  () => import('@/components/views/support/SuperAdminSupportView')
);
const DealerSupportView = dynamic(() => import('@/components/views/support/DealerSupportView'));
const SupportStaffSupportView = dynamic(
  () => import('@/components/views/support/SupportStaffSupportView')
);

export default function SupportPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="p-8">Please log in.</div>
      </div>
    );
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminSupportView />;
    case 'dealer_manager':
    case 'dealer_staff':
      return <DealerSupportView />;
    case 'support_staff':
      return <SupportStaffSupportView />;
    default:
      return <div className="p-8 text-center text-red-500">Access Denied.</div>;
  }
}
