'use client';
import ImpersonationHistoryPage from '@/components/views/super-admin/ImpersonationHistoryPage';
import { useAuth } from '@/context/AuthContext';
import { canViewImpersonationLogs } from '@/utils/roleUtils';

export default function Page() {
  const { user } = useAuth();

  if (user?.role !== 'super_admin' && !canViewImpersonationLogs(user)) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Access Denied. You do not have permission to view Impersonation History.
      </div>
    );
  }

  return <ImpersonationHistoryPage />;
}
