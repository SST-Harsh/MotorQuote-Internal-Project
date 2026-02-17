'use client';
import React, { useMemo } from 'react';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  ClipboardCheck,
  Users,
  UserCog,
  Settings,
  Edit2,
  Bell,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

export default function UnifiedDashboardLayout({ children }) {
  const { user } = useAuth();

  const sidebarSections = useMemo(() => {
    if (!user) return [];

    if (user.role === 'admin' || user.role === 'super_admin') {
      return [
        {
          title: 'Management',
          items: [
            { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
            {
              label: 'Dealerships',
              icon: <Building2 size={20} />,
              badge: 12,
              href: '/dealerships',
            },
            { label: 'Quotes', icon: <FileText size={20} />, badge: 58, href: '/quotes' },
            {
              label: 'Approvals',
              icon: <ClipboardCheck size={20} />,
              badge: 7,
              href: '/approvals',
            },
          ],
        },
        {
          title: 'Users',
          items: [
            { label: 'Managers', icon: <Users size={20} />, href: '/users' },
            { label: 'Sellers', icon: <UserCog size={20} />, href: '/sellers' },
            { label: 'Roles & Permissions', icon: <Edit2 size={20} />, href: '/roles' },
            { label: 'Notifications', icon: <Bell size={20} />, href: '/notifications' },
            { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
          ],
        },
      ];
    }

    if (user.role === 'dealer') {
      return [
        {
          title: 'Menu',
          items: [
            { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
            { label: 'My Quotes', icon: <MessageSquare size={20} />, href: '/quotes' },
            { label: 'Inventory', icon: <BookOpen size={20} />, href: '/inventory' },
          ],
        },
        {
          title: 'Account',
          items: [{ label: 'Settings', icon: <Users size={20} />, href: '/settings' }],
        },
      ];
    }

    return [];
  }, [user]);

  const displayUser = useMemo(
    () =>
      user
        ? {
            name: user.name || (user.role === 'dealer' ? 'Dealer Agent' : 'Admin User'),
            role: user.role,
            avatar:
              user.avatar ||
              (user.role === 'dealer'
                ? 'https://i.pravatar.cc/80?img=47'
                : 'https://i.pravatar.cc/80?img=33'),
          }
        : null,
    [user]
  );

  return (
    <ProtectedRoute roles={['admin', 'super_admin', 'dealer']}>
      <DashboardLayout
        user={displayUser}
        sidebarSections={sidebarSections}
        title={user?.role === 'dealer' ? 'Dealer Portal' : 'MotorQuote Platform'}
      >
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
