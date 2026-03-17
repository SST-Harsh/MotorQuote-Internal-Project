'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  PieChart as PieIcon,
  TrendingUp,
  Download,
  ChevronDown,
  FileText,
  AreaChart as AreaIcon,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  Legend,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import analyticsService from '@/services/analyticsService';
import StatCard from '@/components/common/StatCard';
import Skeleton from '@/components/common/Skeleton';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { usePreference } from '@/context/PreferenceContext';
import { canExportReports } from '@/utils/permissionUtils';

export default function DealerReportView() {
  const REPORT_DATE_RANGE_KEY = 'dealer_report_date_range';

  const { preferences } = usePreference();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const pathname = usePathname();
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [dateRange, setDateRange] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(REPORT_DATE_RANGE_KEY) || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(REPORT_DATE_RANGE_KEY, dateRange);
    sessionStorage.setItem('app_last_path', pathname);
  }, [dateRange, pathname]);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (highlightId) {
      setDateRange('all');
      setSearchTerm('');
    }
  }, [highlightId]);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const canExport = canExportReports(user);

  // API accepts: period, start_date, end_date (snake_case only)
  // Note: period overrides start_date/end_date per API docs
  const calculateParams = useCallback(
    (rangeValue) => {
      const dealershipId =
        user?.dealership_id || (user?.roleDetails && user?.roleDetails.dealership_id);
      const params = {
        period: rangeValue,
        ...(dealershipId && { dealership_id: dealershipId }),
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
    },
    [user]
  );

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = calculateParams(dateRange);

      // Single role-scoped endpoint – backend returns data for the
      // logged-in Dealer Manager's dealership automatically.
      const res = await analyticsService.getDealerPerformanceRoleBased(params);
      const raw = res?.data || res;

      const perf = raw?.performance || {};
      const dailyTrends = raw?.daily_trends || [];
      const managers = raw?.managers || [];

      const formattedTrends = dailyTrends
        .map((item) => ({
          date: item.date,
          revenue: Number(item.revenue || 0),
          quote_count: Number(item.quote_count || 0),
          accepted_count: Number(item.accepted_count || 0),
          name: item.date
            ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Unknown',
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setPerformanceData({
        metrics: {
          total_revenue: Number(perf.total_revenue || 0),
          total_quotes: Number(perf.total_quotes || 0),
          accepted_quotes: Number(perf.accepted_quotes || 0),
          pending_quotes: Number(perf.pending_quotes || 0),
          rejected_quotes: Number(perf.rejected_quotes || 0),
          avg_quote_amount: Number(perf.avg_quote_amount || 0),
          approval_rate: Number(perf.approval_rate || perf.conversion_rate || 0),
          response_time_avg_hours: Number(perf.avg_response_time_days || 0) * 24,
        },
        daily_trend: formattedTrends,
        managers,
        status_breakdown: {
          approved: Number(perf.accepted_quotes || 0),
          pending: Number(perf.pending_quotes || 0),
          rejected: Number(perf.rejected_quotes || 0),
        },
      });
    } catch (error) {
      console.error('❌ [Dealer Report] Failed to fetch performance data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Load Report',
        text: 'Could not load dealership performance data.',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, calculateParams]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isExportOpen) return;
    const handleClickOutside = () => setIsExportOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isExportOpen]);

  const handleExport = async (format) => {
    if (!canExport) {
      Swal.fire('Access Denied', "You don't have permission to export reports.", 'error');
      return;
    }
    try {
      const params = calculateParams(dateRange);
      if (format === 'csv') {
        await analyticsService.exportDealerCSV({ ...params, type: 'quotes' });
      } else if (format === 'excel') {
        await analyticsService.exportDealerExcel({ ...params, type: 'quotes' });
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
  const dailyPerformance = performanceData?.daily_trend || [];
  const statusBreakdown = performanceData?.status_breakdown || {};
  const visibleManagers = performanceData?.managers || [];

  const statusData = [
    {
      name: 'Accepted',
      value: metrics.accepted_quotes || statusBreakdown.approved || 0,
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

  const periodLabel =
    dateRange === 'all' ? 'All time' : `Last ${dateRange.replace('days', ' days')}`;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Dealership Performance"
        subtitle="Performance analytics for your dealership"
        actions={
          <>
            {/* Period Selector */}
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

            {/* Export */}
            <div className="relative">
              {canExport ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExportOpen(!isExportOpen);
                    }}
                    className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-md"
                  >
                    <Download size={18} />
                    <span className="font-bold text-sm hidden sm:inline">Export</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-xl overflow-hidden transition-all z-50 ${isExportOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                  >
                    <div className="p-2 border-b border-[rgb(var(--color-border))] text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase">
                      Export Report
                    </div>
                    <button
                      onClick={() => {
                        handleExport('csv');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                    >
                      <FileText size={14} className="text-blue-500" /> CSV Report
                    </button>
                    <button
                      onClick={() => {
                        handleExport('excel');
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                    >
                      <FileText size={14} className="text-green-500" /> Excel Report
                    </button>
                  </div>
                </>
              ) : (
                <button
                  disabled
                  title="You don't have permission to export reports."
                  className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg shadow-md opacity-50 cursor-not-allowed"
                >
                  <Download size={18} />
                  <span className="font-bold text-sm hidden sm:inline">Export</span>
                  <ChevronDown size={14} />
                </button>
              )}
            </div>
          </>
        }
        stats={[
          <StatCard
            key="revenue"
            title="Total Revenue"
            value={
              isLoading ? (
                <Skeleton width={100} />
              ) : (
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 2,
                }).format(Number(metrics.total_revenue || 0))
              )
            }
            icon={<TrendingUp size={20} />}
            helperText={periodLabel}
            accent="#3b82f6"
          />,
          <StatCard
            key="avg-quote"
            title="Avg Quote Amount"
            value={
              isLoading ? (
                <Skeleton width={100} />
              ) : (
                `$${Number(metrics.avg_quote_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              )
            }
            icon={<DollarSign size={20} />}
            helperText="Per quote average"
            accent="#6366f1"
          />,
          <StatCard
            key="approval"
            title="Approval Rate"
            value={
              isLoading ? (
                <Skeleton width={100} />
              ) : (
                `${Number(metrics.approval_rate || 0).toFixed(1)}%`
              )
            }
            icon={<ShieldCheck size={20} />}
            helperText="Quotes converted"
            accent="#10b981"
          />,
          <StatCard
            key="quotes"
            title="Total Quotes"
            value={
              isLoading ? <Skeleton width={100} /> : (metrics.total_quotes || 0).toLocaleString()
            }
            icon={<FileText size={20} />}
            helperText={periodLabel}
            accent="#f59e0b"
          />,
        ]}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Insights – ComposedChart (Area + Bar) */}
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <AreaIcon size={18} className="text-blue-500" />
              Performance Insights
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Revenue
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                  Quotes
                </span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]" />
              </div>
            ) : dailyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dailyPerformance}
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
                    formatter={(value, name) =>
                      name === 'Revenue' ? [`$${value.toLocaleString()}`, name] : [value, name]
                    }
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="quote_count"
                    name="Quotes"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
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

        {/* Status Distribution Pie */}
        <div className="bg-[rgb(var(--color-surface))] p-6 rounded-2xl border border-[rgb(var(--color-border))] shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-bold text-[rgb(var(--color-text))] flex items-center gap-2 mb-6">
            <PieIcon size={18} className="text-purple-500" />
            Quote Distribution
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : statusData.length > 0 ? (
              <>
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
                        }}
                        itemStyle={{ color: 'rgb(var(--color-text))' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-[rgb(var(--color-text))]">
                      {metrics.total_quotes || 0}
                    </span>
                    <span className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wide">
                      Total
                    </span>
                  </div>
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

      {/* Staff Performance Table */}
      <DataTable
        title="Staff Performance"
        data={visibleManagers}
        itemsPerPage={preferences.items_per_page || 10}
        persistenceKey="dealer-reports-staff"
        hideFilterDropdowns={true}
        columns={[
          {
            header: 'Name',
            accessor: (row) => row.manager_name || 'Unknown',
            className: 'font-medium text-[rgb(var(--color-text))]',
            sortable: true,
            sortKey: 'manager_name',
          },
          {
            header: 'Email',
            accessor: (row) => row.email || 'N/A',
            sortable: true,
            sortKey: 'email',
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
            header: 'Revenue',
            sortable: true,
            sortKey: 'revenue_generated',
            accessor: (row) =>
              `$${Number(row.revenue_generated || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            className: 'font-bold text-[rgb(var(--color-text))]',
          },
          {
            header: 'Approval Rate',
            accessor: (row) => `${Number(row.approval_rate || 0).toFixed(1)}%`,
            sortable: true,
            sortKey: 'approval_rate',
            className: 'text-center text-[rgb(var(--color-text-muted))]',
          },
          {
            header: 'Status',
            type: 'badge',
            config: {
              green: ['Active'],
              red: ['No Activity'],
            },
            accessor: (row) => (row.quotes_created > 0 ? 'Active' : 'No Activity'),
          },
        ]}
        searchPlaceholder="Search staff by name or email..."
        highlightId={highlightId}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchKeys={['manager_name', 'email']}
        isLoading={isLoading}
      />
    </div>
  );
}
