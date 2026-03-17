'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminTrashPage = dynamic(() => import('@/components/views/trash/SuperAdminTrashPage'));

const DealerTrashPage = dynamic(() => import('@/components/views/trash/DealerTrashPage'));

export default function TrashPage() {
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
      return <SuperAdminTrashPage />;
    case 'dealer_manager':
    case 'dealer_staff':
      return <DealerTrashPage />;
    default:
      return <div className="p-8 text-center text-red-500">Access Denied.</div>;
  }
}
