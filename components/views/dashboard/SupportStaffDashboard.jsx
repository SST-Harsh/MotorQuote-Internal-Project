'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle,
  Headset,
  Users,
  ChevronRight,
  Activity,
  Bell,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
  Eye,
  ArrowRight,
  CheckSquare,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';
import quoteService from '@/services/quoteService';
import StatCard from '@/components/common/StatCard';
import ActivityTimeline from '@/components/common/ActivityTimeline';
import Skeleton from '@/components/common/Skeleton';
import { formatDate, formatCompactNumber } from '@/utils/i18n';

export default function SupportStaffDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = usePreference();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    approvalRate: 0,
    openTickets: '—',
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  const userDealershipId = user?.dealership_id || user?.dealership?.id;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch quotes (non-dealer endpoint for safety, filtered client-side)
      const quotesRes = await quoteService.getQuotes({ _useDealerEndpoint: false });
      const allQuotes = Array.isArray(quotesRes)
        ? quotesRes
        : quotesRes?.quotes || quotesRes?.data?.quotes || quotesRes?.data || [];

      // 1. Filter by dealership
      const dealershipQuotes = userDealershipId
        ? allQuotes.filter((q) => {
            const qDealershipId = q.dealership_id ?? q.dealershipId ?? q.dealership?.id;
            return String(qDealershipId) === String(userDealershipId);
          })
        : allQuotes;

      // 2. Calculate Stats
      const successStatuses = ['approved', 'sold', 'converted'];
      const pending = dealershipQuotes.filter(
        (q) => (q.status || '').toLowerCase() === 'pending'
      ).length;
      const approvedCount = dealershipQuotes.filter((q) =>
        successStatuses.includes((q.status || '').toLowerCase())
      ).length;
      const rate =
        dealershipQuotes.length > 0
          ? ((approvedCount / dealershipQuotes.length) * 100).toFixed(1)
          : 0;

      setStats({
        totalQuotes: dealershipQuotes.length,
        pendingQuotes: pending,
        approvalRate: rate,
        openTickets: 3, // Mocked for UI demonstration as in original
      });

      // 3. Map Quotes to Activity format for ActivityTimeline
      const activities = dealershipQuotes
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
        .map((q) => {
          const customer = q.customer_name || q.clientName || 'Unknown';
          const vi = q.vehicle_info || q.vehicle_details || {};
          const vehicle = `${vi.make || ''} ${vi.model || ''}`.trim() || 'Vehicle';

          return {
            id: q.id,
            user_name: customer,
            user_role: 'Customer',
            action: 'New Quote',
            description: `Request for ${vehicle}`,
            created_at: q.created_at || q.updated_at,
            timestamp: q.created_at || q.updated_at,
            new_status: (q.status || 'pending').toLowerCase(),
          };
        });

      setRecentActivity(activities);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user, userDealershipId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ActionCard = ({ title, desc, icon: Icon, onClick, colorClass, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center justify-between p-4 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-all duration-300 w-full text-left 
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}`}
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
          <h4 className="font-bold text-[rgb(var(--color-text))] text-[13px]">{title}</h4>
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
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header / Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-[rgb(var(--color-border))]">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-[rgb(var(--color-text))] tracking-tight">
            Welcome back,{' '}
            <span className="text-[rgb(var(--color-primary))] capitalize">
              {user?.first_name || 'Support'}
            </span>
          </h2>
          <p className="text-[rgb(var(--color-text-muted))] text-sm font-medium flex items-center gap-2">
            <Calendar size={14} className="text-[rgb(var(--color-primary))]" />
            <span>{formatDate(new Date())}</span>
            <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))] mx-1"></span>
            <span className="opacity-80">Support Staff Portal — View-Only Access</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Quotes"
          value={isLoading ? <Skeleton width={60} /> : formatCompactNumber(stats.totalQuotes)}
          helperText="Dealership assigned"
          icon={<FileText size={20} />}
          accent="#3b82f6"
          loading={isLoading}
        />
        <StatCard
          title="Pending Quotes"
          value={isLoading ? <Skeleton width={60} /> : formatCompactNumber(stats.pendingQuotes)}
          helperText="Awaiting action"
          accent="#f59e0b"
          icon={<Clock size={20} />}
          loading={isLoading}
        />
        <StatCard
          title="Approval Rate"
          value={isLoading ? <Skeleton width={60} /> : `${stats.approvalRate}%`}
          helperText="Last 30 days"
          icon={<TrendingUp size={20} />}
          accent="#10b981"
          loading={isLoading}
        />
        <StatCard
          title="Open Tickets"
          value={isLoading ? <Skeleton width={60} /> : stats.openTickets}
          helperText="Support queue"
          icon={<Headset size={20} />}
          accent="#8b5cf6"
          loading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-[rgb(var(--color-border))] flex justify-between items-center bg-[rgb(var(--color-background))/0.02]">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide flex items-center gap-2">
                <Activity size={16} className="text-[rgb(var(--color-primary))]" />
                Recent Activity
              </h3>
              <button
                onClick={() => router.push('/quotes')}
                className="text-xs font-semibold text-[rgb(var(--color-primary))] hover:underline transition-colors"
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
                <ActivityTimeline activities={recentActivity} />
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Actions & Notifications */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-[rgb(var(--color-surface))] p-5 rounded-2xl border border-[rgb(var(--color-border))]">
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wide mb-4 flex items-center gap-2">
              <CheckSquare size={16} className="text-[rgb(var(--color-primary))]" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <ActionCard
                title="Support Tickets"
                desc="View and respond to customer tickets"
                icon={Headset}
                colorClass="from-blue-500 to-indigo-600"
                onClick={() => router.push('/support')}
              />
              <ActionCard
                title="Browse Quotes"
                desc="View all submitted quotation requests"
                icon={FileText}
                colorClass="from-emerald-500 to-teal-600"
                onClick={() => router.push('/quotes')}
              />
              <ActionCard
                title="User Lookup"
                desc="Search and view account details"
                icon={Users}
                colorClass="from-violet-500 to-purple-600"
                onClick={() => router.push('/users')}
              />
            </div>

            {/* View-Only Alert */}
            <div className="bg-[rgb(var(--color-primary))]/5 border border-[rgb(var(--color-primary))]/20 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={16}
                  className="text-[rgb(var(--color-primary))] mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-xs font-semibold text-[rgb(var(--color-primary))]">
                    View-Only Access
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 leading-relaxed">
                    Changes require admin approval. You can currently track activity and view
                    details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Placeholder - Styled like Dealer Dashboard */}
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.02] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
                <Bell size={16} className="text-[rgb(var(--color-text))]" />
                System Notifications
              </h3>
            </div>
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3 shadow-inner">
                <Bell size={20} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
                No new notifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
