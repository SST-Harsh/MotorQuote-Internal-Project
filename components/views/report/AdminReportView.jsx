'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart as BarIcon,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  ChevronDown,
  FileText,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  Clock,
  Building2,
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
import dealershipService from '@/services/dealershipService';
import userService from '@/services/userService';
import StatCard from '@/components/common/StatCard';
import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

export default function AdminReportView() {
  const { preferences } = usePreference();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('all');

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalQuotes: 0,
    avgConversion: 0,
    avgResponseTime: 0,
    avgQuoteAmount: 0,
    monthlyGrowth: 0,
  });
  const [managerStats, setManagerStats] = useState([]);
  const [trendsData, setTrendsData] = useState([]);
  const [statusDist, setStatusDist] = useState({ Accepted: 0, Pending: 0, Rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [managedDealerships, setManagedDealerships] = useState([]);
  const [selectedDealershipId, setSelectedDealershipId] = useState(
    user?.dealership?.id || user?.dealership_id || ''
  );
  const [isLoadingDealers, setIsLoadingDealers] = useState(false);

  const calculateParams = React.useCallback((rangeValue) => {
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

  useEffect(() => {
    const loadManagedDealerships = async () => {
      if (!user) return;
      try {
        setIsLoadingDealers(true);
        const response = await dealershipService.getAllDealerships();
        const allDealers = Array.isArray(response)
          ? response
          : response?.data?.dealerships || response?.dealerships || [];

        const userId = String(user.id);
        const userDealerId = String(user.dealership?.id || user.dealership_id);

        // Filter: Strictly where user is Primary Admin
        const filtered = allDealers.filter((d) => String(d.primary_admin_id) === userId);

        // De-duplicate by ID to prevent double data fetches
        const uniqueDealers = Array.from(
          new Map(filtered.map((dealer) => [String(dealer.id), dealer])).values()
        );

        setManagedDealerships(uniqueDealers);

        if (
          filtered.length > 0 &&
          !filtered.find((d) => String(d.id) === String(selectedDealershipId))
        ) {
          setSelectedDealershipId(filtered[0].id);
        }
      } catch (error) {
        console.error('Failed to load managed dealerships:', error);
      } finally {
        setIsLoadingDealers(false);
      }
    };

    loadManagedDealerships();
  }, [user, selectedDealershipId]);

  const fetchReportData = React.useCallback(async () => {
    if (!user || managedDealerships.length === 0) return;

    try {
      setLoading(true);
      const params = calculateParams(dateRange);

      console.log('📅 [Admin] Fetching aggregate analytics with params:', params);

      // Fetch data for ALL managed dealerships with context
      const responses = await Promise.all(
        managedDealerships.map(async (dealer) => {
          try {
            const response = await analyticsService.getDealerPerformance(dealer.id, params);
            return {
              dealerName: dealer.name,
              data: response.data || response,
            };
          } catch (err) {
            console.error(`Failed to fetch for dealer ${dealer.id}:`, err);
            return null;
          }
        })
      );

      const allData = responses.filter((r) => r && r.data);

      if (allData.length > 0) {
        // Initialize aggregate metrics
        let totalRevenue = 0;
        let totalQuotes = 0;
        let sumApprovalRate = 0;
        let sumResponseTime = 0;
        let sumAvgQuoteAmount = 0;
        let sumGrowth = 0;
        let aggregateTrends = {}; // Use object for easy merging by date
        let allManagers = [];
        let aggregateStatus = { Accepted: 0, Pending: 0, Rejected: 0 };

        // Process each dealership's data
        for (const item of allData) {
          const data = item.data;
          const dealerName = item.dealerName;
          const metrics = data.metrics || data.performance || {};
          const quote_trend_raw = data.daily_trends || data.dailyTrends || data.quote_trend || [];
          const top_managers = data.top_managers || data.managers || [];

          // Aggregating Totals
          totalRevenue += Number(metrics.total_revenue || metrics.totalRevenue || 0) || 0;
          totalQuotes += Number(metrics.total_quotes || metrics.totalQuotes || 0) || 0;
          sumApprovalRate += Number(metrics.approval_rate || metrics.conversion_rate || 0) || 0;
          sumResponseTime +=
            Number(metrics.response_time_avg_hours || metrics.avg_response_time_days || 0) || 0;
          sumAvgQuoteAmount += Number(metrics.avg_quote_amount || 0) || 0;
          sumGrowth += Number(metrics.monthly_growth || metrics.growth || 0) || 0;

          // Aggregating Status Distribution
          aggregateStatus.Accepted +=
            Number(metrics.approved_quotes || metrics.accepted_quotes || 0) || 0;
          aggregateStatus.Pending += Number(metrics.pending_quotes || 0) || 0;
          aggregateStatus.Rejected += Number(metrics.rejected_quotes || 0) || 0;

          // Merging Trends
          quote_trend_raw.forEach((trendItem) => {
            const date = trendItem.date || trendItem.day;
            if (!aggregateTrends[date]) {
              aggregateTrends[date] = {
                revenue: 0,
                quote_count: 0,
                originalDate: date,
              };
            }
            aggregateTrends[date].revenue +=
              Number(trendItem.revenue || trendItem.total_revenue || 0) || 0;
            aggregateTrends[date].quote_count +=
              Number(trendItem.quote_count || trendItem.quotes || 0) || 0;
          });

          // Collecting Managers with dealership context
          const managersWithContext = top_managers.map((m) => ({
            ...m,
            dealership_name: data.dealership_name || data.name || dealerName,
          }));
          allManagers = [...allManagers, ...managersWithContext];
        }

        // Calculate Averages across dealerships
        const count = allData.length;
        setStats({
          totalRevenue,
          totalQuotes,
          avgConversion: sumApprovalRate / count,
          avgResponseTime: sumResponseTime / count,
          avgQuoteAmount: sumAvgQuoteAmount / count,
          monthlyGrowth: sumGrowth / count,
        });

        // Format Trends for chart
        const formattedTrends = Object.values(aggregateTrends)
          .map((item) => ({
            date: item.originalDate,
            name: item.originalDate
              ? new Date(item.originalDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Unknown',
            revenue: item.revenue,
            quote_count: item.quote_count,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setTrendsData(formattedTrends);
        setStatusDist(aggregateStatus);

        // Set combined manager stats (showing dealership name in row)
        setManagerStats(
          allManagers.map((m) => ({
            ...m,
            quotes_created: Number(m.quotes_created || 0) || 0,
            revenue_generated: Number(m.revenue_generated || 0) || 0,
            approval_rate: Number(m.approval_rate || 0) || 0,
            accepted_quotes: Number(m.accepted_quotes || 0) || 0,
          }))
        );
      }
    } catch (error) {
      console.error('❌ [Admin] Failed to load aggregate report data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Data Load Failed',
        text: error.response?.data?.message || 'Could not fetch analytics data.',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, calculateParams, managedDealerships]);

  useEffect(() => {
    if (user && selectedDealershipId) {
      fetchReportData();
    }
  }, [user, fetchReportData, dateRange, selectedDealershipId]);

  const handleExport = async (type, format) => {
    try {
      const params = calculateParams(dateRange);
      const dealershipId = user?.dealership?.id || user?.dealership;

      await analyticsService.exportAnalyticsData(type, format, {
        ...params,
        dealershipId,
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Export started',
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (error) {
      Swal.fire('Export Failed', 'Could not download report.', 'error');
    }
  };

  const statusData = [
    { name: 'Accepted', value: statusDist.Accepted, color: '#10b981' },
    { name: 'Pending', value: statusDist.Pending, color: '#f59e0b' },
    { name: 'Rejected', value: statusDist.Rejected, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Performance Analytics"
        subtitle={`Aggregate performance across ${managedDealerships.length} managed dealerships`}
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-20">
                <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Manager Performance
                </div>
                <button
                  onClick={() => handleExport('manager_performance', 'csv')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-blue-500" /> CSV Report
                </button>
                <button
                  onClick={() => handleExport('manager_performance', 'excel')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-green-500" /> Excel Report
                </button>

                <div className="p-2 border-b border-t border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                  Dealership Data
                </div>
                <button
                  onClick={() => handleExport('dealership_performance', 'excel')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <FileText size={14} className="text-green-500" /> Full Excel Report
                </button>
              </div>
            </div>
          </>
        }
        stats={[
          <StatCard
            key="revenue"
            title="Total Revenue"
            value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
            icon={<TrendingUp size={20} />}
            trend={
              stats.monthlyGrowth
                ? {
                    positive: stats.monthlyGrowth >= 0,
                    label: `${stats.monthlyGrowth}%`,
                  }
                : null
            }
            helperText="vs last month"
          />,
          <StatCard
            key="avg-quote"
            title="Avg Quote Amount"
            value={`$${(stats.avgQuoteAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={<DollarSign size={20} />}
            helperText="Dealership average"
          />,
          <StatCard
            key="conversion"
            title="Approval Rate"
            value={`${Number(stats.avgConversion).toFixed(1)}%`}
            icon={<ShieldCheck size={20} />}
            accent="#10b981"
            helperText="Quotes converted"
          />,
          <StatCard
            key="quotes"
            title="Total Quotes"
            value={stats.totalQuotes.toLocaleString()}
            icon={<FileText size={20} />}
            helperText="All time"
          />,
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Insights Composed Chart */}
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
            ) : trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendsData}
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
                    animationDuration={1500}
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
        <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-6 self-start">
            <PieIcon size={18} className="text-purple-500" />
            Quote Distribution
          </h3>

          <div className="h-[250px] w-full relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
              </div>
            ) : statusData.length > 0 ? (
              <>
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
                      }}
                      itemStyle={{ color: 'rgb(var(--color-text))' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold text-[rgb(var(--color-text))]">
                    {stats.totalQuotes}
                  </span>
                  <span className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
                    Total Quotes
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--color-text-muted))]">
                <PieIcon size={48} className="opacity-10 mb-2" />
                <p className="text-sm font-bold">No data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manager Performance Table */}
      <DataTable
        title="Dealer Manager Performance"
        data={managerStats}
        itemsPerPage={preferences.items_per_page || 10}
        columns={[
          {
            header: 'Dealership',
            accessor: (row) => row.dealership_name || 'N/A',
            className: 'font-medium text-[rgb(var(--color-text))]',
            sortable: true,
            sortKey: 'dealership_name',
          },
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
              `$${Number(row.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            className: 'font-bold text-[rgb(var(--color-text))]',
          },
          {
            header: 'Approval Rate',
            accessor: (row) => {
              const rate = row.approval_rate || 0;
              return (
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex-1 w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                    <div
                      className={`h-1.5 rounded-full ${Number(rate) >= 75 ? 'bg-emerald-500' : Number(rate) >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(rate) >= 75 ? 'bg-emerald-100 text-emerald-700' : Number(rate) >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {rate}%
                  </span>
                </div>
              );
            },
          },
          {
            header: 'Accepted',
            accessor: (row) => row.accepted_quotes || 0,
            className: 'text-center font-medium',
          },
        ]}
        searchKeys={['manager_name', 'manager_id']}
        emptyMessage="No Dealer Manager performance data found for the selected period."
      />
    </div>
  );
}
