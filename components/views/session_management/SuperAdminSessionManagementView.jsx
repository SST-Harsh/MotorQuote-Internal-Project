'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import DataTable from '../../common/DataTable';
import StatCard from '../../common/StatCard';
import DetailViewModal from '../../common/DetailViewModal';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import CustomSelect from '../../common/CustomSelect';
import FilterDrawer from '../../common/FilterDrawer';
import auditService from '@/services/auditService';
import userService from '@/services/userService';
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
  Globe,
} from 'lucide-react';

export default function SuperAdminSessionManagementView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const { preferences } = usePreference();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total_attempts: 0,
    successful_logins: 0,
    failed_logins: 0,
    unique_ips: 0,
  });
  const [viewingSession, setViewingSession] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Base keys for persistence
  const FILTER_STORAGE_KEY = 'super_admin_sessions_filters';
  const DATE_STORAGE_KEY = 'super_admin_sessions_date';

  const pathname = usePathname();
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [dateRange, setDateRange] = useState(() => {
    const defaultRange = { start: '', end: '' };
    if (typeof window !== 'undefined' && isRefresh) {
      try {
        const saved = sessionStorage.getItem(DATE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultRange;
      } catch (_) {
        return defaultRange;
      }
    }
    return defaultRange;
  });
  const [filters, setFilters] = useState(() => {
    const defaultFilters = { success: 'all', email: '' };
    if (typeof window !== 'undefined' && isRefresh) {
      try {
        const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultFilters;
      } catch (_) {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  // Persist filters on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    sessionStorage.setItem(DATE_STORAGE_KEY, JSON.stringify(dateRange));
    sessionStorage.setItem('app_last_path', pathname);
  }, [filters, dateRange, pathname]);

  // Temporary states for FilterDrawer
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [tempFilters, setTempFilters] = useState({
    success: 'all',
    email: '',
  });

  const syncTempFilters = () => {
    setTempDateRange({ ...dateRange });
    setTempFilters({ ...filters });
  };

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch everything up front. Do not use dateRange or filters.success to conditionally query
      const [historyResult] = await Promise.allSettled([auditService.getLoginHistory({})]);

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
      } else {
        console.error('History API failed', historyResult.reason);
      }

      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load session logs', error);
      Swal.fire('Error', 'Failed to load session logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = viewingSession?.userId || viewingSession?.user_id;
      if (userId) {
        setIsUserLoading(true);
        try {
          const res = await userService.getUserById(userId);
          setUserDetails(res.data || res);
        } catch (error) {
          console.error('Failed to fetch user details', error);
          setUserDetails(null);
        } finally {
          setIsUserLoading(false);
        }
      } else {
        setUserDetails(null);
      }
    };

    fetchUserDetails();
  }, [viewingSession]);

  // Client-side filtering logic
  const filteredSessions = React.useMemo(() => {
    let result = sessions;

    // Filter by Date Range
    if (dateRange.start) {
      const start = new Date(dateRange.start).getTime();
      result = result.filter((session) => {
        const time = new Date(session.createdAt || session.created_at).getTime();
        return time >= start;
      });
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).getTime();
      result = result.filter((session) => {
        const time = new Date(session.createdAt || session.created_at).getTime();
        return time <= end;
      });
    }

    // Filter by Success Status
    if (filters.success !== 'all') {
      const filterVal = filters.success; // 'success' or 'failed'
      result = result.filter((session) => {
        const isSuccess =
          session.success === true ||
          session.success === 1 ||
          session.success === '1' ||
          session.success === 'true';
        return filterVal === 'success' ? isSuccess : !isSuccess;
      });
    }

    // Filter by Email Search
    if (filters.email) {
      const searchTerm = filters.email.toLowerCase();
      result = result.filter((session) => {
        const email = (session.email || '').toLowerCase();
        const userName = (session.userName || session.user_name || '').toLowerCase();
        return email.includes(searchTerm) || userName.includes(searchTerm);
      });
    }

    return result;
  }, [sessions, dateRange, filters.success, filters.email]);

  // Recalculate stats whenever filtered results change
  useEffect(() => {
    const total = filteredSessions.length;
    const successCount = filteredSessions.filter(
      (l) => l.success === true || l.success === 1 || l.success === '1' || l.success === 'true'
    ).length;
    const uniqueIps = new Set(filteredSessions.map((l) => l.ipAddress || l.ip_address || 'unknown'))
      .size;

    setStats({
      total_attempts: total,
      successful_logins: successCount,
      failed_logins: total - successCount,
      unique_ips: uniqueIps,
    });
  }, [filteredSessions]);

  const handleRemoveFilter = (key) => {
    if (key === 'startDate' || key === 'endDate') {
      setDateRange((prev) => ({ ...prev, [key === 'startDate' ? 'start' : 'end']: '' }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [key === 'Status' ? 'success' : key]: key === 'Status' ? 'all' : '',
      }));
    }
  };

  const resetFilters = () => {
    const resetDate = { start: '', end: '' };
    const resetFilt = { success: 'all', email: '' };
    setDateRange(resetDate);
    setFilters(resetFilt);
    setTempDateRange(resetDate);
    setTempFilters(resetFilt);
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setDateRange(tempDateRange);
    setIsFilterOpen(false);
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
        onApply={handleApplyFilters}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <Calendar size={16} /> Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomDateTimePicker
                value={tempDateRange.start}
                onChange={(val) => setTempDateRange((prev) => ({ ...prev, start: val }))}
                placeholder="Select start date"
              />
              <CustomDateTimePicker
                value={tempDateRange.end}
                onChange={(val) => setTempDateRange((prev) => ({ ...prev, end: val }))}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <ShieldAlert size={16} /> Status
            </h3>
            <CustomSelect
              value={tempFilters.success}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, success: e.target.value }))}
              options={[
                { value: 'all', label: 'Select Status' },
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
              ]}
              placeholder="Select Status"
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
              <User size={16} /> Find by email
            </h3>
            <input
              type="text"
              placeholder="Search by email..."
              value={tempFilters.email}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border bg-[rgb(var(--color-surface))]"
            />
          </div>
        </div>
      </FilterDrawer>

      <DataTable
        data={filteredSessions}
        searchKeys={['userName', 'user_name', 'email', 'ipAddress', 'ip_address']}
        searchPlaceholder="Search sessions by user, email, or IP..."
        highlightId={highlightId}
        persistenceKey="super-admin-sessions"
        itemsPerPage={preferences.items_per_page || 10}
        loading={isLoading}
        onFilterClick={() => {
          syncTempFilters();
          setIsFilterOpen(true);
        }}
        onClearFilters={resetFilters}
        onRemoveExternalFilter={handleRemoveFilter}
        hideFilterDropdowns={true}
        externalFilters={{
          startDate: dateRange.start,
          endDate: dateRange.end,
          successStatus: filters.success !== 'all' ? filters.success : '',
          email: filters.email,
        }}
        filterOptions={[
          {
            key: 'successStatus',
            label: 'Success Status',
            options: [
              { value: 'success', label: 'Success' },
              { value: 'failed', label: 'Failed' },
            ],
          },
        ]}
        showClearFilter={
          filters.success !== 'all' ||
          filters.email !== '' ||
          dateRange.start !== '' ||
          dateRange.end !== ''
        }
        columns={[
          {
            header: 'User',
            sortable: true,
            sortKey: (row) => row.userName || row.user_name || row.email || '',
            accessor: (row) => (
              <div>
                <p className="font-semibold">
                  {row.firstName || row.first_name || row.lastName || row.last_name
                    ? `${row.firstName || row.first_name || ''} ${row.lastName || row.last_name || ''}`.trim()
                    : row.userName ||
                      row.user_name ||
                      (row.email ? row.email.split('@')[0] : 'Unknown')}
                </p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            type: 'badge',
            sortable: true,
            sortKey: 'success',
            accessor: (row) => (row.success ? 'Success' : 'Failed'),
            config: {
              green: ['Success'],
              red: ['Failed'],
            },
          },
          {
            header: 'Severity',
            type: 'badge',
            sortable: true,
            sortKey: 'success',
            accessor: (row) => (row.success ? 'Info' : 'Warning'),
            config: {
              blue: ['Info'],
              orange: ['Warning'],
            },
          },
          { header: 'IP Address', accessor: (row) => row.ipAddress || row.ip_address },
          {
            header: 'Location',
            sortable: true,
            sortKey: (row) => {
              const city = row.city || row.location?.city || '';
              const country = row.country || row.location?.country || '';
              return `${city}, ${country}`;
            },
            accessor: (row) => {
              const city = row.city || row.location?.city;
              const country = row.country || row.location?.country;
              if (city && country) return `${city}, ${country}`;
              return city || country || '-';
            },
            className: 'text-xs italic',
          },
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
          showAvatar={false}
          showStatusBadge={false}
          // statusMap={{
          //     success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          //     failed: 'bg-red-50 text-red-700 border-red-200'
          // }}
          data={{
            ...viewingSession,
            name: userDetails
              ? `${userDetails.firstName || userDetails.first_name || ''} ${userDetails.lastName || userDetails.last_name || ''}`.trim() ||
                userDetails.userName ||
                userDetails.user_name ||
                (userDetails.email ? userDetails.email.split('@')[0] : 'Unknown')
              : viewingSession.firstName ||
                  viewingSession.first_name ||
                  viewingSession.lastName ||
                  viewingSession.last_name
                ? `${viewingSession.firstName || viewingSession.first_name || ''} ${viewingSession.lastName || viewingSession.last_name || ''}`.trim()
                : viewingSession.userName ||
                  viewingSession.user_name ||
                  (viewingSession.email ? viewingSession.email.split('@')[0] : 'Unknown'),
            id: viewingSession.id || viewingSession.row_id || '-',
            joinedDate:
              userDetails?.created_at || viewingSession.createdAt || viewingSession.created_at,
            // status: (viewingSession.success === 1 || viewingSession.success === true || viewingSession.success === 'true') ? 'Success' : 'Failed',
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
            formatted_browser: viewingSession.browser || viewingSession.userAgent || '-',
            formatted_agent: (
              <div
                className="text-[10px] text-muted-foreground break-all opacity-70 mt-1"
                title={viewingSession.userAgent}
              >
                {viewingSession.userAgent || '-'}
              </div>
            ),
            formatted_email: viewingSession.email || '-',
            formatted_location: (() => {
              const loc = viewingSession.location;
              if (typeof loc === 'string') return loc;
              if (loc && typeof loc === 'object') {
                const parts = [loc.area, loc.city, loc.state, loc.country].filter(Boolean);
                return parts.length > 0 ? parts.join(', ') : '-';
              }
              return '-';
            })(),
            formatted_isp: viewingSession.isp || viewingSession.location?.isp || '-',
            formatted_coordinates: viewingSession.location?.lat
              ? `${viewingSession.location.lat}, ${viewingSession.location.lng}`
              : '-',
          }}
          sections={[
            {
              title: 'Session Info',
              icon: Lock,
              fields: [
                { label: 'User Name', key: 'name' },
                { label: 'Email', key: 'formatted_email' },
                { label: 'Action', key: 'action' },
                { label: 'Status', key: 'formatted_status' },
                { label: 'Timestamp', key: 'formatted_time' },
              ],
            },
            {
              title: 'Network & Device',
              icon: ShieldAlert,
              fields: [
                { label: 'IP Address', key: 'formatted_ip' },
                { label: 'Browser', key: 'formatted_browser' },
              ],
            },
            {
              title: 'Location Details',
              icon: Globe,
              fields: [
                // { label: "ISP / Network", key: "formatted_isp" },
                { label: 'Location', key: 'formatted_location' },
                { label: 'Coordinates', key: 'formatted_coordinates' },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
