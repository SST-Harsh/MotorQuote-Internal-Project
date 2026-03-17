'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CustomDateTimePicker from '@/components/common/CustomDateTimePicker';
import CustomSelect from '@/components/common/CustomSelect';
import Swal from 'sweetalert2';
import auditService from '@/services/auditService';
import DataTable from '@/components/common/DataTable';
import { SkeletonTable } from '@/components/common/Skeleton';
import StatCard from '@/components/common/StatCard';
import DetailViewModal from '@/components/common/DetailViewModal';
import Image from 'next/image';
import {
  Shield,
  CheckCircle,
  Activity,
  User,
  FileText,
  AlertTriangle,
  ChevronRight,
  Download,
  LayoutList,
  RotateCcw,
  Trash2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import TabNavigation from '@/components/common/TabNavigation';
import FilterDrawer from '@/components/common/FilterDrawer';
import PageHeader from '@/components/common/PageHeader';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate, formatTime } from '@/utils/i18n';
import { canExportReports, canCleanupLogs, canViewAuditLogs } from '@/utils/roleUtils';

const getMethodColor = (method) => {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
    case 'POST':
      return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700';
    case 'PUT':
      return 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700';
    case 'DELETE':
      return 'text-rose-700 bg-rose-100 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700';
    default:
      return 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-700';
  }
};

