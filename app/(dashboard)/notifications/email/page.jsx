'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const EmailNotificationsView = dynamic(
  () => import('@/components/views/super-admin/EmailNotificationsView')
);
const AdminEmailListView = dynamic(() => import('@/components/views/admin/AdminEmailListView'));

export default function EmailNotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-8">Please log in.</div>;
  }

  // Role-based rendering controller
  switch (user.role) {
    case 'super_admin':
      return <EmailNotificationsView />;
    case 'admin':
      return <AdminEmailListView />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied. This page is for Admins and Super Admins only.
        </div>
      );
  }
}
