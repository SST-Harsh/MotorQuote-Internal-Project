'use client';
import React from 'react';
import { TrendingUp, FileText, CheckCircle, DollarSign, Clock, User } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import { formatDate } from '@/utils/i18n';

export default function StaffPerformanceView({ staff, performanceData }) {
  // Calculate aggregate metrics
  const totalQuotesCreated =
    performanceData?.reduce((sum, p) => sum + (p.quotes_created || 0), 0) || 0;
  const avgApprovalRate =
    performanceData?.length > 0
      ? (
          performanceData.reduce((sum, p) => sum + (p.approval_rate || 0), 0) /
          performanceData.length
        ).toFixed(1)
      : 0;
  const totalRevenue =
    performanceData?.reduce((sum, p) => sum + (p.revenue_generated || 0), 0) || 0;
  const activeStaff = staff?.filter((s) => s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Quotes Created"
          value={totalQuotesCreated}
          icon={<FileText size={24} />}
          accent="#3b82f6"
          helperText="By all staff members"
        />
        <StatCard
          title="Average Approval Rate"
          value={`${avgApprovalRate}%`}
          icon={<CheckCircle size={24} />}
          accent="#10b981"
          helperText="Across all staff"
        />
        <StatCard
          title="Total Revenue Generated"
          value={`AED ${totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={24} />}
          accent="#a855f7"
          helperText="From approved quotes"
        />
        <StatCard
          title="Active Staff"
          value={activeStaff}
          icon={<User size={24} />}
          accent="#f59e0b"
          helperText="Currently active members"
        />
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white rounded-xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[rgb(var(--color-border))]">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
            <TrendingUp size={20} className="text-[rgb(var(--color-primary))]" />
            Individual Staff Performance
          </h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">
            Track quote creation, approval rates, and revenue by staff member
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))]">
              <tr>
                <th className="text-left text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Staff Member
                </th>
                <th className="text-center text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Status
                </th>
                <th className="text-right text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Quotes Created
                </th>
                <th className="text-right text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Approved
                </th>
                <th className="text-right text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Approval Rate
                </th>
                <th className="text-right text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Revenue
                </th>
                <th className="text-center text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide p-4">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody>
              {staff && staff.length > 0 ? (
                staff.map((member, idx) => {
                  const performance = performanceData?.find((p) => p.staff_id === member.id) || {};
                  const quotesCreated = performance.quotes_created || 0;
                  const approvedQuotes = performance.approved_quotes || 0;
                  const approvalRate = performance.approval_rate || 0;
                  const revenue = performance.revenue_generated || 0;

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                            {member.first_name?.charAt(0)}
                            {member.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[rgb(var(--color-text))] text-sm">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="text-xs text-[rgb(var(--color-text-muted))]">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : member.status === 'inactive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-semibold text-[rgb(var(--color-text))]">
                          {quotesCreated}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-semibold text-green-600">
                          {approvedQuotes}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                              style={{ width: `${Math.min(approvalRate, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm font-semibold text-[rgb(var(--color-text))] w-12 text-right">
                            {approvalRate}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-sm font-semibold text-purple-600">
                          AED {revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-[rgb(var(--color-text-muted))]">
                          <Clock size={12} />
                          {member.last_login ? formatDate(member.last_login) : 'Never'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[rgb(var(--color-text-muted))]">
                    <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No staff members found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[rgb(var(--color-border))] shadow-sm p-6">
          <h4 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" />
            Top Performers
          </h4>
          <div className="space-y-3">
            {performanceData && performanceData.length > 0 ? (
              [...performanceData]
                .sort((a, b) => (b.quotes_created || 0) - (a.quotes_created || 0))
                .slice(0, 3)
                .map((perf, idx) => {
                  const member = staff?.find((s) => s.id === perf.staff_id);
                  if (!member) return null;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 flex items-center justify-center text-xs font-bold text-green-700">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[rgb(var(--color-text))]">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-[rgb(var(--color-text-muted))]">
                            {perf.quotes_created || 0} quotes
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {perf.approval_rate || 0}%
                      </span>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-[rgb(var(--color-text-muted))] text-center py-4">
                No performance data available
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[rgb(var(--color-border))] shadow-sm p-6">
          <h4 className="text-sm font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            Recent Activity
          </h4>
          <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
            <Clock size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Activity tracking coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
