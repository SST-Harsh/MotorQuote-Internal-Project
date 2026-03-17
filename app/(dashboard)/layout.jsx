'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  BarChart,
  History,
  ClipboardClock,
  Shield,
  Bell,
  Megaphone,
  Mail,
  Settings,
  HelpCircle,
  Building2,
  BarChart2,
  Globe,
  Fingerprint,
  Tag,
  UserX,
  Trash2,
} from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/common/Sidebar';
import TopBar from '@/components/common/TopBar';
import SystemAlertBanner from '@/components/common/SystemAlertBanner';
import ImpersonationBanner from '@/components/common/ImpersonationBanner';
import {
  canViewNotifications,
  canCreateNotifications,
  canViewImpersonationLogs,
  canBroadcastNotifications,
} from '@/utils/roleUtils';

const DashboardInner = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const superAdminSections = [
    {
      title: 'Management',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Global Users', href: '/users', icon: <Users size={20} /> },
        { label: 'Suspended Users', href: '/suspended-users', icon: <UserX size={20} /> },
        { label: 'All Dealerships', href: '/dealerships', icon: <Car size={20} /> },
        { label: 'Quote Management', href: '/quotes', icon: <FileText size={20} /> },
        { label: 'Reports', href: '/reports', icon: <BarChart size={20} /> },
      ].filter(Boolean),
    },
    {
      title: 'System',
      items: [
        { label: 'Session Management', href: '/session_management', icon: <History size={20} /> },
        { label: 'Audit Logs', href: '/audit-logs', icon: <ClipboardClock size={20} /> },
        { label: 'Role Permissions', href: '/roles', icon: <Shield size={20} /> },
        { label: 'Tags', href: '/tags', icon: <Tag size={20} /> },
        canViewImpersonationLogs(user) && {
          label: 'Impersonation Logs',
          href: '/impersonation-history',
          icon: <Fingerprint size={20} />,
        },
        canViewNotifications(user) && {
          label: 'Notification Center',
          icon: <Bell size={20} />,
          subItems: [
            canBroadcastNotifications(user) && {
              label: 'Broadcasting',
              icon: <Megaphone size={18} />,
              href: '/notifications',
            },
            canCreateNotifications(user) && {
              label: 'Email Notifications',
              icon: <Mail size={18} />,
              href: '/notifications/email',
            },
          ].filter(Boolean),
        },
        {
          label: 'Content Management',
          icon: <FileText size={20} />,
          subItems: [
            { label: 'Web Content', href: '/cms', icon: <FileText size={18} /> },
            { label: 'Configurations', href: '/cms/config', icon: <Settings size={18} /> },
          ],
        },
        { label: 'Support', icon: <HelpCircle size={20} />, href: '/support' },
        { label: 'Trash', href: '/trash', icon: <Trash2 size={20} /> },
        { label: 'Global Settings', href: '/settings', icon: <Settings size={20} /> },
      ].filter(Boolean),
    },
  ];

  const dealerSections = [
    {
      title: 'Dealer Portal',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Quotes', href: '/quotes', icon: <FileText size={20} /> },
        { label: 'My Dealerships', href: '/dealerships', icon: <Building2 size={20} /> },
        { label: 'Staff Management', href: '/users', icon: <Users size={20} /> },
        { label: 'Reports', href: '/reports', icon: <BarChart size={20} /> },
        { label: 'Trash', href: '/trash', icon: <Trash2 size={20} /> },
      ].filter(Boolean),
    },
    {
      title: 'System',
      items: [
        { label: 'Session Management', icon: <History size={20} />, href: '/session_management' },
        { label: 'Notifications', icon: <Bell size={20} />, href: '/notifications' },
        { label: 'Support', icon: <HelpCircle size={20} />, href: '/support' },
        { label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
      ].filter(Boolean),
    },
  ];

  const supportStaffSections = [
    {
      title: 'Support Portal',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        // { label: "Trash", href: "/trash", icon: <Trash2 size={20} /> },
        { label: 'Notifications', href: '/notifications', icon: <Bell size={20} /> },
        { label: 'Support Tickets', href: '/support', icon: <HelpCircle size={20} /> },
        { label: 'Quotes', href: '/quotes', icon: <FileText size={20} /> },
        { label: 'User Lookup', href: '/users', icon: <Users size={20} /> },
        { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const getSections = () => {
    const role = user?.role;
    if (role === 'super_admin') return superAdminSections;
    if (['dealer_manager', 'dealer_admin', 'dealer', 'staff'].includes(role)) return dealerSections;
    if (role === 'support_staff') return supportStaffSections;
    return [];
  };

  return (
    <div className="flex h-screen bg-[rgb(var(--color-background))] overflow-hidden">
      <Sidebar
        sections={getSections()}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ps-[280px]">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <ImpersonationBanner />
        <SystemAlertBanner />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute
      roles={[
        'super_admin',
        'dealer_manager',
        'dealer_admin',
        'dealer',
        'user',
        'staff',
        'support_staff',
      ]}
    >
      <DashboardInner>{children}</DashboardInner>
    </ProtectedRoute>
  );
}
