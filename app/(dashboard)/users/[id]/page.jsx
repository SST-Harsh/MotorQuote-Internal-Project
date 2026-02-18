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
  const userDealerships = useMemo(() => {
    const list = Array.isArray(dealerships) ? dealerships : dealerships?.dealerships || [];

    const dealershipId =
      user?.dealership_ids ||
      user?.assigned_dealerships ||
      (Array.isArray(user?.dealerships) ? user.dealerships.map((d) => d.id) : []) ||
      [user?.dealership_id || user?.dealership?.id].filter(Boolean);

    if (dealershipId?.length > 0) {
      return list.filter((d) => dealershipId.includes(d.id)).map((d) => d.name);
    }

    if (typeof user?.dealership === 'string') return [user.dealership];
    if (user?.dealership?.name) return [user.dealership.name];

    return ['System / None'];
  }, [user, dealerships]);

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

  const isActive = user.status === 'Active' || user.is_active === true || user.isActive === true;
  const statusText = user.status || (isActive ? 'Active' : 'Inactive');
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
    <div className="space-y-6 p-6 md:p-8 animate-in fade-in duration-300">
      {/* Header / Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Users</span>
      </button>

      {/* Main Profile Card */}
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <User size={120} />
        </div>

        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          {/* Avatar / Identity */}
          <div className="flex-shrink-0">
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
                  !['null', 'undefined', 'false'].includes(url.toLowerCase())
              );

              if (imageUrl && imageUrl.startsWith('/')) {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                imageUrl = `${backendUrl.replace(/\/$/, '')}${imageUrl}`;
              }

              if (imageUrl && !imageLoadError) {
                return (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-gray-100 relative">
                    <Image
                      src={imageUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 96px, 128px"
                      onError={() => setImageLoadError(true)}
                    />
                  </div>
                );
              }
              return (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/10 text-white text-4xl font-bold uppercase border-4 border-white">
                  {initial}
                </div>
              );
            })()}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-[rgb(var(--color-text))]">{fullName}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${statusColor}`}
                >
                  <StatusIcon size={14} />
                  {statusText}
                </span>
                <TagList tags={userTags} />
              </div>
              <div className="flex items-center gap-2 text-[rgb(var(--color-text-muted))] text-sm font-medium">
                <Shield size={16} />
                <span className="uppercase">{roleName}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="font-mono opacity-70">ID: {user.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-medium break-all">
                  <Mail size={16} className="text-blue-500 flex-shrink-0" />
                  {user.email || 'N/A'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  {userDealerships.length > 1 ? 'Dealerships' : 'Dealership'}
                </span>
                <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-medium">
                  <Building2 size={16} className="text-purple-500 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {userDealerships.map((name, idx) => (
                      <span
                        key={idx}
                        className={idx < userDealerships.length - 1 ? "after:content-[',']" : ''}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  Joined Date
                </span>
                <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-medium">
                  <Calendar size={16} className="text-orange-500 flex-shrink-0" />
                  {joinedDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions & Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permissions */}
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Permissions & Access
          </h3>

          {allPermissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allPermissions.map((perm, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                >
                  {perm}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[rgb(var(--color-text-muted))] italic bg-[rgb(var(--color-background))] rounded-xl">
              No custom permissions assigned.
            </div>
          )}
        </div>

        <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <Activity size={20} className="text-orange-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {(() => {
              const combined = [
                ...activities.map((a) => ({ ...a, _type: 'activity' })),
                ...loginHistory.map((l) => ({
                  ...l,
                  _type: 'login',
                  action: 'LOGIN_SUCCESS',
                  timestamp: l.login_at || l.loginAt || l.timestamp || l.login_time || l.loginTime,
                  details: { ip: l.ip_address || l.ipAddress || l.ip },
                })),
              ].sort((a, b) => {
                const dateA = new Date(a.timestamp || a.created_at || a.createdAt || 0);
                const dateB = new Date(b.timestamp || b.created_at || b.createdAt || 0);
                return dateB - dateA;
              });

              if (combined.length > 0) {
                return (
                  <div className="relative pl-2 space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-gray-100">
                    {combined.slice(0, 10).map((act, idx) => {
                      const dateVal =
                        act.timestamp ||
                        act.created_at ||
                        act.createdAt ||
                        act.login_time ||
                        act.loginTime;
                      const dateObj = dateVal ? new Date(dateVal) : null;
                      const isValidDate = dateObj && !isNaN(dateObj.getTime());
                      const formattedDate = isValidDate
                        ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : 'Recent';
                      const formattedTime = isValidDate
                        ? dateObj.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';

                      const actionName = (act.action || 'Unknown Action')
                        .replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase());

                      let iconColor = 'bg-gray-100 text-gray-500';
                      let IconComponent = Activity;
                      if (act.action?.includes('LOGIN')) {
                        iconColor = 'bg-blue-100 text-blue-600';
                        IconComponent = User;
                      } else if (act.action?.includes('QUOTE')) {
                        iconColor = 'bg-purple-100 text-purple-600';
                        IconComponent = Mail;
                      } else if (act.action?.includes('CREATE')) {
                        iconColor = 'bg-green-100 text-green-600';
                        IconComponent = CheckCircle;
                      } else if (
                        act.action?.includes('DELETE') ||
                        act.action?.includes('SUSPEND')
                      ) {
                        iconColor = 'bg-red-100 text-red-600';
                        IconComponent = Ban;
                      }

                      let detailsText = '';
                      if (typeof act.details === 'string') {
                        detailsText = act.details;
                      } else {
                        if (act.action === 'LOGIN_SUCCESS' || act.action?.includes('LOGIN')) {
                          const ip =
                            act.ipAddress ||
                            act.ip ||
                            act.details?.ip ||
                            act.details?.ipAddress ||
                            'Unknown';
                          detailsText = `IP: ${ip}`;
                        } else if (act.action?.includes('QUOTE')) {
                          const customer = act.details?.customerName || act.details?.customer_name;
                          detailsText = customer ? `Customer: ${customer}` : 'New Quote Generated';
                        } else if (act.details && typeof act.details === 'object') {
                          detailsText =
                            Object.entries(act.details)
                              .filter(
                                ([k, v]) =>
                                  v && typeof v !== 'object' && !k.toLowerCase().includes('id')
                              )
                              .map(([k, v]) => v)
                              .join(', ') || 'Details available';
                        }
                      }

                      return (
                        <div key={idx} className="relative flex gap-4">
                          <div
                            className={`absolute left-0 mt-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${iconColor}`}
                          >
                            <circle cx="12" cy="12" r="10" />
                            <IconComponent size={10} strokeWidth={3} />
                          </div>
                          <div className="flex-1 ml-4 bg-[rgb(var(--color-surface))] rounded-lg border border-[rgb(var(--color-border))] p-3 hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-semibold text-sm text-[rgb(var(--color-text))]">
                                  {actionName}
                                </h4>
                                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 line-clamp-1">
                                  {detailsText}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="block text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                                  {formattedDate}
                                </span>
                                <span className="block text-[10px] text-gray-400">
                                  {formattedTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div className="text-center py-8">
                  <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
                    No recent activity
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Actions performed by this user will appear here.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
