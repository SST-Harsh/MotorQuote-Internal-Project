'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  Ban,
  TrendingUp,
  Users as UsersIcon,
  Fingerprint,
  FileText,
  Calendar,
  User,
  Clock,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useDealership } from '@/hooks/useDealerships';
import { useStaffList } from '@/hooks/useStaff';
import { SkeletonTable } from '@/components/common/Skeleton';
import { formatDate } from '@/utils/i18n';

export default function DealerDealershipDetail({ id }) {
  const router = useRouter();

  const { data: dealership, isLoading: dealershipLoading, error } = useDealership(id);
  const { data: staffData = [], isLoading: staffLoading } = useStaffList();

  // Filter staff to those belonging to this dealership
  const myStaff = useMemo(() => {
    const all = Array.isArray(staffData) ? staffData : [];
    return all.filter((s) => {
      const sDealer = s.dealership?.id || s.dealership_id || s.dealership;
      return String(sDealer) === String(id);
    });
  }, [staffData, id]);

  // ─── Loading ────────────────────────────────────────────────────────────
  if (dealershipLoading || staffLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-32 bg-[rgb(var(--color-background))] rounded animate-pulse" />
        <div className="bg-[rgb(var(--color-surface))] rounded-3xl border border-[rgb(var(--color-border))] p-10">
          <div className="flex gap-8">
            <div className="w-32 h-32 bg-[rgb(var(--color-background))] rounded-3xl animate-pulse flex-shrink-0" />
            <div className="space-y-4 flex-1">
              <div className="h-10 w-64 bg-[rgb(var(--color-background))] rounded animate-pulse" />
              <div className="h-4 w-48 bg-[rgb(var(--color-background))] rounded animate-pulse" />
            </div>
          </div>
        </div>
        <SkeletonTable rows={3} />
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error || !dealership) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban size={32} />
          </div>
          <h2 className="text-xl font-bold text-[rgb(var(--color-text))] mb-2">
            Dealership Not Found
          </h2>
          <p className="text-[rgb(var(--color-text-muted))] mb-6">
            The dealership you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl font-bold transition-all hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Derived values ───────────────────────────────────────────────────────
  const dealershipName = dealership.name || dealership.dealership_name || 'Unknown Dealership';
  const initial = dealershipName[0] || 'D';

  const isActive =
    dealership.status === 'Active' ||
    dealership.status === 1 ||
    dealership.status === true ||
    dealership.is_active === true;
  const statusText = isActive ? 'Active' : 'Inactive';
  const statusColor = isActive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-600 border-red-200';
  const StatusIcon = isActive ? CheckCircle : Ban;

  const dateValue = dealership.created_at || dealership.createdAt || dealership.joinedDate;
  const createdDate =
    dateValue && !isNaN(new Date(dateValue).getTime()) ? formatDate(dateValue) : 'N/A';

  const performanceData = dealership.performance?.performance || dealership.performance || {};

  const totalQuotes = performanceData.total_quotes || dealership.total_quotes || 0;
  const totalRevenue = parseFloat(performanceData.total_revenue || dealership.total_revenue || 0);
  const avgQuoteAmount = parseFloat(
    performanceData.avg_quote_amount || dealership.avg_quote_amount || 0
  );
  const acceptedQuotes = performanceData.accepted_quotes || dealership.accepted_quotes || 0;
  const pendingQuotes = performanceData.pending_quotes || dealership.pending_quotes || 0;
  const rejectedQuotes = performanceData.rejected_quotes || dealership.rejected_quotes || 0;
  const conversionRate =
    performanceData.conversion_rate || dealership.conversion_rate || dealership.approval_rate || 0;
  const avgResponseTime =
    performanceData.avg_response_time_days || dealership.avg_response_time_days || 0;

  const quotes = totalQuotes;
  const conversion = conversionRate;
  const revenue = totalRevenue;

  const location =
    dealership.location || [dealership.city, dealership.state].filter(Boolean).join(', ') || '—';

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Dealerships</span>
      </button>

      {/* ── Header Card ─────────────────────────────────────────────── */}
      <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[rgb(var(--color-primary))]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
          {/* Logo / Initial */}
          <div className="flex-shrink-0 relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-[rgb(var(--color-background))] relative ring-1 ring-[rgb(var(--color-border))] flex items-center justify-center">
              {dealership.logo_url ? (
                <Image
                  src={dealership.logo_url}
                  alt={dealershipName}
                  fill
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 112px, 144px"
                />
              ) : (
                <span className="text-5xl font-bold text-[rgb(var(--color-primary))]/30 select-none group-hover:text-[rgb(var(--color-primary))]/60 transition-colors">
                  {initial}
                </span>
              )}
            </div>
            {/* Status dot */}
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${isActive ? 'bg-emerald-500' : 'bg-gray-300'} shadow-sm`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-5 min-w-0">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-text))] tracking-tight truncate">
                  {dealershipName}
                </h1>
                <span
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}
                >
                  <StatusIcon size={12} /> {statusText}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[rgb(var(--color-text-muted))] text-xs font-semibold uppercase tracking-widest opacity-80">
                {dealership.code && (
                  <span className="px-2.5 py-1 bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] rounded-lg border border-[rgb(var(--color-primary))]/20 font-mono text-[10px]">
                    {dealership.code}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[rgb(var(--color-primary))]/60" />
                  {location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-orange-400" />
                  Since {createdDate}
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              {[
                {
                  label: 'Email',
                  value: dealership.contact_email || '—',
                  icon: Mail,
                  color: 'bg-blue-50 text-blue-500',
                },
                {
                  label: 'Phone',
                  value: dealership.contact_phone || '—',
                  icon: Phone,
                  color: 'bg-emerald-50 text-emerald-500',
                },
                {
                  label: 'Staff',
                  value: `${myStaff.length} Members`,
                  icon: UsersIcon,
                  color: 'bg-purple-50 text-purple-500',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] shadow-xs hover:shadow-md transition-shadow"
                >
                  <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2 opacity-60">
                    {label}
                  </span>
                  <div className="flex items-center gap-3 text-sm font-bold text-[rgb(var(--color-text))]">
                    <div
                      className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="truncate">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Contact + Staff ───────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Contact & Location */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex items-center gap-2">
              <Building2 size={16} className="text-[rgb(var(--color-primary))]" />
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-widest">
                Contact &amp; Location
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: 'Business Email',
                  value: dealership.contact_email || '—',
                  icon: Mail,
                  color: 'text-blue-500 bg-blue-50',
                },
                {
                  label: 'Phone',
                  value: dealership.contact_phone || '—',
                  icon: Phone,
                  color: 'text-emerald-500 bg-emerald-50',
                },
                {
                  label: 'Website',
                  value: dealership.website
                    ? dealership.website.replace(/^https?:\/\//, '').split('/')[0]
                    : '—',
                  icon: Globe,
                  color: 'text-orange-500 bg-orange-50',
                  href: dealership.website,
                },
                {
                  label: 'Full Address',
                  value:
                    [
                      dealership.address,
                      dealership.city,
                      dealership.state,
                      dealership.zip_code,
                      dealership.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—',
                  icon: MapPin,
                  color: 'text-red-500 bg-red-50',
                },
              ].map(({ label, value, icon: Icon, color, href }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]/20 transition-all"
                >
                  <span className="text-[10px] font-semibold text-[rgb(var(--color-text-muted))]/70 uppercase tracking-wide block mb-2">
                    {label}
                  </span>
                  <div className="flex items-start gap-3 text-sm font-bold text-[rgb(var(--color-text))]">
                    <div
                      className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={15} />
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[rgb(var(--color-primary))] hover:underline transition-colors break-words"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="break-words">{value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Staff */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon size={16} className="text-purple-500" />
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-widest">
                  My Staff
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase bg-[rgb(var(--color-surface))] px-2.5 py-1 rounded-lg border border-[rgb(var(--color-border))]">
                {myStaff.length} {myStaff.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <div className="p-6">
              {myStaff.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {myStaff.map((s, i) => {
                    const name =
                      `${s.first_name || ''} ${s.last_name || ''}`.trim() ||
                      s.email ||
                      'Staff Member';
                    const staffInitial = name[0]?.toUpperCase() || 'S';
                    const rawRole = s.role?.name || s.role || 'Staff';
                    const formattedRole = rawRole
                      .split(/[_\s]+/)
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                      .join(' ');
                    const sIsActive = s.is_active === true || s.status === 'Active';

                    return (
                      <div
                        key={i}
                        className="bg-[rgb(var(--color-background))] rounded-2xl border border-[rgb(var(--color-border))] p-5 shadow-xs hover:shadow-md hover:border-[rgb(var(--color-primary))]/20 transition-all group flex flex-col items-center text-center"
                      >
                        {/* Avatar */}
                        <div className="relative mb-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[rgb(var(--color-background))] to-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] flex items-center justify-center overflow-hidden relative shadow-inner ring-4 ring-[rgb(var(--color-background))]/50 group-hover:ring-[rgb(var(--color-primary))]/10 transition-all">
                            {s.profile_picture ? (
                              <Image
                                src={s.profile_picture}
                                alt={name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform"
                                sizes="56px"
                              />
                            ) : (
                              <span className="text-lg font-bold text-[rgb(var(--color-primary))]/30 uppercase">
                                {staffInitial}
                              </span>
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[rgb(var(--color-surface))] ${sIsActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                          />
                        </div>

                        <h4 className="text-xs font-bold text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors mb-1 truncate w-full">
                          {name}
                        </h4>
                        <span className="inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border-purple-100 mb-3">
                          {formattedRole}
                        </span>

                        <div className="w-full pt-3 border-t border-[rgb(var(--color-border))]/50 flex items-center justify-center gap-2">
                          <Mail size={11} className="text-[rgb(var(--color-text-muted))]/40" />
                          <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))]/60 truncate max-w-full">
                            {s.email}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-14 bg-[rgb(var(--color-background))]/30 rounded-2xl border border-dashed border-[rgb(var(--color-border))] flex flex-col items-center justify-center text-center">
                  <UsersIcon size={32} className="text-[rgb(var(--color-text-muted))]/20 mb-3" />
                  <h4 className="text-sm font-black text-[rgb(var(--color-text-muted))] uppercase tracking-widest opacity-40">
                    No Staff Assigned
                  </h4>
                  <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))]/30 uppercase tracking-widest mt-1">
                    No staff members found for this dealership
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Performance ─────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Performance Card */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-widest">
                Performance
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Total Quotes */}
              <div className="p-3 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-semibold text-[rgb(var(--color-text-muted))]/70 uppercase tracking-wider block mb-0.5">
                      Total Quotes
                    </span>
                    <div className="text-xl font-black text-[rgb(var(--color-text))] tabular-nums">
                      {totalQuotes.toLocaleString()}
                    </div>
                  </div>
                  <FileText size={20} className="text-blue-400/30" />
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="p-3 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-semibold text-[rgb(var(--color-text-muted))]/70 uppercase tracking-wider block mb-0.5">
                      Conversion Rate
                    </span>
                    <div className="text-xl font-black text-[rgb(var(--color-text))] tabular-nums">
                      {conversionRate}%
                    </div>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${parseFloat(conversionRate) >= 20 ? 'bg-emerald-50 text-emerald-600' : parseFloat(conversionRate) >= 10 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}
                  >
                    {parseFloat(conversionRate) >= 20
                      ? 'Optimal'
                      : parseFloat(conversionRate) >= 10
                        ? 'Good'
                        : 'Low'}
                  </div>
                </div>
              </div>

              {/* Gross Revenue */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100">
                <span className="text-[9px] font-semibold text-emerald-600/70 uppercase tracking-wider block mb-0.5">
                  Gross Revenue
                </span>
                <div className="text-xl font-black text-emerald-700 tabular-nums">
                  $
                  {totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                  <div className="text-base font-black text-emerald-600 tabular-nums">
                    {acceptedQuotes}
                  </div>
                  <div className="text-[7px] font-semibold text-emerald-500/70 uppercase tracking-wider">
                    Accepted
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
                  <div className="text-base font-black text-yellow-600 tabular-nums">
                    {pendingQuotes}
                  </div>
                  <div className="text-[7px] font-semibold text-yellow-500/70 uppercase tracking-wider">
                    Pending
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-center">
                  <div className="text-base font-black text-red-500 tabular-nums">
                    {rejectedQuotes}
                  </div>
                  <div className="text-[7px] font-semibold text-red-400/70 uppercase tracking-wider">
                    Rejected
                  </div>
                </div>
              </div>

              {/* Avg Quote & Response */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                  <span className="text-[8px] font-semibold text-[rgb(var(--color-text-muted))]/70 uppercase tracking-wider block mb-0.5">
                    Avg Quote
                  </span>
                  <div className="text-sm font-black text-[rgb(var(--color-primary))] tabular-nums">
                    $
                    {avgQuoteAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                  <span className="text-[8px] font-semibold text-[rgb(var(--color-text-muted))]/70 uppercase tracking-wider block mb-0.5">
                    Avg Response
                  </span>
                  <div className="text-sm font-black text-[rgb(var(--color-text))] tabular-nums">
                    {parseFloat(avgResponseTime).toFixed(1)} days
                  </div>
                </div>
              </div>

              {/* Staff */}
              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-purple-500" />
                    <span className="text-[8px] font-semibold text-purple-600/70 uppercase tracking-wider">
                      Staff Members
                    </span>
                  </div>
                  <span className="text-sm font-black text-purple-600 tabular-nums">
                    {myStaff.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-blue-500/5 border border-[rgb(var(--color-primary))]/10 shadow-xs">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-[rgb(var(--color-primary))] shrink-0 shadow-sm">
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[rgb(var(--color-text))] uppercase tracking-widest mb-1">
                  Your Dealership
                </h4>
                <p className="text-[11px] text-[rgb(var(--color-text-muted))] font-medium leading-relaxed">
                  This is a read-only view of your dealership. Contact your administrator to make
                  changes to dealership details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
