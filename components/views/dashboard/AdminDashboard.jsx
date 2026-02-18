import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  ArrowRight,
  Users,
  Building2,
  Calendar,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useTranslation, useLanguage } from '@/context/LanguageContext';
import { formatDate, translateUserName } from '@/utils/i18n';

import StatCard from '@/components/common/StatCard';
import ActivityTimeline from '@/components/common/ActivityTimeline';

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

export default function AdminDashboard({
  stats = { quotes: 0, pending: 0, users: 0, dealers: 0 },
  recentQuotes = [],
  recentActivity = [],
  loading = false,
}) {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useLanguage();
  const router = useRouter();

  if (loading)
    return (
      <div className="p-12 text-center text-[rgb(var(--color-text-muted))]">
        {tCommon('loading')}
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <StatCard
          title={t('stats.totalRevenue')}
          value={`$${Number(stats.revenueStats?.total_revenue || stats.revenue || 0).toLocaleString()}`}
          icon={<FileText size={24} />}
          helperText={t('stats.grossValue')}
          accent="#22c55e" // green-500
          trend={{
            positive: Number(stats.revenueStats?.revenue_growth) >= 0,
            label: `${stats.revenueStats?.revenue_growth || 0}%`,
          }}
        />

        {/* Total Quotes */}
        <StatCard
          title={t('stats.totalQuotes')}
          value={stats.quoteStats?.total_quotes || stats.quotes || 0}
          icon={<FileText size={24} />}
          helperText={t('stats.quotesGenerated')}
          accent="#3b82f6" // blue-500
          trend={{
            positive: Number(stats.quoteStats?.monthly_growth) >= 0,
            label: `${stats.quoteStats?.monthly_growth || 0}%`,
          }}
        />

        {/* Active Users */}
        <StatCard
          title={t('stats.totalUsers')}
          value={stats.userStats?.active_users || stats.users || 0}
          icon={<Users size={24} />}
          helperText={`${stats.userStats?.total_users || 0} registered`}
          accent="#a855f7" // purple-500
        />

        {/* Support Tickets */}
        <StatCard
          title={t('stats.supportTickets')}
          value={stats.support?.open_tickets || 0}
          icon={<Clock size={24} />}
          helperText={`${stats.support?.total_tickets || 0} ${t('stats.totalTickets')}`}
          accent="#f97316" // orange-500
          trend={{
            positive: false, // High open tickets usually bad, but context depends
            label: `${stats.support?.resolved_tickets || 0} ${t('stats.resolvedTickets')}`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[rgb(var(--color-border))] flex items-center justify-between bg-[rgb(var(--color-background))/0.02]">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide flex items-center gap-2">
              <Activity size={16} className="text-[rgb(var(--color-primary))]" />
              {t('recentActivity')}
            </h3>
            <Link
              href="/session_management"
              className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] transition-colors"
            >
              {t('viewAll')}
            </Link>
          </div>

          <div className="p-6">
            <ActivityTimeline activities={recentActivity} />
          </div>
        </div>

        <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm p-6">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4">
            {t('quickActions')}
          </h3>
          <div className="space-y-3">
            <ActionCard
              title={t('actions.manageDealerships')}
              desc="Manage users and staff across your network"
              icon={Users}
              onClick={() => router.push('/users')}
              colorClass="from-purple-500 to-purple-600"
            />
            <ActionCard
              title={t('actions.myDealerships')}
              desc="View and manage effectively your organization's dealership details"
              icon={Building2}
              onClick={() => router.push('/dealerships')}
              colorClass="from-blue-500 to-blue-600"
            />
            <ActionCard
              title={t('actions.viewQuotes')}
              desc="Review and process quote requests"
              icon={FileText}
              onClick={() => router.push('/quotes')}
              colorClass="from-green-500 to-green-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
