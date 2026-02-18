'use client';
import Image from 'next/image';
import SidebarNav from './Sidebar'; // Importing from Sidebar.jsx
import TopBar from './TopBar';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

const DashboardLayout = ({ sidebarSections, user, children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getTitle = (path) => {
    if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (path.includes('/admin/dealerships')) return 'Admin Dashboard';
    if (path.includes('/admin/quotes')) return 'Admin Dashboard';
    if (path.includes('/admin/approvals')) return 'Admin Dashboard';
    if (path.includes('/admin/managers')) return 'Admin Dashboard';
    if (path.includes('/admin/sellers')) return 'Admin Dashboard';
    if (path.includes('/admin/settings')) return 'Admin Dashboard';
    if (path.includes('/admin/notifications')) return 'Admin Dashboard';
    if (path.includes('/super-admin/dashboard')) return 'Super Admin Dashboard';
    if (path.includes('/super-admin/users')) return 'Super Admin Dashboard';
    if (path.includes('/super-admin/roles')) return 'Super Admin Dashboard';
    if (path.includes('/super-admin/notifications')) return 'Super Admin Dashboard';
    if (path.includes('/dealer/dashboard')) return 'dealer Dashboard';

    return 'Dashboard';
  };

  const title = getTitle(pathname);

  return (
    <div className="min-h-screen bg-background text-text">
      <SidebarNav
        sections={sidebarSections}
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:pl-[280px]">
        <TopBar user={user} title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 bg-background px-4 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
