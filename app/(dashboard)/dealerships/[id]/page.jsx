'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { normalizeRole } from '@/utils/roleCommon';

const DealerDealershipDetail = dynamic(
  () => import('@/components/views/dealerships/DealerDealershipDetail'),
  { ssr: false }
);
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDealership } from '@/hooks/useDealerships';
import { useUsers } from '@/hooks/useUsers';
import auditService from '@/services/auditService';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  CheckCircle,
  Ban,
  TrendingUp,
  Users as UsersIcon,
  Globe,
  Fingerprint,
  FileText,
  Clock,
  History,
  Tag,
  FileEdit,
  Plus,
  Shield,
  Eye,
  ChevronLeft,
  DollarSign,
  Target,
  Activity,
} from 'lucide-react';
import tagService from '@/services/tagService';
import TagList from '@/components/common/tags/TagList';

export default function DealershipDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const isDealerManager = user && normalizeRole(user.role) === 'dealer_manager';

  // All hooks must be called unconditionally before any early return
  const { data: dealership, isLoading: dealershipLoading, error } = useDealership(id);
  const { data: usersData = [], isLoading: usersLoading } = useUsers(
    {},
    { enabled: !isDealerManager }
  );
  const [dealerTags, setDealerTags] = useState([]);

  useEffect(() => {
    if (id) {
      tagService
        .getEntityTags('dealership', id)
        .then((tags) => setDealerTags(tags || []))
        .catch((err) => console.error('Failed to fetch dealership tags:', err));
    }
  }, [id]);

  // Dealer Managers see their own dedicated read-only view (after hooks)
  if (isDealerManager) {
    return <DealerDealershipDetail id={id} />;
  }

  if (dealershipLoading || usersLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-32 bg-background rounded animate-pulse"></div>
        <div className="bg-surface rounded-3xl shadow-sm border border-border p-10">
          <div className="flex gap-8">
            <div className="w-32 h-32 bg-background rounded-3xl animate-pulse"></div>
            <div className="space-y-4 flex-1">
              <div className="h-10 w-64 bg-background rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-background rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dealership) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban size={32} />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Dealership Not Found</h2>
          <p className="text-text-muted mb-6">
            The dealership you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-primary text-surface rounded-xl font-bold transition-all hover:scale-105"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const dealershipName = dealership.name || dealership.dealership_name || 'Unknown Dealership';
  const initial = dealershipName[0] || 'D';

  const isActive =
    dealership.status === 'Active' ||
    dealership.status === 1 ||
    dealership.status === true ||
    dealership.is_active === true;
  const statusText = isActive ? 'Active' : 'Inactive';
  const statusColor = isActive
    ? 'bg-success/10 text-success border-success/20'
    : 'bg-error/10 text-error border-error/20';
  const StatusIcon = isActive ? CheckCircle : Ban;

  const dateValue = dealership.created_at || dealership.createdAt || dealership.joinedDate;
  const createdDate =
    dateValue && !isNaN(new Date(dateValue).getTime())
      ? new Date(dateValue).toLocaleDateString()
      : 'N/A';

  const allUsers = Array.isArray(usersData)
    ? usersData
    : usersData.users || usersData.data?.users || usersData.data || [];

  // Build staff map for name resolution
  const staffMap = allUsers.reduce((acc, u) => {
    acc[u.id] = u;
    acc[u.email] = u;
    if (u.username) acc[u.username] = u;
    if (u.user_name) acc[u.user_name] = u;
    return acc;
  }, {});

  const dealershipUsers = allUsers.filter((u) => {
    const userDealershipId = u.dealership?.id || u.dealership_id || u.dealership;
    return String(userDealershipId) === String(id);
  });

  const performanceData = dealership.performance?.performance || dealership.performance || {};
  const dailyTrends = dealership.performance?.daily_trends || [];

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

  // Resolve Management Team Users
  const ownerId = dealership.dealer_owner || dealership.dealer_id || dealership.dealer_owner_id;
  const dealerOwner = ownerId ? staffMap[ownerId] : null;
  const adminId = dealership.primary_admin_id;
  const primaryAdmin = adminId ? staffMap[adminId] : null;

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
        >
          <ChevronLeft size={20} /> Back to Dealership
        </button>
      </div>

      <div className="bg-surface rounded-[2rem] md:rounded-[3rem] shadow-xl shadow-primary/5 border border-border overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[150%] bg-[radial-gradient(ellipse_at_top_left,rgba(var(--color-primary),0.08),transparent_60%)] pointer-events-none"></div>

        <div className="p-6 md:p-8 lg:p-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
            <div className="flex-shrink-0 relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-background border border-border flex items-center justify-center shadow-xl shadow-primary/5 relative overflow-hidden transition-all duration-500 group-hover:shadow-primary/10">
                {dealership.logo_url ? (
                  <Image
                    src={dealership.logo_url}
                    alt={dealershipName}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 112px, 144px"
                  />
                ) : (
                  <span className="text-5xl font-bold text-primary/40 transition-all duration-500 group-hover:text-primary group-hover:scale-110 select-none">
                    {initial}
                  </span>
                )}
              </div>
              <div
                className={`absolute -bottom-2 -right-2 p-1.5 rounded-2xl bg-surface shadow-lg border border-border`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusColor} border shadow-inner`}
                >
                  <StatusIcon size={16} />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left min-w-0">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-bold text-text tracking-tight leading-tight truncate">
                  {dealershipName}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor} border shadow-sm`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-error'}`}
                    ></div>
                    {statusText}
                  </div>
                  <TagList tags={dealerTags} />
                  <div className="flex items-center gap-2 text-text-muted bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
                    <Fingerprint size={12} className="text-primary/60" />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wide">
                      ID: {dealership.id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  {dealership.code && (
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-[10px] font-bold uppercase tracking-wider leading-none shadow-sm">
                      {dealership.code}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 pt-2 border-t border-border/50">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider">
                    Location Team
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {dealershipUsers.slice(0, 4).map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-surface bg-background flex items-center justify-center text-[10px] font-bold text-text-muted shadow-sm overflow-hidden ring-1 ring-border relative group/avatar"
                        >
                          {u.profile_picture ? (
                            <Image
                              src={u.profile_picture}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <span className="uppercase text-[10px]">
                              {u.first_name?.[0] || 'U'}
                            </span>
                          )}
                        </div>
                      ))}
                      {dealershipUsers.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-surface bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center text-[10px] font-bold text-primary shadow-sm ring-1 ring-border">
                          +{dealershipUsers.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-text/80">
                      {dealershipUsers.length}{' '}
                      <span className="text-text-muted font-bold">Members</span>
                    </span>
                  </div>
                </div>
                <div className="hidden md:block w-px h-10 bg-border/60"></div>
                <div className="flex flex-col gap-1.5 text-center lg:text-left">
                  <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-wider">
                    Registered Since
                  </span>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <Calendar size={14} className="text-primary/60" />
                    <span className="text-sm font-bold text-text">{createdDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-10">
        <div className="xl:col-span-2 space-y-8 xl:space-y-10">
          <div className="bg-surface rounded-[2rem] border border-border p-6 md:p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Globe size={120} />
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                <Building2 size={20} />
              </div>
              <h2 className="text-xl font-bold text-text tracking-tight uppercase">
                Core Operations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-background border border-border hover:border-primary/30 transition-all group/item shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-info shadow-sm group-hover/item:text-primary transition-colors">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-text-muted/70 uppercase block mb-0.5 tracking-wide">
                        Business Email
                      </span>
                      <div className="text-sm font-bold text-text truncate">
                        {dealership.email || dealership.contact_email || 'Not Provided'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-border hover:border-success/30 transition-all group/item shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-success shadow-sm">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-text-muted/70 uppercase block mb-0.5 tracking-wide">
                        Direct Line
                      </span>
                      <div className="text-sm font-bold text-text">
                        {dealership.phone || dealership.contact_phone || 'Not Provided'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-border hover:border-warning/30 transition-all group/item shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-warning shadow-sm">
                      <Globe size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-text-muted/70 uppercase block mb-0.5 tracking-wide">
                        Official Portal
                      </span>
                      <div className="text-sm font-bold text-primary truncate">
                        {dealership.website ? (
                          <a
                            href={dealership.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {dealership.website.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        ) : (
                          'Not Listed'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-2xl p-6 border border-border relative flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={14} className="text-primary/60" />
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    HQ Address
                  </span>
                </div>
                <p className="text-base font-bold text-text leading-tight mb-4">
                  {dealership.address || 'Street address unlisted'}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[dealership.city, dealership.state, dealership.zip_code]
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-surface border border-border text-[10px] font-semibold uppercase text-text-muted/70 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
                    Region
                  </span>
                  <span className="text-[10px] font-semibold text-text px-3 py-0.5 rounded-full bg-surface border border-border uppercase tracking-widest shadow-inner">
                    {dealership.country || 'Global'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap gap-6 items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest block">
                    Licensing
                  </span>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-info/60" />
                    <span className="text-xs font-mono font-bold text-text">
                      {dealership.license_number || 'STAGING'}
                    </span>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/40"></div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest block">
                    Tax Identity
                  </span>
                  <div className="flex items-center gap-2">
                    <Fingerprint size={14} className="text-warning/60" />
                    <span className="text-xs font-mono font-bold text-text">
                      {dealership.tax_id || 'STAGING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-info rounded-full shadow-sm shadow-info/20"></div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-text tracking-tight uppercase">
                  Platform Crew
                </h2>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                  Authorized Personnel for this location
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {dealershipUsers.length > 0 ? (
                dealershipUsers.map((u, i) => {
                  const name =
                    `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                    u.name ||
                    u.email ||
                    'Staff Member';
                  const initial = name[0]?.toUpperCase() || 'S';
                  const rawRole = u.role?.name || u.role || 'staff';

                  // Format: snake_case -> Title Case
                  const formattedRole = rawRole
                    .split(/[_\s]+/)
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

                  const getRoleBadgeStyle = (r) => {
                    const low = r.toLowerCase();
                    if (low.includes('super')) return 'bg-rose-50 text-rose-600 border-rose-100';
                    if (low.includes('manager') || low.includes('owner'))
                      return 'bg-blue-50 text-blue-600 border-blue-100';
                    return 'bg-orange-50 text-orange-600 border-orange-100';
                  };

                  return (
                    <div
                      key={i}
                      className="bg-surface rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all group hover:border-primary/20 flex flex-col items-center text-center"
                    >
                      <div className="relative mb-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-background to-surface border border-border flex items-center justify-center overflow-hidden relative shadow-inner ring-4 ring-background/50 group-hover:ring-primary/5 transition-all">
                          {u.profile_picture ? (
                            <Image
                              src={u.profile_picture}
                              alt={name}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                              sizes="64px"
                            />
                          ) : (
                            <span className="text-lg font-bold text-primary/30 uppercase">
                              {initial}
                            </span>
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface ${u.is_active || u.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(var(--color-success),0.4)]' : 'bg-text-muted/30 shadow-inner'}`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0 w-full mb-3">
                        <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors mb-2">
                          {name}
                        </h4>
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(formattedRole)}`}
                        >
                          {formattedRole}
                        </span>
                      </div>

                      <div className="w-full pt-3 border-t border-border/50 flex items-center justify-center gap-2">
                        <Mail size={12} className="text-text-muted/40" />
                        <span className="text-[10px] font-bold text-text-muted/60 truncate max-w-full select-all">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 bg-background/30 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center">
                  <UsersIcon size={32} className="text-text-muted/20 mb-3" />
                  <h4 className="text-sm font-black text-text-muted uppercase tracking-widest opacity-40">
                    Empty Crew
                  </h4>
                  <p className="text-[10px] font-bold text-text-muted/30 uppercase tracking-widest">
                    No staff members assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Metrics & Events */}
        <div className="space-y-6 xl:space-y-8">
          {/* Performance Metrics Card */}
          <div className="bg-surface rounded-3xl p-5 md:p-6 shadow-sm border border-border relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-bold text-text tracking-tight uppercase">Performance</h3>
            </div>

            <div className="space-y-4">
              {/* Total Quotes */}
              <div className="p-4 rounded-2xl bg-background border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest block mb-1">
                      Total Quotes
                    </span>
                    <div className="text-2xl font-bold text-text tabular-nums">
                      {totalQuotes.toLocaleString()}
                    </div>
                  </div>
                  <FileText size={24} className="text-info/30" />
                </div>
              </div>

              {/* Conversion Rate */}
              <div className="p-4 rounded-2xl bg-background border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest block mb-1">
                      Conversion Rate
                    </span>
                    <div className="text-2xl font-bold text-text tabular-nums">
                      {conversionRate}%
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${parseFloat(conversionRate) >= 20 ? 'bg-success/10 text-success' : parseFloat(conversionRate) >= 10 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'}`}
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
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/10">
                <span className="text-[10px] font-semibold text-text-muted/70 uppercase tracking-widest block mb-1">
                  Gross Revenue
                </span>
                <div className="text-2xl font-bold text-text tabular-nums">
                  $
                  {totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
                  <div className="text-lg font-bold text-success tabular-nums">
                    {acceptedQuotes}
                  </div>
                  <div className="text-[8px] font-semibold text-success/70 uppercase tracking-wider">
                    Accepted
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 text-center">
                  <div className="text-lg font-bold text-warning tabular-nums">{pendingQuotes}</div>
                  <div className="text-[8px] font-semibold text-warning/70 uppercase tracking-wider">
                    Pending
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-center">
                  <div className="text-lg font-bold text-error tabular-nums">{rejectedQuotes}</div>
                  <div className="text-[8px] font-semibold text-error/70 uppercase tracking-wider">
                    Rejected
                  </div>
                </div>
              </div>

              {/* Avg Quote & Response Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[8px] font-semibold text-text-muted/70 uppercase tracking-wider block mb-1">
                    Avg Quote
                  </span>
                  <div className="text-base font-bold text-primary tabular-nums">
                    $
                    {avgQuoteAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[8px] font-semibold text-text-muted/70 uppercase tracking-wider block mb-1">
                    Avg Response
                  </span>
                  <div className="text-base font-bold text-text tabular-nums">
                    {parseFloat(avgResponseTime).toFixed(1)} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
