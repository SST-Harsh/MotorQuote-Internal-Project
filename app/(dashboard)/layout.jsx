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
} from 'lucide-react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import Sidebar from '@/components/common/Sidebar';
import TopBar from '@/components/common/TopBar';
import LanguageOnboarding from '@/components/common/LanguageOnboarding';
import SystemAlertBanner from '@/components/common/SystemAlertBanner';
import ImpersonationBanner from '@/components/common/ImpersonationBanner';

const DashboardInner = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation('common');

  const superAdminSections = [
    {
      title: t('navigation.management'),
      items: [
        {
          label: t('navigation.dashboard'),
          href: '/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        { label: t('navigation.globalUsers'), href: '/users', icon: <Users size={20} /> },
        { label: t('navigation.allDealerships'), href: '/dealerships', icon: <Car size={20} /> },
        { label: t('navigation.quoteManagement'), href: '/quotes', icon: <FileText size={20} /> },
        { label: t('navigation.reports'), href: '/reports', icon: <BarChart size={20} /> },
      ],
    },
    {
      title: t('navigation.system'),
      items: [
        {
          label: t('navigation.sessionManagement'),
          href: '/session_management',
          icon: <History size={20} />,
        },
        {
          label: t('navigation.auditLogs'),
          href: '/audit-logs',
          icon: <ClipboardClock size={20} />,
        },
        { label: t('navigation.rolePermissions'), href: '/roles', icon: <Shield size={20} /> },
        { label: t('navigation.tags'), href: '/admin/tags', icon: <Tag size={20} /> },
        {
          label: t('navigation.impersonationLogs'),
          href: '/impersonation-history',
          icon: <Fingerprint size={20} />,
        },
        {
          label: t('navigation.notificationCenter.title'),
          icon: <Bell size={20} />,
          subItems: [
            {
              label: t('navigation.notificationCenter.broadcasting'),
              icon: <Megaphone size={18} />,
              href: '/notifications',
            },
            {
              label: t('navigation.notificationCenter.email'),
              icon: <Mail size={18} />,
              href: '/notifications/email',
            },
          ],
        },
        {
          label: t('navigation.contentManagement.title'),
          icon: <FileText size={20} />,
          subItems: [
            {
              label: t('navigation.contentManagement.webContent'),
              href: '/cms',
              icon: <FileText size={18} />,
            },
            {
              label: t('navigation.contentManagement.pricingConfig'),
              href: '/cms/config',
              icon: <Settings size={18} />,
            },
          ],
        },
        { label: t('navigation.support'), icon: <HelpCircle size={20} />, href: '/support' },
        { label: t('navigation.globalSettings'), href: '/settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const adminSections = [
    {
      title: t('navigation.management'),
      items: [
        {
          label: t('navigation.dashboard'),
          href: '/dashboard',
          icon: <LayoutDashboard size={20} />,
        }, // Unified Route
        {
          label: t('navigation.myDealerships'),
          href: '/dealerships',
          icon: <Building2 size={20} />,
        },
        { label: t('navigation.quotes'), href: '/quotes', icon: <FileText size={20} /> },
        { label: t('navigation.dealers'), href: '/users', icon: <Users size={20} /> },
        { label: t('navigation.analytics'), href: '/reports', icon: <BarChart2 size={20} /> },
      ],
    },
    {
      title: t('navigation.systemManagement'),
      items: [
        {
          label: t('navigation.sessions'),
          href: '/session_management',
          icon: <History size={20} />,
        },
        {
          label: t('navigation.auditLogs'),
          href: '/audit-logs',
          icon: <ClipboardClock size={20} />,
        },
        {
          label: t('navigation.notificationCenter.title'),
          icon: <Bell size={20} />,
          subItems: [
            {
              label: t('navigation.notificationCenter.broadcasting'),
              icon: <Megaphone size={18} />,
              href: '/notifications',
            },
            {
              label: t('navigation.notificationCenter.email'),
              icon: <Mail size={18} />,
              href: '/notifications/email',
            },
          ],
        },
        { label: t('navigation.support'), href: '/support', icon: <HelpCircle size={20} /> },
        { label: t('navigation.settings'), href: '/settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const dealerSections = [
    {
      title: t('navigation.dealerPortal'),
      items: [
        {
          label: t('navigation.dashboard'),
          href: '/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        { label: t('navigation.quotes'), href: '/quotes', icon: <FileText size={20} /> },
        { label: t('navigation.staffManagement'), href: '/users', icon: <Users size={20} /> },
        { label: t('navigation.reports'), href: '/reports', icon: <BarChart2 size={20} /> },
        {
          label: t('navigation.sessions'),
          href: '/session_management',
          icon: <History size={20} />,
        },
        { label: t('navigation.notifications'), href: '/notifications', icon: <Bell size={20} /> },
        { label: t('navigation.support'), href: '/support', icon: <HelpCircle size={20} /> },
        { label: t('navigation.mySettings'), href: '/settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const getSections = () => {
    switch (user?.role) {
      case 'super_admin':
        return superAdminSections;
      case 'admin':
        return adminSections;
      case 'dealer_manager':
        return dealerSections;
      default:
        return [];
    }
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
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute
      roles={['super_admin', 'admin', 'dealer_manager', 'dealer_admin', 'dealer', 'user', 'staff']}
    >
      <DashboardInner>{children}</DashboardInner>
      {/* Language Onboarding Modal */}
      <LanguageOnboarding />
    </ProtectedRoute>
  );
}
