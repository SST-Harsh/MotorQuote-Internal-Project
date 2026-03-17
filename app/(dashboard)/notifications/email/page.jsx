'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const EmailNotificationsView = dynamic(
  () => import('@/components/views/super-admin/EmailNotificationsView')
);

export default function EmailNotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return <EmailNotificationsView />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for Super Admins only.
        </div>
      );
  }
}
