'use client';
import React, { useState, useEffect } from 'react';
import DataTable from '../../common/DataTable';
import StatCard from '../../common/StatCard';
import DetailViewModal from '../../common/DetailViewModal';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import FilterDrawer from '../../common/FilterDrawer';
import auditService from '@/services/auditService';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate, formatTime } from '@/utils/i18n';
import Swal from 'sweetalert2';
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

export default function DealerSessionManagementView() {
  const { user } = useAuth();
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
      // Base params (dates, filters)
      const baseParams = {};
      if (dateRange.start) baseParams.startDate = new Date(dateRange.start).toISOString();
      if (dateRange.end) baseParams.endDate = new Date(dateRange.end).toISOString();
      if (filters.success !== 'all') baseParams.success = filters.success === 'true';

      // 1. Fetch Staff List
      // We need userService dynamically or imported at top.
      // Since we didn't add import at top, let's use dynamic import or assume user has added it.
      // For safety, I'll add the import via another edit, or use require? No, let's just dynamic import to be safe if I can't touch top.
      // Actually, I should update imports first. But I can do it in one go if I replace the whole file or use multi_replace.
      // I'll stick to dynamic import for userService to minimize diff if I only touch this function,
      // OR I can assume I will add the import in a previous/next step.
      // Let's use dynamic import inside the function for `userService`.

      const userServiceModule = await import('@/services/userService');
      const userService = userServiceModule.default;

      const staffResponse = await userService.getDealerStaff();
      let staffList = [];
      if (Array.isArray(staffResponse)) staffList = staffResponse;
      else if (staffResponse?.data && Array.isArray(staffResponse.data))
        staffList = staffResponse.data;
      else if (staffResponse?.users && Array.isArray(staffResponse.users))
        staffList = staffResponse.users;

      // 2. Prepare list of User IDs to fetch (Self + Staff)
      const userIds = [user.id, ...staffList.map((s) => s.id)];
      const uniqueUserIds = [...new Set(userIds)]; // specific user might be in staff list too

      console.log('Fetching history for users:', uniqueUserIds);

      // 3. Fetch History for all users in parallel
      const historyPromises = uniqueUserIds.map((id) =>
        auditService.getLoginHistory({ ...baseParams, userId: id }).catch((err) => {
          console.warn(`Failed to fetch history for user ${id}`, err);
          return [];
        })
      );

      const responses = await Promise.all(historyPromises);

      // 4. Aggregate Results
      let combinedSessions = [];
      responses.forEach((response) => {
        let list = [];
        if (Array.isArray(response)) list = response;
        else if (response?.data && Array.isArray(response.data)) list = response.data;
        else if (response?.loginHistory && Array.isArray(response.loginHistory))
          list = response.loginHistory;
        else if (response?.login_history && Array.isArray(response.login_history))
          list = response.login_history;

        combinedSessions = [...combinedSessions, ...list];
      });

      // 5. Apply Client-Side Filters (Email) & Sort
      // Backend might filtered by email for the specific user call if we passed it,
      // but since we search across ALL users, better to filter combined list if searching a generic term.
      // Actually, if we pass `email` param to backend, it searches for THAT user's email.
      // Creating a "search anywhere" experience:

      let finalSessionList = combinedSessions;

      if (filters.email) {
        const searchLower = filters.email.toLowerCase();
        finalSessionList = finalSessionList.filter(
          (log) =>
            (log.email || '').toLowerCase().includes(searchLower) ||
            (log.userName || log.user_name || '').toLowerCase().includes(searchLower)
        );
      }

      // Sort by date desc
      finalSessionList.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB - dateA;
      });

      const total = finalSessionList.length;
      const successCount = finalSessionList.filter(
        (l) => l.success === true || l.success === 1 || l.success === '1'
      ).length;
      const uniqueIps = new Set(
        finalSessionList.map((l) => l.ipAddress || l.ip_address || 'unknown')
      ).size;

      setSessions(finalSessionList);
      setStats({
        total_attempts: total,
        successful_logins: successCount,
        failed_logins: total - successCount,
        unique_ips: uniqueIps,
      });
    } catch (error) {
      console.error('Failed to load aggregated login logs', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load session history.',
        timer: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, dateRange, user]);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  const resetFilters = () => {
    setDateRange({ start: '', end: '' });
    setFilters({ success: 'all', email: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Session Management</h1>
        <p className="text-sm text-muted-foreground">
          Monitor login activity for you and your staff.
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
        onApply={() => {
          setIsFilterOpen(false);
          fetchData();
        }}
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
        data={sessions}
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
