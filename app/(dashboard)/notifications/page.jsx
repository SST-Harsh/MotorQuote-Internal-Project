'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

import { canViewNotifications } from '@/utils/roleUtils';
import AccessDenied from '@/components/common/AccessDenied';

const SuperAdminNotifications = dynamic(
  () => import('@/components/views/notifications/SuperAdminNotifications'),
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

  // Support staff and dealer roles can always view notifications
  const role = user?.role;
  const isAuthorizedRole = [
    'super_admin',
    'dealer',
    'dealer_manager',
    'dealer_admin',
    'support_staff',
    'staff',
  ].includes(role);

  // Check if user has permission to view notifications
  const hasAccess = isAuthorizedRole || canViewNotifications(user);

  if (!hasAccess) {
    return (
      <AccessDenied
        message={`Access Denied: Role (${role}) does not have permission to view notifications.`}
      />
    );
  }

  switch (user.role) {
    case 'super_admin':
      return <SuperAdminNotifications />;
    case 'dealer':
    case 'dealer_manager':
    case 'support_staff':
      return <DealerNotifications />;
    default:
      return (
        <AccessDenied message={`Access Denied: Role (${user.role}) does not have permission.`} />
      );
  }
}
