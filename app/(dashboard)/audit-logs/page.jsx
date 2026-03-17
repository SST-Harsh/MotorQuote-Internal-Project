'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminAuditLogs = dynamic(
  () => import('@/components/views/audit-logs/SuperAdminAuditLogs')
);

export default function AuditLogsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminAuditLogs />;
    default:
      return (
        <div className="p-8 text-center text-red-500 font-bold">
          Access Denied. This page is restricted.
        </div>
      );
  }
}
