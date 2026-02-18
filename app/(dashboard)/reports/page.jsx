'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminReportView = dynamic(
  () => import('@/components/views/report/SuperAdminReportView')
);
const AdminReportView = dynamic(() => import('@/components/views/report/AdminReportView'));
const DealerReportView = dynamic(() => import('@/components/views/report/DealerReportView'));

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  switch (user.role) {
    case 'admin':
      return <AdminReportView />;
    case 'super_admin':
      return <SuperAdminReportView />;
    case 'dealer_manager':
      return <DealerReportView />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for authorized users only.
        </div>
      );
  }
}
