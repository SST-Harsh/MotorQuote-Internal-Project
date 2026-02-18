'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart as BarIcon,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  ChevronDown,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  LayoutDashboard as AreaIcon,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import analyticsService from '@/services/analyticsService';
import userService from '@/services/userService';
import Skeleton from '@/components/common/Skeleton';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

export default function DealerReportView() {
  const { preferences } = usePreference();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [dealershipId, setDealershipId] = useState(
    user?.dealership_id ||
      user?.roleDetails?.dealership_id ||
      user?.dealer_id ||
      user?.dealership?.id ||
      user?.dealership
  );

  const calculateParams = useCallback((rangeValue) => {
    const params = {
      period: rangeValue,
    };

    if (rangeValue !== 'all') {
      const end = new Date();
      const start = new Date();
      const daysMap = { '7days': 7, '30days': 30, '90days': 90 };
      const days = daysMap[rangeValue] || 30;

      start.setDate(end.getDate() - days);

      const toDateStr = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      params.start_date = toDateStr(start);
      params.end_date = toDateStr(end);
    }

    return params;
  }, []);

  const fetchReportData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = calculateParams(dateRange);

      console.log('📅 [Dealer Report] Fetching analytics with params:', params);

      // Fetch performance analytics (now derived solely from performance endpoint)
      const response = await analyticsService.getDealerPerformanceRoleBased(params);
      const data = response?.data || response || {};

      const performance = data.performance || {};
      const managers = data.managers || [];
      const daily_trends = data.daily_trends || [];

      const metrics = {
        total_revenue: Number(performance.total_revenue || 0),
        total_quotes: Number(performance.total_quotes || 0),
        approval_rate: Number(performance.approval_rate || performance.conversion_rate || 0),
        avg_quote_amount: Number(performance.avg_quote_amount || 0),
        response_time_avg_hours: Number(performance.avg_response_time_days || 0) * 24,
        accepted_quotes: Number(performance.accepted_quotes || 0),
        pending_quotes: Number(performance.pending_quotes || 0),
        rejected_quotes: Number(performance.rejected_quotes || 0),
      };

      const formattedTrends = daily_trends
        .map((item) => ({
          date: item.date || item.day,
          name: item.date
            ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : item.day,
          revenue: Number(item.revenue || item.total_revenue || 0),
          quote_count: Number(item.quote_count || item.quotes || 0),
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setPerformanceData({
        metrics,
        daily_trend: formattedTrends,
        managers: managers,
        status_breakdown: {
          approved: metrics.accepted_quotes,
          pending: metrics.pending_quotes,
          rejected: metrics.rejected_quotes,
        },
        comparison: {
          vs_last_period: {
            revenue_growth: data.monthly_growth || data.growth || 0,
            approval_rate_change: data.approval_rate_change || 0,
            quote_growth: data.quote_growth || 0,
          },
        },
      });
    } catch (error) {
      console.error('❌ [Dealer Report] Failed to load report data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Load Failed',
        text: error.response?.data?.message || 'Could not fetch analytics data.',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, calculateParams]);

  useEffect(() => {
    const resolveIdAndFetch = async () => {
      let currentId = dealershipId;

      if (!currentId && user?.id) {
        try {
          const profile = await userService.getMyProfile();
          currentId = profile.dealership_id || profile.dealer_id || profile.dealership?.id;
          if (currentId) {
            setDealershipId(currentId);
            const updatedUser = { ...user, dealership_id: currentId };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Failed to resolve dealership ID from profile', err);
        }
      }

      if (currentId) {
        fetchReportData();
      } else {
        setIsLoading(false);
      }
    };

    resolveIdAndFetch();
  }, [user, dealershipId, fetchReportData]);

  const handleExport = async (format) => {
    try {
      const params = calculateParams(dateRange);

      if (format === 'csv') {
        await analyticsService.exportDealerCSV({
          ...params,
          type: 'quotes',
        });
      } else if (format === 'excel') {
        await analyticsService.exportDealerExcel({
          ...params,
          type: 'quotes',
        });
      } else {
        await analyticsService.exportAnalyticsData('performance', format, {
          dealership_id: dealershipId,
          ...params,
        });
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Export started',
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      Swal.fire('Export Failed', 'Could not start download.', 'error');
    }
  };

  const metrics = performanceData?.metrics || {};
  const dailyPerformance = performanceData?.daily_trend || performanceData?.daily_performance || [];
  const comparison = performanceData?.comparison?.vs_last_period || {};
  const statusBreakdown = performanceData?.status_breakdown || {};
  const visibleManagers = performanceData?.managers || [];

  const statusData = [
    {
      name: 'Approved',
      value: metrics.approved_quotes || statusBreakdown.approved || 0,
      color: '#10b981',
    },
    {
      name: 'Pending',
      value: metrics.pending_quotes || statusBreakdown.pending || 0,
      color: '#f59e0b',
    },
    {
      name: 'Rejected',
      value: metrics.rejected_quotes || statusBreakdown.rejected || 0,
      color: '#ef4444',
    },
  ].filter((item) => item.value > 0);

  const StatCardStyled = ({ title, value, subtext, trend, icon: Icon, color }) => (
    <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl bg-${color}-50 text-${color}-600`}>
          <Icon size={20} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-[rgb(var(--color-text))] mt-1">
          {isLoading ? <Skeleton width={100} /> : value}
        </h3>
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">{subtext}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Dealership Performance"
        subtitle={`Comprehensive analytics for ${user?.dealership?.name || 'your dealership'}`}
        actions={
          <>
            {/* Premium Period Selector (Segmented Capsule) */}
            <div className="flex items-center gap-1 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl p-1 shadow-sm">
              {[
                { label: '7D', value: '7days' },
                { label: '30D', value: '30days' },
                { label: '90D', value: '90days' },
                { label: 'All Time', value: 'all' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateRange(opt.value)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    dateRange === opt.value
                      ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                      : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-md">
                <Download size={18} />
                <span className="font-bold text-sm">Export</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-20">
                <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Dealership Data
                </div>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-blue-500" /> CSV Report
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-green-500" /> Excel Report
                </button>
              </div>
            </div>
          </>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardStyled
          title="Total Revenue"
          value={`$${Number(metrics.total_revenue || 0).toLocaleString()}`}
          subtext={
            dateRange === 'all'
              ? 'All time revenue'
              : `Revenue last ${dateRange.replace('days', ' days')}`
          }
          trend={comparison.revenue_growth}
          icon={TrendingUp}
          color="blue"
        />
        <StatCardStyled
          title="Avg Quote Amount"
          value={`$${Number(metrics.avg_quote_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext={
            dateRange === 'all'
              ? 'All time average'
              : `Avg. last ${dateRange.replace('days', ' days')}`
          }
          icon={DollarSign}
          color="indigo"
        />
        <StatCardStyled
          title="Approval Rate"
          value={`${Number(metrics.approval_rate || 0).toFixed(1)}%`}
          subtext={
            dateRange === 'all'
              ? 'All time rate'
              : `Rate last ${dateRange.replace('days', ' days')}`
          }
          trend={comparison.approval_rate_change}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCardStyled
          title="Total Quotes"
          value={(metrics.total_quotes || 0).toLocaleString()}
          subtext={dateRange === 'all' ? 'All time' : `Last ${dateRange.replace('days', ' days')}`}
          icon={FileText}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm min-h-[450px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <AreaIcon size={18} className="text-[rgb(var(--color-primary))]" />
              Performance Insights
            </h3>
          </div>
          <div className="h-[320px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]" />
              </div>
            ) : dailyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyPerformance}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgb(var(--color-border))"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgb(var(--color-text-muted))"
                    fontSize={10}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    stroke="rgb(var(--color-text-muted))"
                    fontSize={10}
                    tickFormatter={(val) => `$${val > 999 ? (val / 1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--color-surface))',
                      border: '1px solid rgb(var(--color-border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(var(--color-primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--color-text-muted))]">
                <AreaIcon size={48} className="opacity-10 mb-2" />
                <p className="text-sm font-bold">No data available for this period</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm flex flex-col min-h-[450px]">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-8">
            <PieIcon size={18} className="text-purple-500" />
            Status Distribution
          </h3>

          <div className="flex-1 flex flex-col justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : statusData.length > 0 ? (
              <>
                <div className="h-[240px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgb(var(--color-surface))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-[rgb(var(--color-text))]">
                      {metrics.total_quotes || 0}
                    </span>
                    <span className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-tighter">
                      Quotes Total
                    </span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-xs font-bold text-[rgb(var(--color-text))]">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-[rgb(var(--color-text))]">
                        {item.value}{' '}
                        <span className="text-[rgb(var(--color-text-muted))] font-medium">
                          (
                          {metrics.total_quotes
                            ? Math.round((item.value / metrics.total_quotes) * 100)
                            : 0}
                          %)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--color-text-muted))]">
                <PieIcon size={48} className="opacity-10 mb-2" />
                <p className="text-sm font-bold">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manager Performance Section */}
      <DataTable
        title="Staff Performance"
        data={visibleManagers}
        itemsPerPage={preferences.items_per_page || 10}
        columns={[
          {
            header: 'Manager',
            accessor: (row) => row.manager_name || 'Unknown',
            className: 'font-medium text-[rgb(var(--color-text))]',
            sortable: true,
            sortKey: 'manager_name',
          },
          {
            header: 'Email',
            accessor: (row) => row.email || 'N/A',
            className: 'text-[rgb(var(--color-text-muted))] text-xs',
          },
          {
            header: 'Quotes',
            accessor: (row) => row.quotes_created || 0,
            className: 'text-center font-medium',
            sortable: true,
            sortKey: 'quotes_created',
          },
          {
            header: 'Total Revenue',
            sortable: true,
            sortKey: 'revenue_generated',
            accessor: (row) =>
              `$${Number(row.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            className: 'font-bold text-[rgb(var(--color-text))]',
          },
          {
            header: 'Status',
            accessor: (row) => (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.quotes_created > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {row.quotes_created > 0 ? 'Active' : 'No Activity'}
              </span>
            ),
          },
        ]}
        searchPlaceholder="Search by staff name..."
        searchKey="manager_name"
        isLoading={isLoading}
      />

      {/* Achievements Section */}
      {performanceData?.achievements?.length > 0 && (
        <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-6">
            <ArrowUpRight size={18} className="text-amber-500" />
            Key Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.achievements.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]"
              >
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm">
                  <TrendingUp size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-[rgb(var(--color-text))]">{item.title}</h4>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-tight">
                    {formatDate(item.earned_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
