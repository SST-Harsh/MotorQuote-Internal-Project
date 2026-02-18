'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminDealerships = dynamic(
  () => import('@/components/views/dealerships/SuperAdminDealerships'),
  {
    ssr: false,
  }
);
const AdminDealerships = dynamic(() => import('@/components/views/dealerships/AdminDealerships'), {
  ssr: false,
});

export default function DealershipsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view dealerships.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminDealerships />;
    case 'admin':
      return <AdminDealerships />;
    case 'dealer':
      return (
        <div className="p-8 text-center text-gray-500">
          Dealership profile for Dealer role coming soon...
        </div>
      );
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
