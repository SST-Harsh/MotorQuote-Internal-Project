'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Building2,
  Mail,
  Calendar,
  CheckCircle,
  Ban,
  Activity,
  Lock,
  KeyRound,
  TrendingUp,
  FileText,
  Star,
  Phone,
} from 'lucide-react';
import dayjs from 'dayjs';
import { formatDate } from '@/utils/i18n';
import staffService from '@/services/staffService';
import { useRoles, usePermissions } from '@/hooks/useRoles';
import Skeleton from '@/components/common/Skeleton';

export default function StaffDetailView({ id }) {
  const router = useRouter();
  const [staff, setStaff] = useState(null);
  const [activities, setActivities] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = usePermissions();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      staffService.getStaffById(id),
      staffService.getStaffActivities(id).catch(() => []),
      staffService.getStaffPerformance(id).catch(() => null),
    ])
      .then(([staffRes, activitiesRes, perfRes]) => {
        const staffData = staffRes?.data || staffRes?.staff || staffRes;
        const activitiesData = Array.isArray(activitiesRes)
          ? activitiesRes
          : activitiesRes?.data || activitiesRes?.activities || [];
        setStaff(staffData);
        setActivities(activitiesData);
        setPerformance(perfRes?.data || perfRes?.performance || perfRes);
      })
      .catch((err) => {
        console.error('Failed to fetch staff details:', err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setImageLoadError(false);
  }, [staff]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton variant="text" width={150} height={40} />
        <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
          <div className="flex gap-6">
            <Skeleton variant="rectangular" width={128} height={128} className="rounded-3xl" />
            <div className="space-y-4 flex-1">
              <Skeleton variant="text" width={300} height={50} />
              <Skeleton variant="text" width={200} height={24} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton variant="rectangular" height={200} className="rounded-2xl" />
          </div>
          <div>
            <Skeleton variant="rectangular" height={200} className="rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-8 text-center text-red-500">
        Staff member not found or an error occurred.
        <button
          onClick={() => router.back()}
          className="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Derived values ---
  const firstName = staff.first_name || staff.firstName || '';
  const lastName = staff.last_name || staff.lastName || '';
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : staff.name || staff.email || 'Unknown Staff';
  const initial = (firstName || fullName)[0] || '?';

  const roleName = (() => {
    const rId = staff.role_id || staff.roleId || staff.role?.id;
    const found = roles.find((r) => r.id === rId);
    if (found) return found.name;
    if (typeof staff.role === 'string') return staff.role;
    return staff.role?.name || staff.role?.label || 'Staff';
  })();

  const isActive = staff.is_active === true || staff.isActive === true || staff.status === 'Active';
  const statusText = staff.status || (isActive ? 'Active' : 'Inactive');
  const statusColor = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  const StatusIcon = isActive ? CheckCircle : Ban;

  const joinedDate = (() => {
    const v = staff.created_at || staff.createdAt || staff.joinedDate;
    return v && dayjs(v).isValid() ? formatDate(v) : 'N/A';
  })();

  const dealershipName =
    staff.dealership?.name || staff.dealership_name || staff.work || 'System / None';
  const dealershipId = staff.dealership?.id || staff.dealership_id || null;

  // Resolve permissions
  const foundRole = roles.find((r) => {
    const rId = staff.role_id || staff.roleId || staff.role?.id;
    const rCode = typeof staff.role === 'string' ? staff.role : staff.role?.code;
    return (
      (rId && String(r.id) === String(rId)) || (rCode && (r.code === rCode || r.name === rCode))
    );
  });
  const resolvePerms = (raw) =>
    (Array.isArray(raw) ? raw : [])
      .map((p) => {
        const pId = typeof p === 'object' ? p.id || p.code : p;
        if (!pId) return null;
        const found = permissions.find(
          (x) => x.id === pId || x.code === pId || String(x.id) === String(pId)
        );
        return found ? found.name || found.label : p.name || p.label || pId;
      })
      .filter(Boolean);

  const rolePerms = resolvePerms(foundRole?.permissions || staff.role?.permissions || []);
  const directPerms = resolvePerms(staff.permissions || staff.user_permissions || []);
  const allPermissions = Array.from(new Set([...rolePerms, ...directPerms]));

  // Profile image
  const potentialImages = [
    staff.avatar,
    staff.profile_image,
    staff.profile_picture,
    staff.image,
    staff.picture,
  ];
  let imageUrl = potentialImages.find(
    (u) => u && typeof u === 'string' && u.trim() && !['null', 'undefined', 'false'].includes(u)
  );
  if (imageUrl?.startsWith('/')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    imageUrl = `${backendUrl.replace(/\/$/, '')}${imageUrl}`;
  }

  return (
    <div className="space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Staff</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
          {/* Avatar */}
          <div className="flex-shrink-0 relative group">
            {imageUrl && !imageLoadError ? (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-50 relative ring-1 ring-border">
                <Image
                  src={imageUrl}
                  alt={fullName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 112px, 144px"
                  onError={() => setImageLoadError(true)}
                />
              </div>
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl shadow-primary/20 text-white text-5xl font-bold border-4 border-white ring-1 ring-border">
                {initial}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${isActive ? 'bg-success' : 'bg-text-muted/30'} shadow-sm`}
            />
          </div>

          <div className="flex-1 space-y-6">
            {/* Name & Badges */}
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-text))] tracking-tight">
                  {fullName}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${statusColor} border-current/20 backdrop-blur-sm transition-all hover:scale-105`}
                  >
                    <StatusIcon size={12} strokeWidth={3} /> {statusText}
                  </span>
                  {isActive && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-sm backdrop-blur-sm transition-all hover:scale-105">
                      Verified Account
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[rgb(var(--color-text-muted))] text-xs font-semibold uppercase tracking-widest opacity-80 mb-4">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-primary/60" /> {roleName}
                </div>
                <span className="w-1 h-1 bg-border rounded-full hidden md:block" />
                <div className="flex items-center gap-2 bg-gray-50/50 px-2 py-1 rounded-lg border border-border/40 font-mono lowercase">
                  <KeyRound size={12} className="text-orange-500/60" />
                  <span className="opacity-70 font-bold">
                    {staff.id?.toString().slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid - Refined Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {/* Email Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/60 hover:border-primary/30 hover:shadow-sm transition-all duration-300 group/stat">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover/stat:bg-blue-500 group-hover/stat:text-white transition-all duration-200">
                  <Mail size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-0.5 opacity-60">
                    Email Address
                  </span>
                  <span
                    className="text-sm font-bold text-text truncate block tracking-tight"
                    title={staff.email}
                  >
                    {staff.email || 'Not Provided'}
                  </span>
                </div>
              </div>

              {/* Phone Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/60 hover:border-emerald-500/30 hover:shadow-sm transition-all duration-300 group/stat">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover/stat:bg-emerald-500 group-hover/stat:text-white transition-all duration-200">
                  <Phone size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-0.5 opacity-60">
                    Phone Number
                  </span>
                  <span className="text-sm font-bold text-text truncate block tracking-tight">
                    {staff.phone || staff.phone_number || staff.phoneNumber || 'Not Provided'}
                  </span>
                </div>
              </div>

              {/* Join Date Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border/60 hover:border-orange-500/30 hover:shadow-sm transition-all duration-300 group/stat">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover/stat:bg-orange-500 group-hover/stat:text-white transition-all duration-200">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-0.5 opacity-60">
                    Member Since
                  </span>
                  <span className="text-sm font-bold text-text truncate block tracking-tight">
                    {joinedDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Permissions + Performance + Dealership */}
        <div className="lg:col-span-8 space-y-6">
          {/* Permissions */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-border bg-background/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                <Lock size={16} className="text-primary" /> Permissions &amp; Capabilities
              </h3>
              <span className="text-[10px] font-bold text-text-muted uppercase bg-surface px-2 py-1 rounded-md border border-border">
                {allPermissions.length} Active
              </span>
            </div>
            <div className="p-8">
              {allPermissions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allPermissions.map((perm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-background border border-border hover:border-primary/20 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                      <span className="text-xs font-semibold text-text/80 group-hover:text-text">
                        {perm}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[rgb(var(--color-text-muted))] italic bg-background/50 rounded-2xl border border-dashed border-border px-6">
                  No custom permissions assigned to this staff member.
                </div>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          {performance && (
            <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
              <div className="p-6 border-b border-border bg-background/30">
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                  <TrendingUp size={16} className="text-emerald-500" /> Performance
                </h3>
              </div>
              <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Total Quotes',
                    value: performance.total_quotes ?? performance.totalQuotes ?? '—',
                    icon: FileText,
                    color: 'text-blue-500 bg-blue-50',
                  },
                  {
                    label: 'Conversion Rate',
                    value:
                      performance.conversion_rate != null
                        ? `${performance.conversion_rate}%`
                        : performance.conversionRate != null
                          ? `${performance.conversionRate}%`
                          : '—',
                    icon: TrendingUp,
                    color: 'text-emerald-500 bg-emerald-50',
                  },
                  {
                    label: 'Avg Rating',
                    value: performance.average_rating ?? performance.avgRating ?? '—',
                    icon: Star,
                    color: 'text-orange-500 bg-orange-50',
                  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="p-4 rounded-2xl bg-background border border-border hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}
                    >
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-text">{value}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-60">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Dealership */}
          {dealershipId && (
            <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
              <div className="p-6 border-b border-border bg-background/30">
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                  <Building2 size={16} className="text-purple-500" /> Authorized Portal
                </h3>
              </div>
              <div className="p-8">
                <Link
                  href={`/dealerships/${dealershipId}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-purple-300 hover:bg-purple-50/20 transition-all group shadow-xs hover:shadow-md max-w-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[rgb(var(--color-text))] truncate block">
                        {dealershipName}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                        View Dealership
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all">
                    <ArrowLeft className="rotate-180" size={12} />
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Activity Feed */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-border bg-background/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                <Activity size={16} className="text-orange-500" /> Recent Activity
              </h3>
            </div>
            <div className="p-6">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((act, idx) => {
                    const dateVal = act.timestamp || act.created_at || act.createdAt;
                    const dateObj = dateVal ? new Date(dateVal) : null;
                    const isValidDate = dateObj && !isNaN(dateObj.getTime());
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-background border border-border hover:shadow-sm transition-shadow group/act"
                      >
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] opacity-60">
                            {isValidDate
                              ? dateObj.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Recent'}
                            {isValidDate
                              ? ` • ${dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                              : ''}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <h4 className="font-bold text-xs text-[rgb(var(--color-text))] group-hover/act:text-primary transition-colors">
                          {(act.action || act.type || 'Activity').replace(/_/g, ' ')}
                        </h4>
                        {act.details?.ip && (
                          <p className="text-[10px] font-mono text-text-muted/70 mt-1">
                            IP: {act.details.ip}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-background/50 rounded-2xl border border-dashed border-border">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
                    <Activity size={18} className="text-text-muted/40" />
                  </div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                    No Activity Found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Note */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 to-info/5 border border-primary/10 shadow-xs">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-primary shrink-0 shadow-sm">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text uppercase tracking-widest mb-1">
                  Access Enforcement
                </h4>
                <p className="text-[11px] text-text-muted font-medium leading-relaxed">
                  This staff profile is subject to dealership security policies. Any permission
                  changes should be reviewed by the Dealer Manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
