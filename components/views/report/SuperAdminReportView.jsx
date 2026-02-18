'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart as BarIcon,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  ChevronDown,
  FileText,
  DollarSign,
  ShieldCheck,
  AreaChart as AreaIcon,
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
  ComposedChart,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import analyticsService from '@/services/analyticsService';
import StatCard from '@/components/common/StatCard';
import DataTable from '../../common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

export default function SuperAdminReportsView() {
  const { preferences } = usePreference();
  const { user } = useAuth();
  const [platformData, setPlatformData] = useState(null);
  const [dateRange, setDateRange] = useState('all');

  const calculateParams = React.useCallback((rangeValue) => {
    const params = {
      period: rangeValue,
    };

    if (rangeValue !== 'all') {
      const end = new Date();
      const start = new Date();
      // Map values to numbers for calculation if needed
      const daysMap = { '7days': 7, '30days': 30, '90days': 90 };
      const days = daysMap[rangeValue] || 30;

      start.setDate(end.getDate() - days);

      // Use YYYY-MM-DD local format
      const toDateStr = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      params.start_date = toDateStr(start);
      params.end_date = toDateStr(end);
    }

    return params;
  }, []);

  const [loading, setLoading] = useState(true);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = calculateParams(dateRange);
      console.log('📅 Fetching analytics with params:', params);

      const platformRes = await analyticsService.getPlatformAnalytics(params);

      console.log('✅ Platform data received:', platformRes);

      if (platformRes) {
        setPlatformData(platformRes);
      }
    } catch (error) {
      console.error('❌ Failed to load analytics:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Load Failed',
        text:
          error.response?.data?.message ||
          'Could not fetch analytics data. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, calculateParams]);

  useEffect(() => {
    console.log('🔄 Analytics Fetch Trigger:', { dateRange });
    fetchAnalytics();
  }, [fetchAnalytics, dateRange]);

  const handleExport = async (type, format) => {
    try {
      const params = calculateParams(dateRange);
      await analyticsService.exportAnalyticsData(type, format, params);
      Swal.fire({
        icon: 'success',
        title: 'Export Started',
        text: 'Your download should begin shortly.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Export Error:', error);
      Swal.fire('Export Failed', error.message || 'Please verify backend availability.', 'error');
    }
  };

  // Standardize data access from the API response
  const platform = platformData?.data || platformData || {};
  const overview = platform.overview || {};
  // Use platform data for summary (monthly_growth is expected to be in the platform response)
  const summary = platform || {};

  // Extract monthly trends and format for chart
  const monthlyTrends = platform.monthly_trends || [];
  const revenueTrend = monthlyTrends
    .map((item) => ({
      month: item.month,
      date: item.month, // Keep original for dataKey
      name: new Date(item.month + '-01').toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      revenue: Number(item.revenue || 0),
      quote_count: item.quote_count || 0,
      accepted_count: item.accepted_count || 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Build status data from overview for pie chart
  const statusData = [
    {
      name: 'Pending',
      value: Number(overview.pending_quotes || 0),
      color: '#3b82f6',
    },
    {
      name: 'Rejected',
      value: Number(overview.rejected_quotes || 0),
      color: '#ef4444',
    },
    {
      name: 'Expired',
      value: Number(overview.expired_quotes || 0),
      color: '#f59e0b',
    },
    {
      name: 'Accepted',
      value: Number(overview.accepted_quotes || 0),
      color: '#10b981',
    },
  ].filter((item) => item.value > 0); // Only show non-zero values

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Platform-wide performance metrics"
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

            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-md">
                <Download size={18} />
                <span className="font-bold text-sm hidden sm:inline">Export</span>
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-20">
                <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Quotes Data
                </div>
                <button
                  onClick={() => handleExport('quotes', 'csv')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-blue-500" /> Export Quotes (CSV)
                </button>

                <div className="p-2 border-b border-t border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Performance Reports
                </div>
                <button
                  onClick={() => handleExport('dealership_performance', 'excel')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-green-500" /> Dealerships (Excel)
                </button>
                <button
                  onClick={() => handleExport('dealership_performance', 'csv')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-blue-500" /> Dealerships (CSV)
                </button>
              </div>
            </div>
          </>
        }
        stats={[
          <StatCard
            key="total-revenue"
            title="Total Revenue"
            value={`$${Number(overview.total_revenue || 0).toLocaleString()}`}
            icon={<TrendingUp size={20} />}
            trend={
              summary.monthly_growth
                ? {
                    positive: Number(summary.monthly_growth) >= 0,
                    label: `${summary.monthly_growth}%`,
                  }
                : null
            }
            helperText="vs last month"
          />,
          <StatCard
            key="avg-quote"
            title="Avg Quote Amount"
            value={`$${Number(overview.avg_quote_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<DollarSign size={20} />}
            helperText="Platform average"
          />,
          <StatCard
            key="approval-rate"
            title="Approval Rate"
            value={`${Number(overview.approval_rate || 0).toFixed(1)}%`}
            icon={<ShieldCheck size={20} />}
            accent="#10b981"
            helperText="Quotes converted"
          />,
          <StatCard
            key="total-quotes"
            title="Total Quotes"
            value={(overview.total_quotes || 0).toLocaleString()}
            icon={<FileText size={20} />}
            helperText="All time"
          />,
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends Line Chart */}
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <AreaIcon size={18} className="text-blue-500" />
              Performance Insights
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Revenue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Quotes
                </span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
              </div>
            ) : revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={revenueTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgb(var(--color-border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="rgb(var(--color-text-muted))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    stroke="rgb(var(--color-text-muted))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="rgb(var(--color-text-muted))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--color-surface))',
                      borderColor: 'rgb(var(--color-border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ fill: 'rgb(var(--color-background))', opacity: 0.4 }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="quote_count"
                    name="Quotes"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--color-text-muted))]">
                <TrendingUp size={48} className="opacity-10 mb-2" />
                <p className="text-sm font-bold">No data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm min-h-[400px] flex flex-col items-center justify-center">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-6 self-start">
            <PieIcon size={18} className="text-purple-500" />
            Quote Distribution
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-border))',
                    borderRadius: '8px',
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  itemStyle={{ color: 'rgb(var(--color-text))' }}
                  wrapperStyle={{ zIndex: 1000 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-bold text-[rgb(var(--color-text))]">
                {statusData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
              </span>
              <span className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
                Total Quotes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Dealerships Table */}
      <DataTable
        title="Top Performing Dealerships"
        data={platform.top_dealerships || []}
        itemsPerPage={preferences.items_per_page || 10}
        columns={[
          {
            header: 'Dealership',
            accessor: (row) => row.dealership_name || row.name,
            className: 'font-medium text-[rgb(var(--color-text))]',
          },
          {
            header: 'Total Revenue',
            accessor: (row) => `$${Number(row.total_revenue || 0).toLocaleString()}`,
            className: 'font-medium text-[rgb(var(--color-text))]',
          },
          {
            header: 'Avg Quote',
            accessor: (row) =>
              `$${Number(row.avg_quote_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            className: 'text-center font-medium',
          },
          {
            header: 'Quotes',
            accessor: (row) => row.quote_count || row.quotes || 0,
            className: 'text-[rgb(var(--color-text-muted))] text-center',
          },
          {
            header: 'Approval Rate',
            accessor: (row) => {
              const rate =
                row.approval_rate !== undefined ? row.approval_rate : row.conversion_rate;
              return (
                <div className="flex items-center gap-2">
                  <div className="flex-1 w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                    <div
                      className={`h-1.5 rounded-full ${Number(rate) >= 75 ? 'bg-emerald-500' : Number(rate) >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${rate || 0}%` }}
                    ></div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(rate) >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {rate || 0}%
                  </span>
                </div>
              );
            },
          },
        ]}
        searchKeys={['dealership_name', 'name']}
      />
    </div>
  );
}
