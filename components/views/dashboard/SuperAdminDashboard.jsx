'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Hourglass,
  CheckSquare,
  Building,
  Eye,
  ShieldAlert,
  ChevronRight,
  Calendar,
  CheckCircle,
  LogIn,
  LogOut,
  PlusCircle,
  Trash2,
  AlertCircle,
  Info,
  ShieldCheck,
  User,
  Activity,
  TrendingUp,
  AreaChart as AreaIcon,
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { SkeletonCard, SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, useLanguage } from '@/context/LanguageContext';
import { formatDate, translateUserRole, translateUserName } from '@/utils/i18n';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

export default function SuperAdminDashboard({
  stats = {
    totalQuotes: 0,
    pendingApprovals: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    rejectedQuotes: 0,
    expiredQuotes: 0,
    topDealership: null,
  },
  recentActivity = [],
  loading = false,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useLanguage();

  return (
    <div className="space-y-8 animate-fade-in pb-12">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title={t('stats.totalRevenue') || 'Total Revenue'}
              value={`$${Number(stats.totalRevenue || 0).toLocaleString()}`}
              helperText={
                stats.monthlyGrowth
                  ? `${Number(stats.monthlyGrowth) > 0 ? '+' : ''}${stats.monthlyGrowth}% from last month`
                  : t('stats.revenueGrowth') || 'Platform wide'
              }
              trend={{ positive: Number(stats.monthlyGrowth || 0) >= 0 }}
              icon={<TrendingUp size={24} />}
              accent="rgb(var(--color-primary))"
            />
            <StatCard
              title={t('stats.totalQuotes')}
              value={stats.totalQuotes}
              helperText={t('stats.submittedRequests')}
              trend={{ positive: true }}
              icon={<FileText size={24} />}
              accent="rgb(var(--color-info))"
            />
            <StatCard
              title={t('stats.pendingApprovals')}
              value={stats.pendingApprovals}
              helperText={t('stats.requireAction')}
              trend={{ positive: false }}
              icon={<Hourglass size={24} />}
              accent="rgb(var(--color-warning))"
            />
            <StatCard
              title={t('stats.conversionRate')}
              value={`${stats.conversionRate}%`}
              helperText={t('stats.aboveIndustryAverage')}
              trend={{ positive: true }}
              icon={<CheckSquare size={24} />}
              accent="rgb(var(--color-success))"
            />
          </>
        )}
      </div>

      {/* Performance & Top Performer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quote Status Distribution (Pie Chart) */}
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm min-h-[350px] flex flex-col">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-6">
            <AreaIcon size={18} className="text-blue-500" />
            {t('stats.quoteDistribution') || 'Quote Status Distribution'}
          </h3>

          <div className="flex-1 min-h-[250px] w-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
              </div>
            ) : stats.totalQuotes > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Accepted',
                        value: Number(stats.totalConversions || 0),
                        color: '#10b981',
                      },
                      {
                        name: 'Pending',
                        value: Number(stats.pendingApprovals || 0),
                        color: '#fbbf24',
                      },
                      {
                        name: 'Rejected',
                        value: Number(stats.rejectedQuotes || 0),
                        color: '#ef4444',
                      },
                      {
                        name: 'Expired',
                        value: Number(stats.expiredQuotes || 0),
                        color: '#94a3b8',
                      },
                    ].filter((i) => i.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      {
                        name: 'Accepted',
                        value: Number(stats.totalConversions || 0),
                        color: '#10b981',
                      },
                      {
                        name: 'Pending',
                        value: Number(stats.pendingApprovals || 0),
                        color: '#fbbf24',
                      },
                      {
                        name: 'Rejected',
                        value: Number(stats.rejectedQuotes || 0),
                        color: '#ef4444',
                      },
                      {
                        name: 'Expired',
                        value: Number(stats.expiredQuotes || 0),
                        color: '#94a3b8',
                      },
                    ]
                      .filter((i) => i.value > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgb(var(--color-surface))"
                          strokeWidth={2}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--color-surface))',
                      borderColor: 'rgb(var(--color-border))',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{
                      color: 'rgb(var(--color-text))',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span className="text-sm font-medium text-[rgb(var(--color-text-muted))] ml-2">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--color-text-muted))]">
                <Activity size={48} className="opacity-10 mb-2" />
                <p className="text-sm font-bold">No quotes data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Dealership Card */}
        <div className="bg-[rgb(var(--color-surface))] p-0 rounded-2xl border border-[rgb(var(--color-border))] shadow-md overflow-hidden flex flex-col">
          <div className="p-6 bg-gradient-to-br from-[rgb(var(--color-primary))] to-blue-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Building size={100} />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold opacity-90 uppercase tracking-wide flex items-center gap-2 mb-1">
                <TrendingUp size={16} />
                {t('stats.topPerformer')}
              </h3>
              <h2 className="text-2xl font-extrabold truncate pr-4">
                {stats.topDealership?.name || 'No Data'}
              </h2>
              <p className="text-sm opacity-80 mt-1">Best Performing Dealership</p>
            </div>
          </div>

          {stats.topDealership && (
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center pb-4 border-b border-[rgb(var(--color-border))]">
                <span className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500" /> Total Quotes
                </span>
                <span className="text-lg font-bold text-[rgb(var(--color-text))]">
                  {stats.topDealership.quote_count}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[rgb(var(--color-border))]">
                <span className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="text-blue-500" /> Revenue
                </span>
                <span className="text-lg font-bold text-[rgb(var(--color-text))]">
                  ${Number(stats.topDealership.total_revenue).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-500" /> Conversion
                </span>
                <span className="text-lg font-bold text-[rgb(var(--color-text))]">
                  {stats.topDealership.conversion_rate}%
                </span>
              </div>
            </div>
          )}

          {!stats.topDealership && !loading && (
            <div className="p-6 flex-1 flex items-center justify-center text-[rgb(var(--color-text-muted))]">
              <p className="text-sm">No dealership data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col">
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
              {loading ? (
                <SkeletonTable rows={5} />
              ) : (
                <ActivityTimeline activities={recentActivity} />
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[rgb(var(--color-surface))] p-5 rounded-2xl border border-[rgb(var(--color-border))] shadow-md">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              {t('quickActions')}
            </h3>
            <div className="space-y-3">
              <ActionCard
                title={t('actions.manageDealerships')}
                desc={t('actions.manageDealershipsDesc')}
                icon={Building}
                colorClass="from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]"
                onClick={() => router.push('/dealerships')}
              />
              <ActionCard
                title={t('actions.reviewQuotes')}
                desc={t('actions.reviewQuotesDesc')}
                icon={FileText}
                colorClass="from-[rgb(var(--color-info))] to-[rgb(var(--color-info))]"
                onClick={() => router.push('/quotes')}
              />
              <ActionCard
                title={t('actions.userManagement')}
                desc={t('actions.userManagementDesc')}
                icon={Eye}
                colorClass="from-[rgb(var(--color-success))] to-[rgb(var(--color-success))]"
                onClick={() => router.push('/users')}
              />
              <ActionCard
                title={t('actions.broadcastCenter')}
                desc={t('actions.broadcastCenterDesc')}
                icon={ShieldAlert}
                colorClass="from-[rgb(var(--color-warning))] to-[rgb(var(--color-error))]"
                onClick={() => router.push('/notifications')}
              />
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[rgb(var(--color-surface))] p-5 rounded-2xl border border-[rgb(var(--color-border))] shadow-md space-y-5">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide mb-4">
              {t('systemStatus.title')}
            </h3>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[rgb(var(--color-text-muted))] font-medium">
                  {t('systemStatus.databaseLoad')}
                </span>
                <span className="font-bold text-[rgb(var(--color-text))]">24%</span>
              </div>
              <div className="h-1.5 w-full bg-[rgb(var(--color-background))] rounded-full overflow-hidden border border-[rgb(var(--color-border))]">
                <div className="h-full bg-[rgb(var(--color-success))] w-[24%] rounded-full shadow-[0_0_10px_rgb(var(--color-success)/0.3)]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[rgb(var(--color-text-muted))] font-medium">
                  {t('systemStatus.apiLatency')}
                </span>
                <span className="font-bold text-[rgb(var(--color-text))]">45ms</span>
              </div>
              <div className="h-1.5 w-full bg-[rgb(var(--color-background))] rounded-full overflow-hidden border border-[rgb(var(--color-border))]">
                <div className="h-full bg-[rgb(var(--color-primary))] w-[15%] rounded-full shadow-[0_0_10px_rgb(var(--color-primary)/0.3)]"></div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[rgb(var(--color-border))]">
              <p className="text-[10px] text-center text-[rgb(var(--color-text-muted))] font-medium">
                {t('systemStatus.lastChecked')}:{' '}
                <span className="text-[rgb(var(--color-text))]">{t('systemStatus.justNow')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
