'use client';
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import tagService from '@/services/tagService';
import TagList from '@/components/common/tags/TagList';

export default function DealershipDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();

  const { data: dealership, isLoading: dealershipLoading, error } = useDealership(id);
  const { data: usersData = [], isLoading: usersLoading } = useUsers();
  const [dealerTags, setDealerTags] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (id) {
      tagService
        .getEntityTags('dealership', id)
        .then((tags) => setDealerTags(tags || []))
        .catch((err) => console.error('Failed to fetch dealership tags:', err));
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setIsHistoryLoading(true);
      auditService
        .getAuditLogs({ dealership_id: id, limit: 12 })
        .then((res) => {
          const logs = Array.isArray(res) ? res : res.data || res.logs || [];
          setHistory(logs);
        })
        .catch((err) => {
          console.error('Failed to fetch dealership activity:', err);
          auditService
            .getResourceHistory('dealership', id)
            .then((res) => setHistory(Array.isArray(res) ? res : res.data || []))
            .catch((e) => console.error('Total history failure:', e));
        })
        .finally(() => setIsHistoryLoading(false));
    }
  }, [id]);

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
          <h2 className="text-xl font-black text-text mb-2">Dealership Not Found</h2>
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

  const performance = dealership.performance || {};
  const quotes = performance.quotes || dealership.total_quotes || 0;
  const conversion = performance.conversion || dealership.conversion_rate || 0;
  const revenue = performance.revenue || dealership.total_revenue || 0;

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
          className="group flex items-center gap-2 text-text-muted hover:text-primary transition-all pr-4"
        >
          <div className="p-2 rounded-xl bg-surface border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">
            Back to Dashboard
          </span>
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
                  <span className="text-5xl font-black text-primary/40 transition-all duration-500 group-hover:text-primary group-hover:scale-110 select-none">
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
                <h1 className="text-3xl md:text-5xl font-black text-text tracking-tight leading-tight truncate">
                  {dealershipName}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor} border shadow-sm`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-error'}`}
                    ></div>
                    {statusText}
                  </div>
                  <TagList tags={dealerTags} />
                  <div className="flex items-center gap-2 text-text-muted bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
                    <Fingerprint size={12} className="text-primary/60" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      ID: {dealership.id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  {dealership.code && (
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest leading-none shadow-sm">
                      {dealership.code}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 pt-2 border-t border-border/50">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.15em]">
                    Location Team
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {dealershipUsers.slice(0, 4).map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-surface bg-background flex items-center justify-center text-[10px] font-black text-text-muted shadow-sm overflow-hidden ring-1 ring-border relative group/avatar"
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
                        <div className="w-8 h-8 rounded-full border-2 border-surface bg-[rgb(var(--color-primary)/0.1)] flex items-center justify-center text-[10px] font-black text-primary shadow-sm ring-1 ring-border">
                          +{dealershipUsers.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-text/80">
                      {dealershipUsers.length}{' '}
                      <span className="text-text-muted font-bold">Members</span>
                    </span>
                  </div>
                </div>
                <div className="hidden md:block w-px h-10 bg-border/60"></div>
                <div className="flex flex-col gap-1.5 text-center lg:text-left">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-[0.15em]">
                    Registered Since
                  </span>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <Calendar size={14} className="text-primary/60" />
                    <span className="text-sm font-black text-text">{createdDate}</span>
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
              <h2 className="text-xl font-black text-text tracking-tight uppercase">
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
                      <span className="text-[10px] font-black text-text-muted/60 uppercase block mb-0.5 tracking-wider">
                        Business Email
                      </span>
                      <div className="text-sm font-black text-text truncate">
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
                      <span className="text-[10px] font-black text-text-muted/60 uppercase block mb-0.5 tracking-wider">
                        Direct Line
                      </span>
                      <div className="text-sm font-black text-text">
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
                      <span className="text-[10px] font-black text-text-muted/60 uppercase block mb-0.5 tracking-wider">
                        Official Portal
                      </span>
                      <div className="text-sm font-black text-primary truncate">
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
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">
                    HQ Address
                  </span>
                </div>
                <p className="text-base font-black text-text leading-tight mb-4">
                  {dealership.address || 'Street address unlisted'}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[dealership.city, dealership.state, dealership.zip_code]
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-surface border border-border text-[10px] font-black uppercase text-text-muted/60 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    Region
                  </span>
                  <span className="text-[10px] font-black text-text px-3 py-0.5 rounded-full bg-surface border border-border uppercase tracking-widest shadow-inner">
                    {dealership.country || 'Global'}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap gap-6 items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest block">
                    Licensing
                  </span>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-info/60" />
                    <span className="text-xs font-mono font-black text-text">
                      {dealership.license_number || 'STAGING'}
                    </span>
                  </div>
                </div>
                <div className="w-px h-8 bg-border/40"></div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest block">
                    Tax Identity
                  </span>
                  <div className="flex items-center gap-2">
                    <Fingerprint size={14} className="text-warning/60" />
                    <span className="text-xs font-mono font-black text-text">
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
                <h2 className="text-xl font-black text-text tracking-tight uppercase">
                  Platform Crew
                </h2>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-60">
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
                    if (low.includes('admin'))
                      return 'bg-purple-50 text-purple-600 border-purple-100';
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
                            <span className="text-lg font-black text-primary/30 uppercase">
                              {initial}
                            </span>
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface ${u.is_active || u.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(var(--color-success),0.4)]' : 'bg-text-muted/30 shadow-inner'}`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0 w-full mb-3">
                        <h4 className="text-xs font-black text-text truncate group-hover:text-primary transition-colors mb-2">
                          {name}
                        </h4>
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getRoleBadgeStyle(formattedRole)}`}
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
        <div className="space-y-8 xl:space-y-10">
          {/* Performance Metrics Card */}
          <div className="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-border relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-info/10 text-info">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-xl font-black text-text tracking-tight uppercase">Performance</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest block">
                    Quotes Issued
                  </span>
                  <div className="text-3xl font-black text-text tabular-nums">
                    {quotes.toLocaleString()}
                  </div>
                </div>
                <div className="w-16 h-10 flex items-end gap-1.5 px-2">
                  {[30, 60, 40, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-info/20 rounded-t-sm group-hover:bg-info/40 transition-all duration-500"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border shadow-sm">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest block">
                    Conversion
                  </span>
                  <div className="text-3xl font-black text-text tabular-nums">{conversion}%</div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-[10px] font-black border border-success/20 uppercase tracking-wider">
                  Optimal
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/10 shadow-sm">
                <span className="text-[10px] font-black text-text-muted/60 uppercase tracking-widest block mb-1">
                  Gross Revenue
                </span>
                <div className="text-3xl font-black text-text tabular-nums tracking-tight">
                  ${revenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="bg-surface rounded-3xl border border-border p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-warning/10 text-warning shadow-sm">
                <History size={20} />
              </div>
              <h3 className="text-xl font-black text-text tracking-tight uppercase">
                Recent Pulse
              </h3>
            </div>

            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
              {isHistoryLoading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex gap-4 animate-pulse px-1">
                      <div className="w-4 h-4 rounded-full bg-background z-10 border-2 border-surface shadow-sm ring-1 ring-border mt-1"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-background rounded w-full"></div>
                        <div className="h-3 bg-background rounded w-2/3 opacity-50"></div>
                      </div>
                    </div>
                  ))
              ) : history.length > 0 ? (
                history.slice(0, 4).map((item, idx) => {
                  const action = String(item.action || '').toUpperCase();
                  const resource = String(item.resource || '').toLowerCase();

                  let Icon = History;
                  let iconColor = 'text-text-muted';
                  let label = action;

                  const resourceName = resource
                    ? resource.charAt(0).toUpperCase() + resource.slice(1)
                    : '';

                  if (action.includes('CREATE') || action.includes('ADD')) {
                    Icon = Plus;
                    iconColor = 'text-success';
                    label =
                      resource === 'quote' ? 'New Quote' : `Created ${resourceName || 'Entry'}`;
                  } else if (action.includes('UPDATE') || action.includes('EDIT')) {
                    Icon = FileEdit;
                    iconColor = 'text-info';
                    label =
                      resource === 'quote'
                        ? 'Quote Updated'
                        : `${resourceName || 'Profile'} Change`;
                  } else if (action.includes('READ') || action.includes('VIEW')) {
                    Icon = Eye;
                    iconColor = 'text-primary';
                    label = `Viewed ${resourceName}`;
                  } else if (
                    action.includes('STATUS') ||
                    action.includes('APPROVE') ||
                    action.includes('REJECT')
                  ) {
                    Icon = Shield;
                    iconColor = action.includes('APPROVE')
                      ? 'text-success'
                      : action.includes('REJECT')
                        ? 'text-error'
                        : 'text-warning';
                    label = action.includes('APPROVE')
                      ? 'Approved Quote'
                      : action.includes('REJECT')
                        ? 'Rejected Quote'
                        : `${resourceName || 'Status'} Switch`;
                  }

                  const rawActor =
                    item.user_name || item.userName || item.user_email?.split('@')[0] || 'Operator';
                  const matchedStaff =
                    staffMap[rawActor] || (item.user_id ? staffMap[item.user_id] : null);
                  let displayName = matchedStaff
                    ? matchedStaff.first_name || matchedStaff.full_name || matchedStaff.name
                    : rawActor;

                  // Format "superadmin" -> "Superadmin"
                  if (displayName && !displayName.includes(' ')) {
                    displayName =
                      displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
                  }

                  return (
                    <div key={idx} className="flex gap-4 relative group/event">
                      <div
                        className={`w-6 h-6 rounded-lg bg-surface border border-border shadow-sm z-10 flex-shrink-0 flex items-center justify-center transition-all group-hover/event:scale-110 group-hover/event:border-primary/20 ${iconColor}`}
                      >
                        <Icon size={12} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-text leading-tight group-hover/event:text-primary transition-colors flex items-center gap-2">
                          {label}
                          <span className="w-1 h-1 rounded-full bg-border/60"></span>
                          <span className="text-[10px] font-bold text-text-muted/60">
                            {new Date(item.created_at || item.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted/80 mt-1 truncate">
                          Processed by <span className="text-text font-black">{displayName}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-40">
                  <Clock size={32} className="mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    No Recent Pulse
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
