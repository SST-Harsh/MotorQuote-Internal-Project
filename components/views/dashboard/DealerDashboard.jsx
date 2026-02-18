'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import { useAuth } from '@/context/AuthContext';
import dealerService from '@/services/dealerService';
import analyticsService from '@/services/analyticsService';
import auditService from '@/services/auditService';
import Skeleton from '@/components/common/Skeleton';
import { useTranslation, useLanguage } from '@/context/LanguageContext';
import {
  formatDate,
  formatCurrency,
  formatCompactCurrency,
  formatCompactNumber,
  translateUserName,
} from '@/utils/i18n';

export default function DealerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useLanguage();
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
    },
    recentActivity: [],
    performance: null,
    notifications: [
      {
        id: 1,
        title: 'System Maintenance',
        desc: 'Scheduled for tonight at 2 AM EST.',
        urgent: false,
      },
      { id: 2, title: 'Action Required', desc: 'Check pending quotes.', urgent: true },
    ],
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const dealershipId =
        user.dealership_id || (user.roleDetails && user.roleDetails.dealership_id);

      const [summaryResult, activityResult, perfResult, loginLogsResult] = await Promise.allSettled(
        [
          dealerService.getDashboardSummary(),
          dealerService.getRecentActivity({ limit: 5 }),
          user.id ? analyticsService.getManagerPerformance(user.id) : Promise.resolve(null),

          user.id
            ? auditService
                .getLoginHistory({
                  userId: user.id,
                  limit: 5,
                })
                .catch(() => [])
            : Promise.resolve([]),
        ]
      );

      const currentUserDisplayName =
        user?.full_name ||
        (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
        user?.name ||
        user?.username ||
        'Admin';
      const currentUserAvatar = user?.profile_picture || user?.profile_image || null;

      const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
      if (summaryResult.status === 'rejected')
        console.error('Dashboard summary failed:', summaryResult.reason);

      let activities = [];
      if (activityResult.status === 'fulfilled') {
        const response = activityResult.value;
        const rawActivities = Array.isArray(response) ? response : response?.data || [];

        activities = rawActivities
          .filter((item) => {
            if (
              dealershipId &&
              item.dealership_id &&
              String(item.dealership_id) !== String(dealershipId)
            ) {
              return false;
            }
            const role = (item.user_role || item.role || '').toLowerCase();
            const name = (item.user_name || item.userName || '').toLowerCase();

            if (
              role.includes('super_admin') ||
              role.includes('admin') ||
              name.includes('super admin') ||
              name.includes('admin work')
            ) {
              if (!role.includes('dealer') && !name.includes('dealer')) return false;
            }

            const activityUserId = item.user_id || item.userId || item.actor_id;
            if (activityUserId && String(activityUserId) !== String(user.id)) {
              return false;
            }

            return true;
          })
          .map((item) => {
            const activityUserId = item.user_id || item.userId || item.actor_id;
            const isPrimaryUser = activityUserId && String(activityUserId) === String(user.id);

            return {
              id: item.id || Math.random().toString(),
              user_name: translateUserName(
                isPrimaryUser
                  ? currentUserDisplayName
                  : item.user_name || item.userName || tCommon('you'),
                tCommon
              ),
              user_avatar: isPrimaryUser
                ? currentUserAvatar
                : item.user_avatar || item.userAvatar || null,
              action: String(item.action || item.event || 'activity').toLowerCase(),
              created_at: item.timestamp || item.created_at || new Date().toISOString(),
              metadata: item.metadata || {},
              entity_id: item.entity_id,
              description: item.description || item.details || '',
            };
          });
      } else {
        console.error('Recent activity fetch failed:', activityResult.reason);
      }

      let loginLogs = [];
      if (loginLogsResult.status === 'fulfilled') {
        const response = loginLogsResult.value;
        const rawLogs = Array.isArray(response)
          ? response
          : response?.data || response?.loginHistory || response?.login_history || [];
        loginLogs = rawLogs.map((log) => ({
          id: log.id,
          user_name: translateUserName(currentUserDisplayName, tCommon),
          user_avatar: currentUserAvatar,
          action: 'login',
          created_at: log.timestamp || log.created_at || log.createdAt || new Date().toISOString(),
          metadata: {},
          description: log.success
            ? t('activity.loginAttempt') || 'Logged into the system'
            : 'Failed login attempt',
        }));
      }

      // Deduplicate: Some events (like logins) might appear in both streams
      const uniqueActivities = [];
      const seen = new Set();

      [...activities, ...loginLogs].forEach((item) => {
        // Create a unique key based on actor, action, and approximate time (ignoring milliseconds)
        const timeStr = new Date(item.created_at).toISOString().split('.')[0];
        const key = `${item.user_name}-${item.action}-${timeStr}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueActivities.push(item);
        }
      });

      const combinedActivity = uniqueActivities
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      const performance =
        perfResult.status === 'fulfilled' && perfResult.value
          ? perfResult.value.data || null
          : null;

      if (!summaryData && !activities.length && !loginLogs.length) {
      }

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
            }
          : prev.overview,
        recentActivity: combinedActivity,
        performance: performance,
      }));
    } catch (err) {
      console.error('Critical dashboard error:', err);
      setError(tCommon('error') || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [user, t, tCommon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ActionCard = ({ title, desc, icon: Icon, onClick, colorClass, borderClass }) => (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-between p-4 rounded-xl border bg-[rgb(var(--color-surface))] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 w-full text-left ${borderClass || 'border-[rgb(var(--color-border))]'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2 rounded-lg bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] group-hover:text-white group-hover:bg-gradient-to-br ${colorClass} transition-all duration-300 shadow-sm`}
        >
          <Icon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-[rgb(var(--color-text))] text-[13px]">{title}</h4>
          {desc && (
            <p className="text-[11px] text-[rgb(var(--color-text-muted))] mt-0.5 leading-tight">
              {desc}
            </p>
          )}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-[rgb(var(--color-border))] group-hover:text-[rgb(var(--color-primary))] transform group-hover:translate-x-1 transition-all"
      />
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[rgb(var(--color-border))]">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">
            {(() => {
              const displayName =
                user?.full_name ||
                (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
                user?.name ||
                user?.username ||
                'Admin';
              const userName = translateUserName(displayName, tCommon);
              const marker = '___NAME___';
              const greeting = t('welcomeBack', { userName: marker });
              const [prefix, suffix] = greeting.split(marker);
              return (
                <>
                  {prefix}
                  <span className="text-[rgb(var(--color-primary))] capitalize">{userName}</span>
                  {suffix}
                </>
              );
            })()}
          </h2>
          <p className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
            <Calendar size={14} className="text-[rgb(var(--color-primary))]" />
            <span>{formatDate(new Date())}</span>
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))] mx-1"></span>
            <span className="opacity-80">{t('subtitle')}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title={t('stats.totalQuotes')}
          value={
            isLoading ? (
              <Skeleton width={60} />
            ) : (
              formatCompactNumber(dashboardData.overview.total_quotes)
            )
          }
          helperText={t('stats.activeNetwork')}
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
          title={t('stats.pendingQuotes')}
          value={
            isLoading ? (
              <Skeleton width={60} />
            ) : (
              formatCompactNumber(dashboardData.overview.pending_quotes)
            )
          }
          helperText={t('stats.awaitingAction') || 'Awaiting action'}
          accent="#f59e0b"
          icon={<Clock size={20} />}
          loading={isLoading}
        />
        <StatCard
          title={t('stats.approvalRate')}
          value={
            isLoading ? (
              <Skeleton width={60} />
            ) : (
              `${dashboardData.performance?.metrics?.approval_rate || '0'}%`
            )
          }
          helperText={t('stats.last30Days')}
          icon={<TrendingUp size={20} />}
          accent="#10b981"
          loading={isLoading}
        />
        <StatCard
          title={t('stats.totalRevenue')}
          value={
            isLoading ? (
              <Skeleton width={80} />
            ) : (
              formatCompactCurrency(dashboardData.overview.total_revenue)
            )
          }
          helperText={t('stats.grossValue') || 'Gross value'}
          icon={<DollarSign size={20} />}
          accent="#8b5cf6"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))/0.02]">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-[rgb(var(--color-primary))]" />
                {t('recentActivity')}
              </h3>
              <button
                onClick={() => router.push('/session_management')}
                className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] transition-colors"
              >
                {t('viewAll')}
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
              {t('quickActions')}
            </h3>
            <div className="space-y-3">
              <ActionCard
                title={t('actions.createQuote')}
                desc={t('actions.createQuoteDesc')}
                icon={Plus}
                colorClass="from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]"
                onClick={() => router.push('/quotes/new')}
              />
              <ActionCard
                title={t('actions.pendingApprovals')}
                desc={t('actions.quotesAttention')?.replace(
                  '{{count}}',
                  dashboardData.overview.pending_quotes
                )}
                icon={CheckSquare}
                colorClass="from-[rgb(var(--color-warning))] to-[rgb(var(--color-error))]"
                onClick={() => router.push('/quotes?status=pending')}
              />
            </div>
          </div>

          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-4 border-b border-[rgb(var(--color-border))] bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
                <Bell size={16} className="text-gray-500" />
                {t('notifications.title')}
              </h3>
              {dashboardData.notifications.some((n) => n.urgent) && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {t('notifications.actionRequired')}
                </span>
              )}
            </div>
            <div className="divide-y divide-[rgb(var(--color-border))]">
              {dashboardData.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 hover:bg-[rgb(var(--color-background)/0.3)] transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className={`text-sm font-semibold ${notif.urgent ? 'text-red-600' : 'text-[rgb(var(--color-text))]'}`}
                    >
                      {notif.title === 'System Maintenance'
                        ? t('notifications.systemMaintenance')
                        : notif.title === 'Action Required'
                          ? t('notifications.actionRequired')
                          : notif.title}
                    </h4>
                    {notif.urgent && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-xs text-[rgb(var(--color-text-muted))]">{notif.desc}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/notifications')}
              className="w-full py-3 text-xs font-medium text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] transition-colors border-t border-[rgb(var(--color-border))]"
            >
              {t('notifications.viewAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
