'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const SuperAdminNotifications = dynamic(
  () => import('@/components/views/notifications/SuperAdminNotifications'),
  {
    ssr: false,
  }
);
const AdminNotifications = dynamic(
  () => import('@/components/views/notifications/AdminNotifications'),
  {
    ssr: false,
  }
);
const DealerNotifications = dynamic(
  () => import('@/components/views/notifications/DealerNotifications'),
  {
    ssr: false,
  }
);

export default function NotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in to view notifications.</div>;
  }

  // Role-based rendering controller
  switch (user.role) {
    case 'super_admin':
      return <SuperAdminNotifications />;
    case 'admin':
      return <AdminNotifications />;
    case 'dealer':
    case 'dealer_manager':
      return <DealerNotifications />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
