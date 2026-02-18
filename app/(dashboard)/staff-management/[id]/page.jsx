'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Activity,
  LogIn,
  Loader2,
  CheckCircle,
  Ban,
  Lock,
  Clock,
} from 'lucide-react';
import userService from '@/services/userService';
import staffService from '@/services/staffService';
import { useAuth } from '@/context/AuthContext';

export default function StaffDetailPage({ params }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState(null);
  const [activities, setActivities] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState(null);

  const isDealerManager = currentUser?.role === 'dealer_manager';

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      setStaffId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  const fetchStaffDetails = useCallback(async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const staffData = isDealerManager
        ? await staffService.getStaffById(staffId)
        : await userService.getUserById(staffId);

      setStaff(staffData);

      const [activitiesRes, performanceRes] = await Promise.all([
        isDealerManager
          ? staffService.getStaffActivities(staffId, { limit: 10 }).catch(() => [])
          : userService.getUserActivities(staffId).catch(() => []),
        isDealerManager
          ? staffService.getStaffPerformance(staffId).catch(() => null)
          : Promise.resolve(null),
      ]);

      // Handle potential response structure
      let activitiesData = [];
      if (Array.isArray(activitiesRes)) {
        activitiesData = activitiesRes;
      } else if (activitiesRes?.data && Array.isArray(activitiesRes.data)) {
        activitiesData = activitiesRes.data;
      } else if (activitiesRes?.activities && Array.isArray(activitiesRes.activities)) {
        activitiesData = activitiesRes.activities;
      }

      setActivities(activitiesData);
      setPerformance(performanceRes);
    } catch (error) {
      console.error('Failed to fetch staff details:', error);
    } finally {
      setLoading(false);
    }
  }, [staffId, isDealerManager]);

  useEffect(() => {
    if (staffId) {
      fetchStaffDetails();
    }
  }, [staffId, fetchStaffDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-8 text-center text-red-500">
        Staff Not Found
        <button
          onClick={() => router.back()}
          className="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  const fullName =
    `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || staff.name || staff.email;
  const initial = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const status = (staff.status || (staff.is_active ? 'active' : 'inactive')).toLowerCase();

  const getStatusInfo = (s) => {
    switch (s) {
      case 'active':
        return {
          text: 'Active',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
          description: 'Active Account',
        };
      case 'pending':
        return {
          text: 'Pending',
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          icon: Clock,
          description: 'Invitation Pending',
        };
      default:
        return {
          text: 'Inactive',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: Ban,
          description: 'Inactive Account',
        };
    }
  };

  const {
    text: statusText,
    color: statusColor,
    icon: StatusIcon,
    description: statusDescription,
  } = getStatusInfo(status);

  const roleName = staff.role?.name || staff.role || 'Staff';
  const joinedDate = staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A';

  const getPermissionStyle = (perm) => {
    const p = (typeof perm === 'string' ? perm : perm.name || perm.code).toLowerCase();
    if (p.includes('quote')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (p.includes('dealer')) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (p.includes('user')) return 'bg-green-50 text-green-700 border-green-100';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  return (
    <div className="space-y-6 p-6 md:p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        title="Go Back"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Staff List</span>
      </button>

      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <User size={120} />
        </div>

        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          <div className="flex-shrink-0">
            {staff.profile_image ? (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-gray-100 relative">
                <Image src={staff.profile_image} alt={fullName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/10 text-white text-3xl font-bold uppercase border-4 border-white">
                {initial}
              </div>
            )}
          </div>

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
              </div>
              <div className="flex items-center gap-2 text-[rgb(var(--color-text-muted))] text-sm font-medium">
                <Shield size={16} />
                <span className="uppercase">{roleName}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="font-mono opacity-70">ID: {staff.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  Email Address
                </span>
                <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-medium break-all">
                  <Mail size={16} className="text-blue-500 flex-shrink-0" />
                  {staff.email || 'N/A'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <div className="flex items-center gap-2 text-[rgb(var(--color-text))] font-medium">
                  <Phone size={16} className="text-green-500 flex-shrink-0" />
                  {staff.phone_number || staff.phone || 'N/A'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))]">
                <span className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase tracking-wider block mb-1">
                  Date Joined
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

      {isDealerManager && performance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Quotes Created</p>
              <p className="text-2xl font-bold text-blue-900">
                {performance.total_quotes || performance.quotes_created || 0}
              </p>
            </div>
            <Activity className="text-blue-300 opacity-50" size={32} />
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase mb-1">Approval Rate</p>
              <p className="text-2xl font-bold text-green-900">{performance.approval_rate || 0}%</p>
            </div>
            <CheckCircle className="text-green-300 opacity-50" size={32} />
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase mb-1">Revenue Generated</p>
              <p className="text-2xl font-bold text-purple-900">
                AED {(performance.revenue_generated || 0).toLocaleString()}
              </p>
            </div>
            <Building2 className="text-purple-300 opacity-50" size={32} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Permissions & Access
          </h3>

          {Array.isArray(staff.permissions) && staff.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {staff.permissions.map((perm, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPermissionStyle(perm)}`}
                >
                  {typeof perm === 'string'
                    ? perm.replace(/_/g, ' ').toUpperCase()
                    : (perm.name || perm.code).replace(/_/g, ' ').toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[rgb(var(--color-text-muted))] italic bg-[rgb(var(--color-background))] rounded-xl">
              No custom permissions assigned.
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6">
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-4 flex items-center gap-2">
            <Activity size={20} className="text-orange-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              <div className="relative pl-2 space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-gray-100">
                {activities.slice(0, 5).map((act, idx) => {
                  const dateVal = act.timestamp || act.created_at || act.createdAt;
                  const dateObj = dateVal ? new Date(dateVal) : null;
                  const formattedDate = dateObj
                    ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : 'Recent';
                  const formattedTime = dateObj
                    ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : '';

                  const actionName = (act.description || act.action || 'Unknown Action')
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  let iconColor = 'bg-gray-100 text-gray-500';
                  let IconComponent = Activity;
                  if (actionName.includes('login')) {
                    iconColor = 'bg-blue-100 text-blue-600';
                    IconComponent = User;
                  } else if (actionName.includes('quote')) {
                    iconColor = 'bg-purple-100 text-purple-600';
                    IconComponent = Mail;
                  } else if (actionName.includes('create') || actionName.includes('approve')) {
                    iconColor = 'bg-green-100 text-green-600';
                    IconComponent = CheckCircle;
                  } else if (actionName.includes('delete') || actionName.includes('suspend')) {
                    iconColor = 'bg-red-100 text-red-600';
                    IconComponent = Ban;
                  }

                  return (
                    <div key={idx} className="relative flex gap-4">
                      <div
                        className={`absolute left-0 mt-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${iconColor}`}
                      >
                        <IconComponent size={10} strokeWidth={3} />
                      </div>

                      <div className="flex-1 ml-4 bg-[rgb(var(--color-surface))] rounded-lg border border-[rgb(var(--color-border))] p-3 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-semibold text-sm text-[rgb(var(--color-text))]">
                              {actionName}
                            </h4>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="block text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
                              {formattedDate}
                            </span>
                            <span className="block text-[10px] text-gray-400">{formattedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
