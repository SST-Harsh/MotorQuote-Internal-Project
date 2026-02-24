'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, useLanguage } from '@/context/LanguageContext';
import { formatDate, translateUserName } from '@/utils/i18n';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import {
  Building,
  FileText,
  CheckCircle,
  TrendingUp,
  Users,
  ChevronDown,
  Activity,
  ShieldAlert,
  Eye,
} from 'lucide-react';
import {
  SalesBySegmentChart,
  InventoryChart,
  SalesVelocityChart,
  UnitSoldDonutChart,
  TopDealersChart,
} from './DashboardCharts';

const DesignWidget = ({
  title,
  value,
  helperText,
  trend,
  chart: ChartComponent,
  chartData,
  color = 'red',
  dropdownLabel = 'Filter',
}) => (
  <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex flex-col h-full transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">{title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          {value && (
            <span className="text-4xl font-bold text-[rgb(var(--color-text))]">{value}</span>
          )}
          {helperText && (
            <span className="text-sm text-[rgb(var(--color-text-muted))]">{helperText}</span>
          )}
        </div>
        {trend && (
          <div
            className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {trend.value} {trend.label}
          </div>
        )}
      </div>
      <button className="text-xs font-medium bg-[rgb(var(--color-background))] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-100 transition-colors">
        {dropdownLabel} <ChevronDown size={14} />
      </button>
    </div>

    <div className="flex-1 w-full min-h-[100px] mt-2">
      {ChartComponent && <ChartComponent data={chartData} color={color} />}
    </div>
  </div>
);

const ActionCard = ({ title, desc, icon: Icon, onClick, colorClass }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all hover:shadow-sm hover:bg-[rgb(var(--color-background))]/50 w-full text-left"
  >
    <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClass} text-white shadow-sm`}>
      <Icon size={16} />
    </div>
    <div>
      <h4 className="font-bold text-[rgb(var(--color-text))] text-xs">{title}</h4>
      <p className="text-[10px] text-[rgb(var(--color-text-muted))] leading-tight">{desc}</p>
    </div>
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
    topDealership: null,
  },
  recentActivity = [],
  loading = false,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useLanguage();

  // Mock Data for Top Dealerships (Replace with real data if available from stats)
  const topDealersData = [
    { name: stats.topDealership?.name || 'Motor4U', sales: '85%', trend: '+12%', color: '#CCFF00' },
    { name: 'BINCA', sales: '72%', trend: '+5%', color: '#8b5cf6' },
    { name: 'TT50', sales: '64%', trend: '-2%', color: '#ec4899' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in p-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">
            Welcome{' '}
            <span className="text-[#6a7150cb] font-bold">
              {(() => {
                const displayName =
                  user?.full_name ||
                  (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
                  user?.name ||
                  'Admin';
                return translateUserName(displayName, tCommon);
              })()}
            </span>
          </h1>
          <p className="text-[rgb(var(--color-text-muted))] text-sm mt-1 flex items-center gap-2">
            <span>{formatDate(new Date())}</span>
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))]"></span>
            <span>Here&apos;s what&apos;s happening across the platform today.</span>
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Dealers & Revenue */}
        <div className="space-y-6 flex flex-col">
          {/* Top Performance */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Top Dealerships</h3>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium">This Week</span>
              </div>
            </div>
            {/* Mini Chart for Dealers */}
            <div className="mb-4">
              <TopDealersChart />
            </div>
            <div className="space-y-4">
              {topDealersData.map((dealer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: dealer.color }}
                    ></span>
                    <span className="font-medium text-sm text-[rgb(var(--color-text))]">
                      {dealer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{dealer.sales}</span>
                    <span
                      className={`text-xs ${dealer.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {dealer.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue (Green Card) */}
          <div className="bg-[#CCFF00] rounded-3xl p-6 shadow-sm relative overflow-hidden text-black min-h-[160px]">
            <h3 className="font-bold text-lg mb-1">Total Revenue</h3>
            <div className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div className="mt-6">
              <div className="text-4xl font-extrabold">
                ${Number(stats.totalRevenue || 0).toLocaleString()}
              </div>
              <div className="text-sm font-medium opacity-80">
                {Number(stats.monthlyGrowth || 0) > 0 ? '+' : ''}
                {stats.monthlyGrowth}% from last month
              </div>
            </div>
          </div>

          {/* Quote Distribution Donut */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))]">
            <h3 className="font-bold text-lg text-[rgb(var(--color-text))] mb-4">
              Quote Distribution
            </h3>
            <UnitSoldDonutChart />
          </div>
        </div>

        {/* Column 2: Sales Charts */}
        <div className="space-y-6 flex flex-col">
          <DesignWidget
            title="Total Quotes"
            value={stats.totalQuotes || '0'}
            helperText="Submitted Requests"
            trend={{ value: '+12%', label: 'vs last month', isPositive: true }}
            chart={SalesBySegmentChart}
            color="red"
          />

          <DesignWidget
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            helperText="Above Industry Average"
            trend={{ value: '+2.4%', label: 'vs last month', isPositive: true }}
            chart={SalesVelocityChart}
            color="green"
            dropdownLabel="Filter"
          />
        </div>

        {/* Column 3: Stats & Actions */}
        <div className="space-y-6 flex flex-col">
          <DesignWidget
            title="Pending Approvals"
            value={stats.pendingApprovals || '0'}
            helperText="Requires Action"
            trend={{ value: 'Urgent', label: 'items', isPositive: false }}
            chart={InventoryChart}
            color="red"
          />

          <DesignWidget
            title="System Health"
            value="98%"
            helperText="Uptime"
            trend={{ value: 'Stable', label: '', isPositive: true }}
            chart={(props) => <SalesVelocityChart {...props} color="red" />}
            color="red"
            dropdownLabel="Server"
          />
        </div>
      </div>

      {/* Bottom Section: Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))]">
          <h3 className="font-bold text-lg text-[rgb(var(--color-text))] mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Recent Activity */}
        <div className="bg-[rgb(var(--color-surface))] rounded-3xl p-6 shadow-sm border border-[rgb(var(--color-border))] flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Recent Activity</h3>
            <Link href="/session_management" className="text-xs text-blue-500 font-bold">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">
            <ActivityTimeline activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
