'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  DollarSign,
  CheckSquare,
  Car,
  Plus,
  Search,
  Bell,
  History,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  Download,
  RefreshCcw,
  ChevronRight,
  Activity,
  Building2,
  UserPlus,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import dealerService from '@/services/dealerService';
import analyticsService from '@/services/analyticsService';
import auditService from '@/services/auditService';
import Skeleton from '@/components/common/Skeleton';
import { useNotifications } from '@/context/NotificationContext';
import {
  formatDate,
  formatCurrency,
  formatCompactCurrency,
  formatCompactNumber,
} from '@/utils/i18n';
import {
  hasPermission,
  canCreateQuote,
  canCreateDealership,
  canCreateUsers,
} from '@/utils/roleUtils';

export default function DealerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = usePreference();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: {
      total_quotes: 0,
      total_revenue: '0',
      avg_quote_amount: '0',
      pending_quotes: 0,
      accepted_quotes: 0,
      rejected_quotes: 0,
      expired_quotes: 0,
    },
    recentActivity: [],
    performance: null,
  });

  const { userNotifications, isLoading: isNotisLoading } = useNotifications();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Get dealership_id from user - check multiple possible locations
      const dealershipId =
        user.dealership_id ||
        (user.roleDetails && user.roleDetails.dealership_id) ||
        user.dealer_id ||
        (user.roleDetails && user.roleDetails.dealer_id) ||
        (user.dealership && user.dealership.id);

      const params = dealershipId ? { dealership_id: dealershipId } : {};

      const [summaryResult, activityResult, loginLogsResult] = await Promise.allSettled([
        dealerService.getDashboardSummary(params),
        dealerService.getRecentActivity({ ...params, limit: 5 }),
        user.id
          ? auditService
              .getLoginHistory({
                userId: user.id,
                limit: 5,
              })
              .catch(() => [])
          : Promise.resolve([]),
      ]);

      const currentUserDisplayName =
        user?.full_name ||
        (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
        user?.name ||
        user?.username ||
        'Admin';
      const currentUserAvatar = user?.profile_picture || user?.profile_image || null;

      const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

      // 1. Resolve Recent Activities - Filter to only show login/logout activities
      let activities = [];
      if (activityResult.status === 'fulfilled') {
        const response = activityResult.value;
        const rawActivities = Array.isArray(response) ? response : response?.data || [];

        // Filter to only include login/logout related activities
        activities = rawActivities
          .filter((item) => {
            // Only include login/logout related actions
            const action = String(item.action || item.event || '').toLowerCase();
            const isLoginActivity =
              action.includes('login') || action.includes('logout') || action.includes('session');

            if (!isLoginActivity) return false;

            if (
              dealershipId &&
              item.dealership_id &&
              String(item.dealership_id) !== String(dealershipId)
            )
              return false;
            const role = (item.user_role || item.role || '').toLowerCase();
            const name = (item.user_name || item.userName || '').toLowerCase();
            if (role.includes('super_admin') || name.includes('super admin')) {
              if (!role.includes('dealer') && !name.includes('dealer')) return false;
            }
            const activityUserId = item.user_id || item.userId || item.actor_id;
            if (activityUserId && String(activityUserId) !== String(user.id)) return false;
            return true;
          })
          .map((item) => {
            const activityUserId = item.user_id || item.userId || item.actor_id;
            const isPrimaryUser = activityUserId && String(activityUserId) === String(user.id);
            return {
              id: item.id || Math.random().toString(),
              user_name: isPrimaryUser
                ? currentUserDisplayName
                : item.user_name || item.userName || 'You',
              user_avatar: isPrimaryUser
                ? currentUserAvatar
                : item.user_avatar || item.userAvatar || null,
              user_role: item.user_role || item.role || (isPrimaryUser ? user.role : null),
              action: String(item.action || item.event || 'activity').toLowerCase(),
              new_status: item.details?.new_status ? String(item.details.new_status) : '',
              created_at: item.timestamp || item.created_at || new Date().toISOString(),
              metadata: item.metadata || {},
              entity_id: item.entity_id,
              description:
                typeof item.description === 'string'
                  ? item.description
                  : typeof item.details === 'string'
                    ? item.details
                    : item.metadata?.message || '',
            };
          });
      }

      // 2. Resolve Login/Logout Logs
      let loginLogs = [];
      if (loginLogsResult.status === 'fulfilled') {
        const response = loginLogsResult.value;
        const rawLogs = Array.isArray(response)
          ? response
          : response?.data || response?.loginHistory || response?.login_history || [];
        loginLogs = rawLogs.map((log) => {
          // Detect if this is a login or logout activity
          const logType = String(log.action || log.type || log.event || '').toLowerCase();
          const isLogout =
            logType.includes('logout') ||
            logType.includes('session_end') ||
            logType.includes('sign_out');
          const isLogin =
            logType.includes('login') ||
            logType.includes('session_start') ||
            logType.includes('sign_in');

          let action = 'activity';
          let description = '';

          if (isLogout) {
            action = 'logout';
            description = 'Logged out of the system';
          } else if (isLogin) {
            action = 'login';
            description = log.success ? 'Logged into the system' : 'Failed login attempt';
          } else {
            // Default based on success field
            action = log.success !== false ? 'login' : 'login_failed';
            description = log.success ? 'Logged into the system' : 'Failed login attempt';
          }

          return {
            id: log.id,
            user_name: currentUserDisplayName,
            user_avatar: currentUserAvatar,
            user_role: user.role,
            action: action,
            created_at:
              log.timestamp || log.created_at || log.createdAt || new Date().toISOString(),
            metadata: {},
            description: description,
          };
        });
      }

      // Combine and Deduplicate Activities
      const uniqueActivities = [];
      const seen = new Set();
      [...activities, ...loginLogs].forEach((item) => {
        // Normalize action for deduplication (e.g., "login_success", "LOGIN", "login" -> "login")
        let normalizedAction = item.action;
        if (item.action.includes('login')) {
          normalizedAction = 'login';
        } else if (item.action.includes('logout')) {
          normalizedAction = 'logout';
        }

        // Group by minute to handle small clock offsets between different log sources
        const date = new Date(item.created_at);
        const timeStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;

        const key = `${item.user_name}-${normalizedAction}-${timeStr}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueActivities.push(item);
        }
      });

      const combinedActivity = uniqueActivities
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setDashboardData((prev) => ({
        ...prev,
        overview: summaryData?.overview
          ? {
              total_quotes: Number(summaryData.overview.total_quotes || 0),
              total_revenue: Number(summaryData.overview.total_revenue || 0),
              avg_quote_amount: Number(summaryData.overview.avg_quote_amount || 0),
              pending_quotes: Number(summaryData.overview.pending_quotes || 0),
              accepted_quotes: Number(summaryData.overview.accepted_quotes || 0),
              rejected_quotes: Number(summaryData.overview.rejected_quotes || 0),
              expired_quotes: Number(summaryData.overview.expired_quotes || 0),
              approval_rate: Number(
                summaryData.overview.approval_rate || summaryData.overview.conversion_rate || 0
              ),
            }
          : prev.overview,
        recentActivity: combinedActivity,
        performance: summaryData || null,
      }));
    } catch (err) {
      console.error('Critical dashboard error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const displayNotifications = React.useMemo(() => {
    return (userNotifications || [])
      .filter((n) => {
        const isRead = n.isRead || n.is_read;
        const priority = (n.priority || 'medium').toLowerCase();
        const type = (n.type || 'info').toLowerCase();

        // Show if unread AND (high priority OR quote/status update)
        const isUrgent = ['high', 'urgent', 'critical'].includes(priority);
        const isQuoteUpdate = ['quote', 'status'].includes(type);

        return !isRead && (isUrgent || isQuoteUpdate);
      })
      .map((n) => ({
        id: n.id,
        title: n.title,
        desc: n.message || n.content || n.desc,
        urgent: ['high', 'urgent', 'critical'].includes((n.priority || '').toLowerCase()),
      }))
      .slice(0, 5);
  }, [userNotifications]);

  const canCreateDealerAction = user ? canCreateDealership(user) : false;
  const canCreateQuoteAction = user ? canCreateQuote(user) : false;
  const canInviteStaffAction = user ? canCreateUsers(user) : false;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ActionCard = ({
    title,
    desc,
    icon: Icon,
    onClick,
    colorClass,
    borderClass,
    disabled = false,
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center justify-between p-4 rounded-xl border bg-[rgb(var(--color-surface))] transition-all duration-300 w-full text-left 
                ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[0.5]' : 'hover:shadow-md hover:-translate-y-0.5'} 
                ${borderClass || 'border-[rgb(var(--color-border))]'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2 rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] 
                    ${!disabled ? `group-hover:text-white group-hover:bg-gradient-to-br ${colorClass}` : ''} 
                    transition-all duration-300 shadow-sm`}
        >
          <Icon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-[rgb(var(--color-text))] text-[13px]">
            {title}
            {disabled && (
              <span className="ml-2 text-[8px] font-bold uppercase tracking-wider text-red-500 bg-red-100 px-1 rounded">
                Locked
              </span>
            )}
          </h4>
          {desc && (
            <p className="text-[11px] text-[rgb(var(--color-text-muted))] mt-0.5 leading-tight">
              {desc}
            </p>
          )}
        </div>
      </div>
      {!disabled && (
        <ChevronRight
          size={16}
          className="text-[rgb(var(--color-border))] group-hover:text-[rgb(var(--color-primary))] transform group-hover:translate-x-1 transition-all"
        />
      )}
      {disabled && <Clock size={16} className="text-[rgb(var(--color-text-muted))] opacity-20" />}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[rgb(var(--color-border))]">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">
            Welcome back,{' '}
            <span className="text-[rgb(var(--color-primary))] capitalize">
              {user?.full_name ||
                (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
                user?.name ||
                user?.username ||
                'Admin'}
            </span>
          </h2>
          <p className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
            <Calendar size={14} className="text-[rgb(var(--color-primary))]" />
            <span>{formatDate(new Date())}</span>
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))] mx-1"></span>
            <span className="opacity-80">Dealership Performance & Activities</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {preferences.show_quick_stats !== false && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Quotes"
            value={
              isLoading ? (
                <Skeleton width={60} />
              ) : (
                formatCompactNumber(dashboardData.overview.total_quotes)
              )
            }
            helperText="Active network"
            trend={
              dashboardData.performance?.comparison?.vs_last_period?.quote_growth
                ? {
                    positive: dashboardData.performance.comparison.vs_last_period.quote_growth > 0,
                    label: `${dashboardData.performance.comparison.vs_last_period.quote_growth}% growth`,
                  }
                : null
            }
            icon={<FileText size={20} />}
            accent="#3b82f6"
            loading={isLoading}
          />
          <StatCard
            title="Pending Quotes"
            value={
              isLoading ? (
                <Skeleton width={60} />
              ) : (
                formatCompactNumber(dashboardData.overview.pending_quotes)
              )
            }
            helperText="Awaiting action"
            accent="#f59e0b"
            icon={<Clock size={20} />}
            loading={isLoading}
          />
          <StatCard
            title="Approval Rate"
            value={
              isLoading ? (
                <Skeleton width={60} />
              ) : (
                `${dashboardData.overview.approval_rate || dashboardData.performance?.metrics?.approval_rate || '0'}%`
              )
            }
            helperText="Last 30 days"
            icon={<TrendingUp size={20} />}
            accent="#10b981"
            loading={isLoading}
          />
          <StatCard
            title="Total Revenue"
            value={
              isLoading ? (
                <Skeleton width={80} />
              ) : (
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 2,
                }).format(Number(dashboardData.overview.total_revenue || 0))
              )
            }
            helperText="Net value"
            icon={<DollarSign size={20} />}
            accent="#8b5cf6"
            loading={isLoading}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))/0.02]">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-[rgb(var(--color-primary))]" />
                Recent Activity
              </h3>
              <button
                onClick={() => router.push('/session_management')}
                className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] transition-colors"
              >
                View All
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Skeleton variant="circular" height={48} width={48} />
                        <div className="flex-1">
                          <Skeleton width="60%" height={16} />
                          <Skeleton width="40%" height={12} className="mt-2" />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <ActivityTimeline
                  activities={dashboardData.recentActivity.map((item) => ({
                    ...item,
                    timestamp: item.created_at, // Ensure timestamp mapping is correct for ActivityTimeline
                  }))}
                />
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[rgb(var(--color-surface))] p-5 rounded-2xl border border-[rgb(var(--color-border))]">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide mb-4 flex items-center gap-2">
              <CheckSquare size={16} className="text-[rgb(var(--color-primary))]" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <ActionCard
                title="Invite Staff"
                desc="Invite a new member to your dealership"
                icon={UserPlus}
                colorClass="from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]"
                onClick={() => router.push('/users')}
                disabled={!canInviteStaffAction}
              />
              <ActionCard
                title="Pending Actions"
                desc={`${dashboardData.overview.pending_quotes} quotes require your attention`}
                icon={CheckSquare}
                colorClass="from-[rgb(var(--color-warning))] to-[rgb(var(--color-error))]"
                onClick={() => router.push('/quotes')}
              />
            </div>
          </div>

          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.02] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
                <Bell size={16} className="text-[rgb(var(--color-text))]" />
                Notifications
              </h3>
              {displayNotifications.some((n) => n.urgent) && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  Action Required
                </span>
              )}
            </div>
            <div className="divide-y divide-[rgb(var(--color-border))]">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-[rgb(var(--color-background)/0.3)] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4
                        className={`text-sm font-semibold ${notif.urgent ? 'text-red-600' : 'text-[rgb(var(--color-text))]'}`}
                      >
                        {notif.title === 'System Maintenance'
                          ? 'System Maintenance'
                          : notif.title === 'Action Required'
                            ? 'Action Required'
                            : notif.title}
                      </h4>
                      {notif.urgent && (
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">{notif.desc}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push('/notifications')}
              className="w-full py-3 text-xs font-medium text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] transition-colors border-t border-[rgb(var(--color-border))]"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
