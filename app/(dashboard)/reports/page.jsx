'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

import { canViewReports } from '@/utils/roleUtils';
import AccessDenied from '@/components/common/AccessDenied';

const SuperAdminReportView = dynamic(
  () => import('@/components/views/report/SuperAdminReportView')
);
const DealerReportView = dynamic(() => import('@/components/views/report/DealerReportView'));

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  // Check if user has permission to view reports
  const hasAccess = canViewReports(user);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminReportView />;
    case 'dealer_manager':
      return <DealerReportView />;
    default:
      return (
        <AccessDenied
          message={`Access Denied: Role (${user.role}) is not authorized for this view.`}
        />
      );
  }
}