export default function SuperAdminAuditLogs() {
  const { preferences } = usePreference();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const pathname = usePathname();
  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem('super_admin_audit_logs_tab') || 'audit';
    }
    return 'audit';
  });

  const canExport = canExportReports(user);
  const canCleanup = canCleanupLogs(user);
  const canViewAudit = canViewAuditLogs(user);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [viewingLog, setViewingLog] = useState(null);
  const [activityUser, setActivityUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState([]);
  const [stats, setStats] = useState(null);
  const [errorStats, setErrorStats] = useState(null);

  const defaultDates = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, []);

  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(() => {
    const defaultPagination = { page: 1, limit: 200, total_pages: 1 };
    if (typeof window !== 'undefined' && isRefresh) {
      const saved = sessionStorage.getItem('super_admin_audit_logs_pagination');
      return saved ? JSON.parse(saved) : defaultPagination;
    }
    return defaultPagination;
  });

  const AUDIT_LOGS_FILTERS_KEY = 'super_admin_audit_logs_filters';

  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      startDate: '',
      endDate: '',
      action: '',
      resource: '',
      severity: '',
      status: '',
      searchTerm: '',
    };
    try {
      if (typeof window !== 'undefined' && isRefresh) {
        const saved = sessionStorage.getItem(AUDIT_LOGS_FILTERS_KEY);
        return saved ? JSON.parse(saved) : defaultFilters;
      }
      return defaultFilters;
    } catch (_) {
      return defaultFilters;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('super_admin_audit_logs_tab', activeTab);
    sessionStorage.setItem('super_admin_audit_logs_pagination', JSON.stringify(pagination));
    sessionStorage.setItem(AUDIT_LOGS_FILTERS_KEY, JSON.stringify(filters));
    sessionStorage.setItem('app_last_path', pathname);
  }, [activeTab, pagination, filters, pathname]);

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    if (isFilterDrawerOpen) {
      setTempFilters(filters);
    }
  }, [isFilterDrawerOpen, filters]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const effectiveStartDate = filters.startDate || defaultDates.start;
      const effectiveEndDate = filters.endDate || defaultDates.end;

      const commonParams = {
        page: pagination.page,
        limit: pagination.limit,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate + 'T23:59:59',
      };

      let res = { data: [], pagination: { total_pages: 1, total: 0 } };

      if (activeTab === 'audit') {
        const params = {
          ...commonParams,
          ...(filters.action && { action: filters.action }),
          ...(filters.resource && { resource: filters.resource }),
          ...(filters.status && { status: filters.status }),
        };
        res = await auditService.getAuditLogs(params);
        // API keys: logs, pagination
        if (res.data && res.data.logs) {
          if (res.data.pagination) res.pagination = res.data.pagination;
          res.data = res.data.logs;
        }
      } else if (activeTab === 'error') {
        const params = {
          ...commonParams,
          ...(filters.severity && { severity: filters.severity }),
        };
        res = await auditService.getErrorLogs(params);
        // API keys: errors, pagination
        if (res.data && res.data.errors) {
          if (res.data.pagination) res.pagination = res.data.pagination;
          res.data = res.data.errors;
        }
      } else if (activeTab === 'security') {
        const params = {
          ...commonParams,
        };
        res = await auditService.getSecurityEvents(params); // Calls failed-actions
        // API keys: failed_actions, pagination
        if (res.data && res.data.failed_actions) {
          if (res.data.pagination) res.pagination = res.data.pagination;
          res.data = res.data.failed_actions;
        }
      }

      const data = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      const pag = res.pagination ||
        (res.data && res.data.pagination) || { total_pages: 1, total: data.length };

      setCurrentData(data);
      setPagination((prev) => ({
        ...prev,
        total_pages: pag.total_pages || 1,
        total: pag.total_items || pag.total || 0, // API uses total_items
      }));
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, filters, defaultDates]);

  const fetchStats = useCallback(async () => {
    try {
      const effectiveStartDate = filters.startDate || defaultDates.start;
      const effectiveEndDate = filters.endDate || defaultDates.end;

      const dateParams = {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate + 'T23:59:59',
      };
      const [auditRes, errorRes] = await Promise.all([
        auditService.getAuditStats(dateParams),
        auditService.getErrorStats(dateParams),
      ]);

      const aggregateStats = (res) => {
        const empty = {
          total_actions: 0,
          successful_actions: 0,
          failed_actions: 0,
          unique_users: 0,
          total_errors: 0,
        };
        if (!Array.isArray(res)) return { overview: { ...empty, ...(res?.overview || res) } };
        if (res.length === 0) return { overview: empty };
        return {
          overview: res.reduce(
            (acc, curr) => ({
              total_actions: (Number(acc.total_actions) || 0) + (Number(curr.total_actions) || 0),
              successful_actions:
                (Number(acc.successful_actions) || 0) + (Number(curr.successful_actions) || 0),
              failed_actions:
                (Number(acc.failed_actions) || 0) + (Number(curr.failed_actions) || 0),
              unique_users: Math.max(Number(acc.unique_users) || 0, Number(curr.unique_users) || 0),
              total_errors: (Number(acc.total_errors) || 0) + (Number(curr.total_errors) || 0),
            }),
            empty
          ),
        };
      };

      const procAuditStats = aggregateStats(auditRes);
      const procErrorStats = aggregateStats(errorRes);

      setStats(procAuditStats);
      setErrorStats(procErrorStats);
    } catch (e) {
      console.error('Stats error', e);
    }
  }, [filters.startDate, filters.endDate, defaultDates]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isExportOpen) return;
    const handleClickOutside = () => setIsExportOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isExportOpen]);

  useEffect(() => {
    if (viewingLog && viewingLog.resource && viewingLog.resource_id) {
      auditService
        .getResourceHistory(viewingLog.resource, viewingLog.resource_id)
        .then((res) => setHistory(Array.isArray(res) ? res : res.data))
        .catch(() => setHistory([]));
    } else {
      setHistory([]);
    }
  }, [viewingLog]);

  const resetFilters = useCallback(() => {
    const resetObj = {
      startDate: '',
      endDate: '',
      action: '',
      resource: '',
      severity: '',
      status: '',
      searchTerm: '',
    };
    updateFilters(resetObj);
    setTempFilters(resetObj);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleRemoveFilter = (key) => {
    const next = { ...filters };
    next[key] = '';
    updateFilters(next);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCleanup = async () => {
    const result = await Swal.fire({
      title: 'Cleanup Old Logs?',
      text: 'This will permanently delete logs older than 90 days (audit) / 30 days (error).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await auditService.cleanLogs({ auditDays: 90, errorDays: 30 });
        Swal.fire('Deleted!', 'Old logs have been cleaned.', 'success');
        fetchData();
        fetchStats();
      } catch (error) {
        Swal.fire('Error', 'Failed to clean logs.', 'error');
      }
    }
  };

  const handleExport = async () => {
    try {
      const data = await auditService.exportLogs(filters);

      // Convert to CSV
      const exportData = Array.isArray(data) ? data : data.data || [];

      if (exportData.length === 0) {
        Swal.fire('Info', 'No data to export.', 'info');
        return;
      }

      const headers = [
        'Timestamp',
        'Action',
        'Resource',
        'Resource ID',
        'User',
        'IP Address',
        'Status',
      ];
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          [
            `"${row.created_at || ''}"`,
            `"${row.action || ''}"`,
            `"${row.resource || ''}"`,
            `"${row.resource_id || ''}"`,
            `"${row.user_email || 'System'}"`,
            `"${row.ip_address || ''}"`,
            `"${row.status || ''}"`,
          ].join(',')
        ),
      ].join('\n');

      // Trigger Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire('Export Successful', 'Your download has started.', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Export failed.', 'error');
    }
  };

  const columns = useMemo(() => {
    const commonCols = [
      {
        header: 'Timestamp',
        accessor: (row) => (
          <div>
            <div className="font-medium text-[rgb(var(--color-text))]">
              {formatTime(row.created_at)}
            </div>
            <div className="text-xs text-[rgb(var(--color-text-muted))]">
              {formatDate(row.created_at)}
            </div>
          </div>
        ),
        className: 'w-48',
      },
    ];

    if (activeTab === 'audit') {
      return [
        ...commonCols,
        {
          header: 'User',
          sortable: true,
          sortKey: 'user_email',
          accessor: (row) => (
            <div>
              <div className="font-medium text-[rgb(var(--color-text))]">
                {row.user_email || 'System'}
              </div>
              <div className="text-xs text-[rgb(var(--color-text-muted))]">{row.ip_address}</div>
            </div>
          ),
        },
        {
          header: 'Action',
          accessor: 'action',
          className: 'font-semibold text-[rgb(var(--color-text))]',
        },
        {
          header: 'Status',
          type: 'badge',
          sortable: true,
          accessor: 'status',
          config: {
            green: ['success', 'SUCCESS'],
            red: ['failed', 'error', 'FAILURE', 'FAILED', 'FAIL'],
          },
        },
        {
          header: '',
          accessor: (row) => (
            <button
              onClick={() => setViewingLog(row)}
              className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
            >
              <ChevronRight size={16} />
            </button>
          ),
          className: 'w-10 text-right',
        },
      ];
    } else if (activeTab === 'error') {
      return [
        ...commonCols,
        {
          header: 'Method',
          sortable: true,
          accessor: 'method',
          className: 'font-semibold text-[rgb(var(--color-text))] uppercase',
        },
        {
          header: 'Error Details',
          accessor: (row) => (
            <div>
              <div className="font-semibold text-[rgb(var(--color-text))]">{row.error_type}</div>
              <div
                title={row.error_message}
                className="max-w-[200px] truncate text-[rgb(var(--color-text-muted))] text-xs font-normal opacity-80 mt-0.5"
              >
                {row.error_message}
              </div>
            </div>
          ),
        },
        {
          header: 'Severity',
          type: 'badge',
          sortable: true,
          accessor: 'severity',
          config: {
            red: ['critical', 'error'],
            orange: ['warning'],
            blue: ['info'],
          },
        },
        {
          header: '',
          accessor: (row) => (
            <button
              onClick={() => setViewingLog(row)}
              className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
            >
              <ChevronRight size={16} />
            </button>
          ),
          className: 'w-10 text-right',
        },
      ];
    } else {
      return [
        ...commonCols,
        {
          header: 'Action / Resource',
          accessor: (row) => (
            <div>
              <div className="font-semibold text-[rgb(var(--color-text-muted))]">{row.action}</div>
              <div className="text-xs text-[rgb(var(--color-text-muted))] font-mono">
                {row.resource}
              </div>
            </div>
          ),
        },
        {
          header: 'Actor / Source',
          accessor: (row) => (
            <div>
              <div className="text-sm text-[rgb(var(--color-text-muted))]">
                {row.user_email || 'Anonymous'}
              </div>
              <div className="text-xs text-[rgb(var(--color-text-muted))]">{row.ip_address}</div>
            </div>
          ),
        },
        {
          header: 'Reason',
          accessor: 'error_message',
          className: 'text-rose-600 italic',
        },
        {
          header: '',
          accessor: (row) => (
            <button
              onClick={() => setViewingLog(row)}
              className="text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
            >
              <ChevronRight size={16} />
            </button>
          ),
          className: 'w-10 text-right',
        },
      ];
    }
  }, [activeTab]);

  const getDetailSections = (log, history, activityUser, activityContent) => {
    if (!log) return [];
    const sections = [
      {
        title: 'Request Context',
        icon: FileText,
        customContent: (
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider mb-2 block">
                User / Actor
              </label>
              <div className="flex items-center gap-3">
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-[rgb(var(--color-text))] truncate">
                    {log.user_email || 'System'}
                  </div>
                  <div className="text-xs text-[rgb(var(--color-text-muted))] truncate">
                    {log.ip_address}
                  </div>
                </div>
              </div>
              {log.user_id && (
                <div className="mt-3 border-t border-[rgb(var(--color-border))] pt-3">
                  <button
                    onClick={() =>
                      setActivityUser((curr) =>
                        curr ? null : { id: log.user_id, email: log.user_email }
                      )
                    }
                    className="w-full text-xs font-medium flex items-center justify-between p-2 rounded-lg bg-[rgb(var(--color-background))] hover:bg-[rgb(var(--color-border))] transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-[rgb(var(--color-text))]">
                      <Activity size={14} className="text-[rgb(var(--color-primary))]" />
                      Active Session Summary
                    </span>
                    <div
                      className={`transition-transform duration-200 ${activityUser ? 'rotate-180' : ''}`}
                    >
                      <ChevronDown size={14} className="text-[rgb(var(--color-text-muted))]" />
                    </div>
                  </button>

                  {activityUser && (
                    <div className="mt-3 space-y-2">
                      {activityContent || (
                        <div className="text-center py-4 text-xs text-[rgb(var(--color-text-muted))]">
                          Loading activity data...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ),
      },
    ];

    if (history && history.length > 0) {
      sections.push({
        title: 'Recent Resource History',
        icon: RotateCcw,
        customContent: (
          <div className="border border-[rgb(var(--color-border))] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[rgb(var(--color-background))] text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase">
                <tr>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Actor</th>
                  <th className="px-4 py-2 text-right whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border))]">
                {history.map((h) => (
                  <tr key={h.id} className="bg-[rgb(var(--color-surface))]">
                    <td className="px-4 py-2 font-medium text-[rgb(var(--color-text))]">
                      {h.action}
                    </td>
                    <td className="px-4 py-2 text-[rgb(var(--color-text-muted))]">
                      {h.user_email || 'System'}
                    </td>
                    <td className="px-4 py-2 text-right text-[rgb(var(--color-text-muted))] text-xs whitespace-nowrap">
                      {formatDate(h.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
    }
    return sections;
  };

  const [activityData, setActivityData] = useState([]);
  useEffect(() => {
    if (activityUser?.id) {
      const load = async () => {
        try {
          const res = await auditService.getUserActivity(activityUser.id);
          setActivityData(Array.isArray(res) ? res : res.data || []);
        } catch (e) {
          console.error(e);
          setActivityData([]);
        }
      };
      load();
    } else {
      setActivityData([]);
    }
  }, [activityUser]);

  const activityContent =
    activityData.length > 0 ? (
      <div className="space-y-3">
        <div className="flex justify-between px-2 text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
          <span>Action Context</span>
          <span>Total Count</span>
        </div>
        {activityData.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md ${item.action === 'LOGIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))]'}`}
              >
                {item.action === 'LOGIN' ? <User size={16} /> : <Activity size={16} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-[rgb(var(--color-text))]">
                  {item.action} {item.resource}
                </div>
                <div className="text-xs text-[rgb(var(--color-text-muted))]">
                  Last: {formatDate(item.last_action)}
                </div>
              </div>
            </div>
            <div className="text-lg font-bold text-[rgb(var(--color-text))]">{item.count}</div>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <div className="flex flex-col bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] font-sans transition-colors duration-200">
      <div className="px-4 md:px-8 py-6 md:py-8 pb-4">
        <PageHeader
          title="System Audit & Compliance"
          subtitle={
            <div className="flex flex-wrap items-center gap-1.5 bg-[rgb(var(--color-primary))]/5 border border-[rgb(var(--color-primary))]/10 px-3 py-1.5 rounded-lg w-fit">
              <span className="text-xs font-medium text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                {filters.startDate || filters.endDate ? 'Tracking Activity' : 'Default Period'}
              </span>
              <div className="h-3 w-px bg-[rgb(var(--color-border))] mx-1" />
              <span className="text-xs text-[rgb(var(--color-text-muted))]">from</span>
              <span className="text-sm font-bold text-[rgb(var(--color-text))]">
                {formatDate(filters.startDate || defaultDates.start)}
              </span>
              <span className="text-xs text-[rgb(var(--color-text-muted))]">to</span>
              <span className="text-sm font-bold text-[rgb(var(--color-text))]">
                {formatDate(filters.endDate || defaultDates.end)}
              </span>
            </div>
          }
          actions={
            <div className="relative">
              <button
                disabled={!canExport}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExportOpen(!isExportOpen);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
                  canExport
                    ? 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                }`}
                title={
                  canExport ? 'Export Options' : "You don't have permission to export reports."
                }
              >
                <Download size={16} />
                <span className="font-bold text-sm hidden sm:inline">Export</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {canExport && (
                <div
                  className={`absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden transition-all z-50 ${isExportOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                >
                  <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                    Audit Data
                  </div>
                  <button
                    onClick={() => {
                      handleExport();
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                  >
                    <FileText size={14} className="text-blue-500" /> Export as CSV
                  </button>
                </div>
              )}
            </div>
          }
          stats={[
            <StatCard
              key="total-actions"
              title="Total Actions"
              value={Number(stats?.overview?.total_actions || 0).toLocaleString()}
              helperText="In selected period"
              icon={<Activity size={20} />}
              accent="#3b82f6"
            />,
            <StatCard
              key="success-rate"
              title="Success Rate"
              value={`${(((Number(stats?.overview?.successful_actions) || 0) / (Number(stats?.overview?.total_actions) || 1)) * 100).toFixed(1)}%`}
              helperText={`${stats?.overview?.failed_actions || 0} failed actions`}
              icon={<CheckCircle size={20} />}
              accent="#10b981"
            />,
            <StatCard
              key="critical-errors"
              title="Critical Errors"
              value={Number(errorStats?.overview?.total_errors || 0)}
              helperText="Require attention"
              icon={<AlertTriangle size={20} />}
              accent="#f43f5e"
            />,
            <StatCard
              key="active-users"
              title="Active Users"
              value={Number(stats?.overview?.unique_users || 0)}
              helperText="Distinct identities"
              icon={<User size={20} />}
              accent="#a855f7"
            />,
          ]}
        />
      </div>

      <div className="flex-1 px-4 md:px-8 pb-8 lg:overflow-hidden flex flex-col min-h-0">
        <div className="p-3 flex flex-wrap justify-between items-center z-10 gap-4">
          <TabNavigation
            activeTab={activeTab}
            onTabChange={(key) => {
              setActiveTab(key);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            tabs={[
              { key: 'audit', label: 'Audit Logs', icon: LayoutList },
              { key: 'error', label: 'Error Logs', icon: AlertTriangle },
              { key: 'security', label: 'Security', icon: Shield },
            ]}
          />
        </div>

        {/* Table Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={8} />
            </div>
          ) : (
            <DataTable
              data={currentData}
              columns={columns}
              persistenceKey={`audit-logs-${activeTab}`}
              itemsPerPage={preferences.items_per_page || 10}
              searchable={true}
              searchKeys={['action', 'resource', 'user_email', 'error_type', 'error_message']}
              searchPlaceholder={`Search ${activeTab} logs...`}
              highlightId={highlightId}
              className="min-h-full"
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              onClearFilters={() => resetFilters()}
              onRemoveExternalFilter={handleRemoveFilter}
              hideFilterDropdowns={true}
              externalFilters={{
                startDate: filters.startDate,
                endDate: filters.endDate,
                action: filters.action,
                resource: filters.resource,
                severity: filters.severity,
                status: filters.status,
              }}
              filterOptions={[
                {
                  key: 'action',
                  label: 'Action',
                  options: [
                    { value: 'CREATE', label: 'Create' },
                    { value: 'UPDATE', label: 'Update' },
                    { value: 'DELETE', label: 'Delete' },
                    { value: 'LOGIN', label: 'Login' },
                  ],
                },
                {
                  key: 'resource',
                  label: 'Resource',
                  options: [
                    { value: 'User', label: 'User' },
                    { value: 'Quote', label: 'Quote' },
                    { value: 'Dealership', label: 'Dealership' },
                    { value: 'Auth', label: 'Auth' },
                  ],
                },
                {
                  key: 'severity',
                  label: 'Severity',
                  options: [
                    { value: 'critical', label: 'Critical' },
                    { value: 'error', label: 'Error' },
                    { value: 'warning', label: 'Warning' },
                  ],
                },
                {
                  key: 'status',
                  label: 'Status',
                  options: [
                    { value: 'success', label: 'Success' },
                    { value: 'failed', label: 'Failed' },
                  ],
                },
              ]}
              showClearFilter={
                filters.action !== '' ||
                filters.resource !== '' ||
                filters.severity !== '' ||
                filters.status !== '' ||
                filters.searchTerm !== '' ||
                filters.startDate !== '' ||
                filters.endDate !== ''
              }
            />
          )}
        </div>
      </div>

      <DetailViewModal
        isOpen={!!viewingLog}
        onClose={() => {
          setViewingLog(null);
          setActivityUser(null);
        }}
        title={viewingLog ? viewingLog.error_type || viewingLog.action : 'Details'}
        data={{
          name: viewingLog ? viewingLog.error_type || viewingLog.action : '',
          status: viewingLog?.status || (viewingLog?.error_type ? 'Error' : 'Success'),
          id: viewingLog?.id,
        }}
        sections={getDetailSections(viewingLog, history, activityUser, activityContent)}
        maxWidth="max-w-2xl"
        mode="drawer"
        showActivityTab={false}
        showAvatar={false}
        showJoinedDate={false}
      />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={() => {
          updateFilters(tempFilters);
          setIsFilterDrawerOpen(false);
        }}
        onReset={() => {
          const resetFilters = {
            ...filters,
            startDate: '',
            endDate: '',
            action: '',
            resource: '',
            severity: '',
            status: '',
          };
          setTempFilters(resetFilters);
          setFilters(resetFilters);
        }}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                Start Date
              </label>
              <CustomDateTimePicker
                value={tempFilters.startDate}
                onChange={(val) => setTempFilters((prev) => ({ ...prev, startDate: val }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                End Date
              </label>
              <CustomDateTimePicker
                value={tempFilters.endDate}
                onChange={(val) => setTempFilters((prev) => ({ ...prev, endDate: val }))}
              />
            </div>
          </div>

          {activeTab === 'audit' && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Action Type
                </label>
                <CustomSelect
                  options={[
                    { value: '', label: 'All Actions' },
                    { value: 'CREATE', label: 'Create' },
                    { value: 'UPDATE', label: 'Update' },
                    { value: 'DELETE', label: 'Delete' },
                    { value: 'LOGIN', label: 'Login' },
                  ]}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, action: e.target.value }))}
                  value={tempFilters.action}
                  placeholder="All Actions"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Resource
                </label>
                <CustomSelect
                  options={[
                    { value: '', label: 'All Resources' },
                    { value: 'User', label: 'User' },
                    { value: 'Quote', label: 'Quote' },
                    { value: 'Dealership', label: 'Dealership' },
                    { value: 'Auth', label: 'Auth' },
                  ]}
                  onChange={(e) =>
                    setTempFilters((prev) => ({ ...prev, resource: e.target.value }))
                  }
                  value={tempFilters.resource}
                  placeholder="All Resources"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Status
                </label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Status' },
                    { value: 'success', label: 'Success' },
                    { value: 'failed', label: 'Failed' },
                  ]}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
                  value={tempFilters.status}
                  placeholder="Status"
                  className="w-full"
                />
              </div>
            </>
          )}

          {activeTab === 'error' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                Severity Level
              </label>
              <CustomSelect
                options={[
                  { value: '', label: 'All Severities' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'error', label: 'Error' },
                  { value: 'warning', label: 'Warning' },
                ]}
                onChange={(e) => setTempFilters((prev) => ({ ...prev, severity: e.target.value }))}
                value={tempFilters.severity}
                placeholder="All Severities"
                className="w-full"
              />
            </div>
          )}

          {user?.role === 'super_admin' && (
            <div className="pt-6 border-t border-[rgb(var(--color-border))]">
              <button
                onClick={() => {
                  setIsFilterDrawerOpen(false);
                  handleCleanup();
                }}
                disabled={!canCleanup}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm active:transform active:scale-[0.98] ring-offset-2 ${
                  canCleanup
                    ? 'bg-rose-500 text-white border border-rose-600 hover:bg-rose-600 focus:ring-2 focus:ring-rose-500'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                }`}
                title={
                  canCleanup ? 'Cleanup Old Logs' : "You don't have permission to cleanup logs."
                }
              >
                <Trash2 size={18} /> Cleanup Old Logs
              </button>
              <p className="mt-2 text-[10px] text-center text-[rgb(var(--color-text-muted))] opacity-75">
                Permanently delete logs older than 90 days (audit) / 30 days (error)
              </p>
            </div>
          )}
        </div>
      </FilterDrawer>
    </div>
  );
}
