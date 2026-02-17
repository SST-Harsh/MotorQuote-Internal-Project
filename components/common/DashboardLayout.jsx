import Image from 'next/image';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

const DashboardLayout = ({ sidebarSections, user, children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getTitle = (path) => {
    const page = path.split('/').pop() || 'Dashboard';
    return page.charAt(0).toUpperCase() + page.slice(1);
  };

  const title = getTitle(pathname);

  return (
    <div className="min-h-screen bg-background text-text">
      <Sidebar
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
