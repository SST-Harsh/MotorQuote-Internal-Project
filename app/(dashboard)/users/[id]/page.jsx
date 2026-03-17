'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Skeleton from '@/components/common/Skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useUserActivities, useUserLoginHistory } from '@/hooks/useUsers';
import { useRoles, usePermissions } from '@/hooks/useRoles';
import { useDealerships } from '@/hooks/useDealerships';
import {
  ArrowLeft,
  Shield,
  Building2,
  Mail,
  Calendar,
  User,
  CheckCircle,
  Ban,
  Lock,
  Activity,
  KeyRound,
  Phone,
} from 'lucide-react';
import tagService from '@/services/tagService';
import TagList from '@/components/common/tags/TagList';

export default function UserDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();

  const { data: user, isLoading: userLoading, error } = useUser(id);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const { data: dealerships = [], isLoading: dealershipsLoading } = useDealerships();
  const { data: activities = [] } = useUserActivities(id);
  const { data: loginHistory = [], isLoading: loginHistoryLoading } = useUserLoginHistory(id);

  const [userTags, setUserTags] = useState([]);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Fetch user tags
  useEffect(() => {
    if (id) {
      tagService
        .getEntityTags('user', id)
        .then((tags) => setUserTags(tags || []))
        .catch((err) => console.error('Failed to fetch user tags:', err));
    }
  }, [id]);

  // Reset error state when user changes
  useEffect(() => {
    setImageLoadError(false);
  }, [user]);

  // Hook called at top level to satisfy Rules of Hooks
  // Resolved dealerships with both ID and Name for linking
  const resolvedUserDealerships = useMemo(() => {
    // 1. Check if user object already has the full dealership list (common in this app)
    if (Array.isArray(user?.dealerships) && user.dealerships.length > 0) {
      return user.dealerships.map((d) => ({
        id: d.id,
        name: d.name || d.dealership_name || 'Unnamed Dealership',
      }));
    }

    // 2. Fallback to matching with global dealerships list
    const allDealerships = Array.isArray(dealerships)
      ? dealerships
      : dealerships?.dealerships || [];

    const dealershipIds = [
      user?.dealership_id,
      ...(Array.isArray(user?.assigned_dealerships) ? user.assigned_dealerships : []),
      user?.dealership?.id,
    ].filter(Boolean);

    if (dealershipIds.length > 0) {
      const matched = allDealerships.filter((d) => dealershipIds.includes(d.id));
      if (matched.length > 0) {
        return matched.map((d) => ({ id: d.id, name: d.name }));
      }
    }

    // 3. Last resort fallback to strings or single objects
    if (user?.dealership_name) return [{ id: user.dealership_id, name: user.dealership_name }];
    if (user?.dealership?.name) return [{ id: user.dealership?.id, name: user.dealership.name }];
    if (typeof user?.dealership === 'string') return [{ id: null, name: user.dealership }];

    return [];
  }, [user, dealerships]);

  // Simple display names for the summary section
  const userDealershipNames = useMemo(
    () =>
      resolvedUserDealerships.length > 0
        ? resolvedUserDealerships.map((d) => d.name)
        : ['System / None'],
    [resolvedUserDealerships]
  );

  if (userLoading || rolesLoading || permissionsLoading || dealershipsLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton variant="text" width={150} height={40} />
        <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
          <div className="flex gap-6">
            <Skeleton variant="rectangular" width={128} height={128} className="rounded-3xl" />
            <div className="space-y-4 flex-1">
              <div className="mb-2">
                <Skeleton variant="text" width={300} height={50} />
                <Skeleton variant="text" width={200} height={24} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
                <Skeleton variant="rectangular" height={80} className="rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        {/* Permissions Skeleton */}
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

  if (error || !user) {
    return (
      <div className="p-8 text-center text-red-500">
        User not found or an error occurred.
        <button
          onClick={() => router.back()}
          className="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Data Processing (after early returns, safely using 'user') ---

  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : user.name || user.username || user.email || 'Unknown User';

  const initial = firstName ? firstName[0] : fullName ? fullName[0] : '?';

  const roleName = (() => {
    const rId = user.role_id || user.roleId || user.role?.id;
    const foundRole = (Array.isArray(roles) ? roles : []).find((r) => r.id === rId);
    if (foundRole) return foundRole.name;

    if (typeof user.role === 'string') return user.role;
    return user.role?.name || user.role?.label || user.role?.code || 'Unknown Role';
  })();

  const isSuspended =
    user.status?.toLowerCase() === 'suspended' || !!user.suspended_at || !!user.suspension_reason;
  const isActive =
    (user.status === 'Active' || user.is_active === true || user.isActive === true) && !isSuspended;
  const statusText = isSuspended ? 'Suspended' : user.status || (isActive ? 'Active' : 'Inactive');
  const statusColor = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  const StatusIcon = isActive ? CheckCircle : Ban;

  const dateValue = user.created_at || user.createdAt || user.joinedDate || user.join_date;
  const joinedDate =
    dateValue && !isNaN(new Date(dateValue).getTime())
      ? new Date(dateValue).toLocaleDateString()
      : 'N/A';

  const roleIdFromUser = user.role_id || user.roleId || user.role?.id;
  const roleCodeFromUser =
    typeof user.role === 'string' ? user.role : user.role?.code || user.role?.name;

  const foundRole = (Array.isArray(roles) ? roles : []).find(
    (r) =>
      (roleIdFromUser && String(r.id) === String(roleIdFromUser)) ||
      (roleCodeFromUser && (r.code === roleCodeFromUser || r.name === roleCodeFromUser))
  );

  const rolePermissionsRaw = foundRole?.permissions || user.role?.permissions || [];
  const rolePermissions = (Array.isArray(rolePermissionsRaw) ? rolePermissionsRaw : [])
    .map((p) => {
      const pId = p && typeof p === 'object' ? p.id || p.code || p.value : p;
      if (!pId) return null;
      if (pId === 'view_impersonation_history') return null;
      const found = (Array.isArray(permissions) ? permissions : []).find(
        (perm) =>
          perm.id === pId ||
          perm.code === pId ||
          perm.value === pId ||
          String(perm.id) === String(pId)
      );
      return found ? found.name || found.label : p.name || p.label || pId;
    })
    .filter(Boolean);

  const userPermissionsRaw = user.permissions || user.user_permissions || [];
  const directPermissions = (Array.isArray(userPermissionsRaw) ? userPermissionsRaw : [])
    .map((p) => {
      const pId = p && typeof p === 'object' ? p.id || p.code || p.value : p;
      if (!pId) return null;
      if (pId === 'view_impersonation_history') return null;
      const found = (Array.isArray(permissions) ? permissions : []).find(
        (perm) =>
          perm.id === pId ||
          perm.code === pId ||
          perm.value === pId ||
          String(perm.id) === String(pId)
      );
      return found ? found.name || found.label : p.name || p.label || pId;
    })
    .filter(Boolean);

  const allPermissions = Array.from(new Set([...rolePermissions, ...directPermissions]));

  return (
    <div className="space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Header / Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Users</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-10 relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
          {/* Avatar Implementation */}
          <div className="flex-shrink-0 relative group">
            {(() => {
              const potentialImages = [
                user.avatar,
                user.profile_image,
                user.profile_picture,
                user.profilePicture,
                user.image,
                user.picture,
              ];
              let imageUrl = potentialImages.find(
                (url) =>
                  url &&
                  typeof url === 'string' &&
                  url.trim().length > 0 &&
                  !['null', 'undefined', 'false'].includes(imageUrl?.toLowerCase())
              );

              if (imageUrl && imageUrl.startsWith('/')) {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                imageUrl = `${backendUrl.replace(/\/$/, '')}${imageUrl}`;
              }

              if (imageUrl && !imageLoadError) {
                return (
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
                );
              }
              return (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl shadow-primary/20 text-white text-5xl font-bold border-4 border-white ring-1 ring-border">
                  {initial}
                </div>
              );
            })()}
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${isActive ? 'bg-success' : 'bg-text-muted/30'} shadow-sm`}
            ></div>
          </div>

          <div className="flex-1 space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-text))] tracking-tight">
                  {fullName}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${statusColor} border-current/20 backdrop-blur-sm transition-all hover:scale-105`}
                  >
                    <StatusIcon size={12} strokeWidth={3} />
                    {statusText}
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
                  <Shield size={14} className="text-primary/60" />
                  {roleName}
                </div>
                <span className="w-1 h-1 bg-border rounded-full hidden md:block"></span>
                <div className="flex items-center gap-2 bg-gray-50/50 px-2 py-1 rounded-lg border border-border/40 font-mono lowercase">
                  <KeyRound size={12} className="text-orange-500/60" />
                  <span className="opacity-70 font-bold">{user.id?.slice(0, 8)}...</span>
                </div>
              </div>

              <TagList tags={userTags} />
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
                    title={user.email}
                  >
                    {user.email || 'Not Provided'}
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
                    {user.phone || user.phone_number || user.phoneNumber || 'Not Provided'}
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
                    Partner Since
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
        {/* Left Column: Main Info (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Permissions Section */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-border bg-background/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                <Lock size={16} className="text-primary" />
                Permissions & Capabilities
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
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                      <span className="text-xs font-semibold text-text/80 group-hover:text-text">
                        {perm}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[rgb(var(--color-text-muted))] italic bg-background/50 rounded-2xl border border-dashed border-border px-6">
                  No custom permissions assigned to this profile.
                </div>
              )}
            </div>
          </div>

          {/* Dealerships Section */}
          {resolvedUserDealerships.length > 0 && (
            <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
              <div className="p-6 border-b border-border bg-background/30">
                <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                  <Building2 size={16} className="text-purple-500" />
                  Authorized Portals
                </h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resolvedUserDealerships.map((d, idx) => (
                    <Link
                      key={idx}
                      href={d.id ? `/dealerships/${d.id}` : '#'}
                      className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:border-purple-300 hover:bg-purple-50/20 transition-all group shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-[rgb(var(--color-text))] truncate block">
                            {d.name}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                            Manage Assets
                          </span>
                        </div>
                      </div>
                      {d.id && (
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all">
                          <ArrowLeft className="rotate-180" size={12} />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Activity Feed */}
          <div className="bg-[rgb(var(--color-surface))] rounded-3xl shadow-sm border border-[rgb(var(--color-border))] overflow-hidden">
            <div className="p-6 border-b border-border bg-background/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-widest">
                <Activity size={16} className="text-orange-500" />
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(() => {
                  const combined = [
                    ...activities.map((a) => ({ ...a, _type: 'activity' })),
                    ...loginHistory.map((l) => ({
                      ...l,
                      _type: 'login',
                      action: 'LOGIN_SUCCESS',
                      timestamp:
                        l.login_at || l.loginAt || l.timestamp || l.login_time || l.loginTime,
                      details: { ip: l.ip_address || l.ipAddress || l.ip },
                    })),
                  ].sort((a, b) => {
                    const dateA = new Date(a.timestamp || a.created_at || a.createdAt || 0);
                    const dateB = new Date(b.timestamp || b.created_at || b.createdAt || 0);
                    return dateB - dateA;
                  });

                  if (combined.length > 0) {
                    return (
                      <div className="space-y-3">
                        {combined.slice(0, 5).map((act, idx) => {
                          const dateVal =
                            act.timestamp ||
                            act.created_at ||
                            act.createdAt ||
                            act.login_time ||
                            act.loginTime;
                          const dateObj = dateVal ? new Date(dateVal) : null;
                          const isValidDate = dateObj && !isNaN(dateObj.getTime());
                          const formattedDate = isValidDate
                            ? dateObj.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recent';
                          const formattedTime = isValidDate
                            ? dateObj.toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';

                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-xl bg-background border border-border hover:shadow-sm transition-shadow group/act"
                            >
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em] opacity-60">
                                  {formattedDate} • {formattedTime}
                                </span>
                                <div
                                  className={`w-2 h-2 rounded-full ${act.action?.includes('LOGIN') ? 'bg-blue-500' : 'bg-primary'} animate-pulse`}
                                ></div>
                              </div>
                              <h4 className="font-bold text-xs text-[rgb(var(--color-text))] group-hover/act:text-primary transition-colors">
                                {act.action?.replace(/_/g, ' ')}
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
                    );
                  }

                  return (
                    <div className="text-center py-10 px-4 bg-background/50 rounded-2xl border border-dashed border-border">
                      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
                        <Activity size={18} className="text-text-muted/40" />
                      </div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        No Pulse Found
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
