'use client';
import React, { useState, useEffect } from 'react';
import DataTable from '../../common/DataTable';
import StatCard from '../../common/StatCard';
import DetailViewModal from '../../common/DetailViewModal';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import FilterDrawer from '../../common/FilterDrawer';
import auditService from '@/services/auditService';
import Swal from 'sweetalert2';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate, formatTime } from '@/utils/i18n';
import {
  ShieldAlert,
  Lock,
  LogIn,
  AlertTriangle,
  Eye,
  Calendar,
  SlidersHorizontal,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function SuperAdminSessionManagementView() {
  const { preferences } = usePreference();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total_attempts: 0,
    successful_logins: 0,
    failed_logins: 0,
    unique_ips: 0,
  });
  const [viewingSession, setViewingSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({
    success: 'all',
    email: '',
  });

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.success !== 'all') params.success = filters.success === 'true';
      // Email filtering is done on frontend, not sent to API
      // Use camelCase as per API documentation
      if (dateRange.start) params.startDate = new Date(dateRange.start).toISOString();
      if (dateRange.end) params.endDate = new Date(dateRange.end).toISOString();

      const [historyResult, statsResult] = await Promise.allSettled([
        auditService.getLoginHistory(params),
        auditService.getLoginStats(params),
      ]);

      let sessionList = [];
      if (historyResult.status === 'fulfilled') {
        const historyData = historyResult.value;
        if (Array.isArray(historyData)) {
          sessionList = historyData;
        } else if (historyData && Array.isArray(historyData.data)) {
          sessionList = historyData.data;
        } else if (historyData && Array.isArray(historyData.loginHistory)) {
          sessionList = historyData.loginHistory;
        } else if (historyData && Array.isArray(historyData.login_history)) {
          sessionList = historyData.login_history;
        }
        setSessions(sessionList);
      } else {
        console.error('History API failed', historyResult.reason);
      }
      // Stats Logic: API Only
      let finalStats = { total_attempts: 0, successful_logins: 0, failed_logins: 0, unique_ips: 0 };

      if (statsResult.status === 'fulfilled') {
        const statsData = statsResult.value;
        // Check all possible nesting levels from the API response
        const statsObj = statsData.overall_stats || statsData.stats || statsData || {};

        finalStats = {
          total_attempts: Number(statsObj.total_attempts || statsObj.total_activities || 0),
          successful_logins: Number(statsObj.successful_logins || 0),
          failed_logins: Number(statsObj.failed_logins || 0),
          unique_ips: Number(statsObj.unique_ips || 0),
        };
      }

      setSessions(sessionList);
      setStats(finalStats);
    } catch (error) {
      console.error('Failed to load session logs', error);
      Swal.fire('Error', 'Failed to load session logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters.success, dateRange]); // Only re-fetch when success filter or date changes, not email

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side email filtering
  const filteredSessions = React.useMemo(() => {
    if (!filters.email) return sessions;

    const searchTerm = filters.email.toLowerCase();
    return sessions.filter((session) => {
      const email = (session.email || '').toLowerCase();
      const userName = (session.userName || session.user_name || '').toLowerCase();
      return email.includes(searchTerm) || userName.includes(searchTerm);
    });
  }, [sessions, filters.email]);

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setFilters({ success: 'all', email: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Session Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor user sessions, authentication activity, and access risks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Attempts"
          value={stats.total_attempts}
          icon={<LogIn size={20} />}
          helperText="Total login events"
        />
        <StatCard
          title="Successful"
          value={stats.successful_logins}
          icon={<CheckCircle size={20} />}
          accent="#059669"
          helperText="Valid credentials"
        />
        <StatCard
          title="Failed"
          value={stats.failed_logins}
          icon={<AlertTriangle size={20} />}
          accent="#dc2626"
          helperText="Invalid attempts"
        />
        <StatCard
          title="Unique IPs"
          value={stats.unique_ips}
          icon={<ShieldAlert size={20} />}
          helperText="Distinct sources"
        />
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={resetFilters}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <Calendar size={16} /> Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomDateTimePicker
                value={dateRange.start}
                onChange={(val) => setDateRange((prev) => ({ ...prev, start: val }))}
                placeholder="Select start date"
              />
              <CustomDateTimePicker
                value={dateRange.end}
                onChange={(val) => setDateRange((prev) => ({ ...prev, end: val }))}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <ShieldAlert size={16} /> Status
            </h3>
            <select
              value={filters.success}
              onChange={(e) => setFilters((prev) => ({ ...prev, success: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border bg-[rgb(var(--color-surface))]"
            >
              <option value="all">All Attempts</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <User size={16} /> Email Search
            </h3>
            <input
              type="text"
              placeholder="Search by email..."
              value={filters.email}
              onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border bg-[rgb(var(--color-surface))]"
            />
          </div>
        </div>
      </FilterDrawer>

      <DataTable
        data={filteredSessions}
        searchKeys={['userName', 'user_name', 'email', 'ipAddress', 'ip_address']}
        itemsPerPage={preferences.items_per_page || 10}
        loading={isLoading}
        onFilterClick={() => setIsFilterOpen(true)}
        onClearFilters={resetFilters}
        showClearFilter={
          filters.success !== 'all' ||
          filters.email !== '' ||
          dateRange.start !== '' ||
          dateRange.end !== ''
        }
        columns={[
          {
            header: 'User',
            accessor: (row) => (
              <div>
                <p className="font-semibold">
                  {row.userName || row.user_name
                    ? row.userName || row.user_name
                    : row.email
                      ? row.email.split('@')[0]
                      : 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            type: 'badge',
            accessor: (row) => (row.success ? 'Success' : 'Failed'),
            config: {
              green: ['Success'],
              red: ['Failed'],
            },
          },
          {
            header: 'Severity',
            type: 'badge',
            accessor: (row) => (row.success ? 'Info' : 'Warning'),
            config: {
              blue: ['Info'],
              orange: ['Warning'],
            },
          },
          { header: 'IP Address', accessor: (row) => row.ipAddress || row.ip_address },
          {
            header: 'Time',
            accessor: (row) =>
              `${formatDate(row.createdAt || row.created_at)} ${formatTime(row.createdAt || row.created_at)}`,
            className: 'text-xs text-muted-foreground',
          },
          {
            header: 'Actions',
            accessor: (row) => (
              <button
                onClick={() => setViewingSession(row)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <Eye size={16} />
              </button>
            ),
          },
        ]}
      />

      {viewingSession && (
        <DetailViewModal
          isOpen
          onClose={() => setViewingSession(null)}
          title="Session Detail"
          maxWidth="max-w-xl"
          showActivityTab={false}
          statusMap={{
            success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
          }}
          data={{
            ...viewingSession,
            name:
              viewingSession.userName || viewingSession.user_name
                ? viewingSession.userName || viewingSession.user_name
                : viewingSession.email
                  ? viewingSession.email.split('@')[0]
                  : 'Unknown',
            id: viewingSession.id || viewingSession.row_id || '-',
            joinedDate: viewingSession.createdAt || viewingSession.created_at,
            status:
              viewingSession.success === 1 ||
              viewingSession.success === true ||
              viewingSession.success === 'true'
                ? 'Success'
                : 'Failed',
            formatted_status: (
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                  viewingSession.success === 1 ||
                  viewingSession.success === true ||
                  viewingSession.success === 'true'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {viewingSession.success === 1 ||
                viewingSession.success === true ||
                viewingSession.success === 'true'
                  ? 'Success'
                  : 'Failed'}
              </span>
            ),
            formatted_time: `${formatDate(viewingSession.createdAt || viewingSession.created_at)} ${formatTime(viewingSession.createdAt || viewingSession.created_at)}`,
            formatted_ip: viewingSession.ipAddress || viewingSession.ip_address || '-',
            formatted_agent: (
              <div
                className="text-xs text-muted-foreground break-all"
                title={viewingSession.userAgent || viewingSession.user_agent}
              >
                {viewingSession.userAgent || viewingSession.user_agent || '-'}
              </div>
            ),
            formatted_email: viewingSession.email || '-',
          }}
          sections={[
            {
              title: 'Session Info',
              icon: Lock,
              fields: [
                { label: 'User Name', key: 'name' },
                { label: 'Email', key: 'formatted_email' },
                { label: 'Status', key: 'formatted_status' },
                { label: 'IP Address', key: 'formatted_ip' },
                { label: 'User Agent', key: 'formatted_agent' },
                { label: 'Timestamp', key: 'formatted_time' },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
