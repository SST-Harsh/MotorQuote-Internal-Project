'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DataTable from '@/components/common/DataTable';
import impersonationService from '@/services/impersonationService';
import { Fingerprint, Clock, User, Shield, AlertCircle } from 'lucide-react';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';

export default function ImpersonationHistory() {
  const IMPERSONATION_TAB_KEY = 'impersonation_logs_active_tab';

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const [history, setHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(IMPERSONATION_TAB_KEY) || 'history';
    }
    return 'history';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(IMPERSONATION_TAB_KEY, tab);
    sessionStorage.setItem('app_last_path', pathname);
  }, [tab, pathname]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'history') {
        const res = await impersonationService.getImpersonationHistory();
        let data = Array.isArray(res) ? res : res.data || res.history || [];

        if (user?.role !== 'super_admin') {
          data = data.filter((row) => {
            const adminRole = row.admin_role || row.admin?.role;
            return adminRole !== 'super_admin';
          });
        }

        setHistory(data);
      } else {
        const res = await impersonationService.getActiveImpersonations();
        let data = Array.isArray(res)
          ? res
          : res.data || res.sessions || res.active_impersonations || [];

        if (user?.role !== 'super_admin') {
          data = data.filter((row) => {
            const adminRole = row.admin_role || row.original_admin?.role;
            return adminRole !== 'super_admin';
          });
        }

        setActiveSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch impersonation data:', error);
    } finally {
      setLoading(false);
    }
  }, [tab, user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const historyColumns = [
    {
      header: 'Admin',
      sortable: true,
      sortKey: (row) =>
        (row.first_name || row.admin?.first_name || '') +
        ' ' +
        (row.last_name || row.admin?.last_name || ''),
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[rgb(var(--color-text))]">
            {(row.first_name || row.admin?.first_name || '') +
              ' ' +
              (row.last_name || row.admin?.last_name || '')}
          </span>
          <span className="text-xs text-[rgb(var(--color-text-muted))]">
            {row.user_email || row.admin?.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Target User',
      sortable: true,
      sortKey: (row) => {
        const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        return details?.target_user_email || row.impersonated_user?.email || '';
      },
      accessor: (row) => {
        const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        const targetEmail = details?.target_user_email || row.impersonated_user?.email;
        const targetRole = details?.target_user_role || row.impersonated_user?.role;

        return (
          <div className="flex flex-col">
            <span className="font-semibold text-[rgb(var(--color-text))]">
              {targetEmail || 'Unknown'}
            </span>
            <span className="text-xs text-[rgb(var(--color-text-muted))] capitalize">
              {targetRole || 'User'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      sortable: true,
      sortKey: 'action',
      accessor: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.action === 'IMPERSONATION_START' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
        >
          {row.action?.replace('_', ' ') || 'Action'}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      sortable: true,
      sortKey: 'created_at',
      accessor: (row) => (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))]">
          <Clock size={14} />
          {new Date(row.created_at || row.timestamp).toLocaleString()}
        </div>
      ),
    },
  ];

  const activeColumns = [
    {
      header: 'Admin',
      sortable: true,
      sortKey: (row) => row.admin_email || row.original_admin?.email || '',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[rgb(var(--color-text))]">
            {row.admin_email || row.original_admin?.email || 'Admin'}
          </span>
          <span className="text-xs text-[rgb(var(--color-text-muted))]">
            {(row.first_name || row.original_admin?.first_name || '') +
              ' ' +
              (row.last_name || row.original_admin?.last_name || '')}
          </span>
        </div>
      ),
    },
    {
      header: 'Impersonating',
      sortable: true,
      sortKey: (row) => row.target_email || row.impersonated_user?.email || '',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[rgb(var(--color-text))]">
            {row.target_email || row.impersonated_user?.email || 'User'}
          </span>
          <span className="text-xs text-[rgb(var(--color-text-muted))] capitalize">
            {row.target_role || row.impersonated_user?.role || 'Staff'}
          </span>
        </div>
      ),
    },
    {
      header: 'Started',
      sortable: true,
      sortKey: (row) => row.started_at || row.created_at || '',
      accessor: (row) => (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--color-text-muted))]">
          <Clock size={14} />
          {new Date(row.started_at || row.created_at).toLocaleString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Impersonation Logs</h1>
          <p className="text-[rgb(var(--color-text-muted))] text-sm">
            Audit and monitor all impersonation activity across the system.
          </p>
        </div>

        <div className="flex border-b border-[rgb(var(--color-border))]">
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === 'history'
                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]'
                : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
              tab === 'active'
                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))]'
                : 'border-transparent text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            Active Sessions
          </button>
        </div>
      </div>

      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <DataTable
            data={tab === 'history' ? history : activeSessions}
            columns={tab === 'history' ? historyColumns : activeColumns}
            searchKeys={
              tab === 'history'
                ? ['user_email', 'details', 'first_name', 'last_name']
                : ['admin_email', 'target_email']
            }
            searchPlaceholder={
              tab === 'history'
                ? 'Search history by email or details...'
                : 'Search sessions by admin or target email...'
            }
            persistenceKey={`impersonation-${tab}`}
            highlightId={highlightId}
          />
        )}
      </div>

      {tab === 'active' && activeSessions.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-[rgb(var(--color-background))]/30 rounded-2xl border-2 border-dashed border-[rgb(var(--color-border))]">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Shield size={32} className="text-[rgb(var(--color-text-muted))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--color-text))]">
            No Active Impersonations
          </h3>
          <p className="text-[rgb(var(--color-text-muted))] max-w-sm mt-2 font-medium">
            Everything looks good! No administrators are currently impersonating users.
          </p>
        </div>
      )}
    </div>
  );
}
