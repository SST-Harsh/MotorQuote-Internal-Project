'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import CustomDateTimePicker from '@/components/common/CustomDateTimePicker';
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

const getMethodColor = (method) => {
  switch (method?.toUpperCase()) {
    case 'GET':
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
    case 'POST':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'PUT':
      return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
    case 'DELETE':
      return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800';
    default:
      return 'text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))]';
  }
};

const getSeverityBadge = (level) => {
  const styles = {
    critical:
      'bg-rose-100 text-rose-700 border-rose-200 ring-rose-500/10 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
    error:
      'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500/10 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
    warning:
      'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/10 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    info: 'bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))/0.2] ring-[rgb(var(--color-primary))/0.1]',
  };
  return styles[level?.toLowerCase()] || styles.info;
};

export default function SuperAdminAuditLogs() {
  const { preferences } = usePreference();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('audit');
  const [viewingLog, setViewingLog] = useState(null);
  const [activityUser, setActivityUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState([]);
  const [stats, setStats] = useState(null);
  const [errorStats, setErrorStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total_pages: 1 });
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    action: '',
    resource: '',
    severity: '',
    status: '',
    searchTerm: '',
  });
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
      const commonParams = {
        page: pagination.page,
        limit: pagination.limit,
        startDate: filters.startDate,
        endDate: filters.endDate + 'T23:59:59', // Include end of day
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
  }, [activeTab, pagination.page, pagination.limit, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const dateParams = {
        startDate: filters.startDate,
        endDate: filters.endDate + 'T23:59:59', // Include end of day
      };
      const [auditRes, errorRes] = await Promise.all([
        auditService.getAuditStats(dateParams),
        auditService.getErrorStats(dateParams),
      ]);

      const aggregateStats = (res) => {
        if (!Array.isArray(res)) return res;
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
            {}
          ),
        };
      };

      const procAuditStats = Array.isArray(auditRes) ? aggregateStats(auditRes) : auditRes;
      const procErrorStats = Array.isArray(errorRes) ? aggregateStats(errorRes) : errorRes;

      setStats(procAuditStats);
      setErrorStats(procErrorStats);
    } catch (e) {
      console.error('Stats error', e);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

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

  // Unified handleSearch logic is now internal to DataTable for client-side experience

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
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
          type: 'avatar',
          config: (row) => ({
            name: row.user_email || 'System',
            subtext: row.ip_address,
            image: row.profile_picture,
          }),
        },
        {
          header: 'Action',
          accessor: 'action',
          className: 'font-semibold text-[rgb(var(--color-text))]',
        },
        {
          header: 'Status',
          type: 'badge',
          accessor: 'status',
          config: {
            green: ['success'],
            red: ['failed', 'error'],
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
          accessor: (row) => (
            <div>
              <span
                className={`text-[10px] font-bold px-1.5 rounded border ${getMethodColor(row.method)}`}
              >
                {row.method}
              </span>
            </div>
          ),
        },
        {
          header: 'Error Type',
          accessor: 'error_type',
          className: 'font-semibold text-rose-600',
        },
        {
          header: 'Severity',
          type: 'badge',
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
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] flex items-center justify-center text-xs font-bold border border-[rgb(var(--color-primary))/0.2]">
                  {(log.user_email?.[0] || 'S').toUpperCase()}
                </div>
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
          const res = await auditService.getUserActivity(activityUser.id, { days: 30 });
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
    <div className="flex flex-col h-auto min-h-screen  bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] font-sans transition-colors duration-200">
      <div className="px-4 md:px-8 py-6 md:py-8 pb-4">
        <PageHeader
          title="System Audit & Compliance"
          subtitle={
            <>
              Tracking activity from{' '}
              <span className="font-semibold text-[rgb(var(--color-text))]">
                {formatDate(filters.startDate)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[rgb(var(--color-text))]">
                {formatDate(filters.endDate)}
              </span>
            </>
          }
          actions={
            <div className="relative group">
              <button className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-md">
                <Download size={16} />
                <span className="font-bold text-sm hidden sm:inline">Export</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-20">
                <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Audit Data
                </div>
                <button
                  onClick={handleExport}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-blue-500" /> Export as CSV
                </button>
              </div>
            </div>
          }
          stats={[
            <StatCard
              key="total-actions"
              title="Total Actions"
              value={stats?.overview?.total_actions?.toLocaleString() || 0}
              helperText="In selected period"
              icon={<Activity size={20} />}
              accent="#3b82f6"
            />,
            <StatCard
              key="success-rate"
              title="Success Rate"
              value={`${((stats?.overview?.successful_actions / (stats?.overview?.total_actions || 1)) * 100).toFixed(1)}%`}
              helperText={`${stats?.overview?.failed_actions || 0} failed actions`}
              icon={<CheckCircle size={20} />}
              accent="#10b981"
            />,
            <StatCard
              key="critical-errors"
              title="Critical Errors"
              value={errorStats?.overview?.total_errors || 0}
              helperText="Require attention"
              icon={<AlertTriangle size={20} />}
              accent="#f43f5e"
            />,
            <StatCard
              key="active-users"
              title="Active Users"
              value={stats?.overview?.unique_users || 0}
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
              itemsPerPage={preferences.items_per_page || 10}
              searchable={true}
              searchKeys={['action', 'resource', 'user_email', 'error_type', 'error_message']}
              className="min-h-full"
              onFilterClick={() => setIsFilterDrawerOpen(true)}
              onClearFilters={() => {
                const resetFilters = {
                  startDate: new Date(new Date().setDate(new Date().getDate() - 30))
                    .toISOString()
                    .split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  action: '',
                  resource: '',
                  severity: '',
                  status: '',
                  searchTerm: '',
                };
                setFilters(resetFilters);
                setTempFilters(resetFilters);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              showClearFilter={
                filters.action !== '' ||
                filters.resource !== '' ||
                filters.severity !== '' ||
                filters.status !== '' ||
                filters.searchTerm !== '' ||
                filters.startDate !==
                  new Date(new Date().setDate(new Date().getDate() - 30))
                    .toISOString()
                    .split('T')[0] ||
                filters.endDate !== new Date().toISOString().split('T')[0]
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
          joinedDate: viewingLog?.created_at,
        }}
        sections={getDetailSections(viewingLog, history, activityUser, activityContent)}
        maxWidth="max-w-2xl"
        mode="drawer"
        showActivityTab={false}
      />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={() => {
          setFilters(tempFilters);
          setIsFilterDrawerOpen(false);
        }}
        onReset={() => {
          const resetFilters = {
            ...filters,
            startDate: new Date(new Date().setDate(new Date().getDate() - 30))
              .toISOString()
              .split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
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
                <select
                  className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-sm text-[rgb(var(--color-text))] focus:outline-none focus:border-[rgb(var(--color-primary))]"
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, action: e.target.value }))}
                  value={tempFilters.action}
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="LOGIN">Login</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Resource
                </label>
                <select
                  className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-sm text-[rgb(var(--color-text))] focus:outline-none focus:border-[rgb(var(--color-primary))]"
                  onChange={(e) =>
                    setTempFilters((prev) => ({ ...prev, resource: e.target.value }))
                  }
                  value={tempFilters.resource}
                >
                  <option value="">All Resources</option>
                  <option value="User">User</option>
                  <option value="Quote">Quote</option>
                  <option value="Dealership">Dealership</option>
                  <option value="Auth">Auth</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'error' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                Severity Level
              </label>
              <select
                className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg text-sm text-[rgb(var(--color-text))] focus:outline-none focus:border-[rgb(var(--color-primary))]"
                onChange={(e) => setTempFilters((prev) => ({ ...prev, severity: e.target.value }))}
                value={tempFilters.severity}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
              </select>
            </div>
          )}

          {user?.role === 'super_admin' && (
            <div className="pt-6 border-t border-[rgb(var(--color-border))]">
              <button
                onClick={() => {
                  setIsFilterDrawerOpen(false);
                  handleCleanup();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all shadow-sm dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
              >
                <Trash2 size={18} /> Cleanup Old Logs
              </button>
              <p className="mt-2 text-[10px] text-center text-[rgb(var(--color-text-muted))]">
                Permanently delete logs older than 90 days
              </p>
            </div>
          )}
        </div>
      </FilterDrawer>
    </div>
  );
}
