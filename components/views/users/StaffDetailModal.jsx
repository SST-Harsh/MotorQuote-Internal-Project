'use client';
import React, { useState, useEffect } from 'react';
import DetailViewModal from '@/components/common/DetailViewModal';
import {
  User,
  Shield,
  Activity,
  TrendingUp,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import staffService from '@/services/staffService';
import { formatDate, formatDateTime } from '@/utils/i18n';

export default function StaffDetailModal({ staff, onClose }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!staff?.id) return;
      setLoadingPerformance(true);
      try {
        const data = await staffService.getStaffPerformance(staff.id);
        setPerformanceData(data);
      } catch (error) {
        console.error('Failed to load performance data', error);
      } finally {
        setLoadingPerformance(false);
      }
    };

    loadPerformance();
  }, [staff?.id]);

  const getPermissionCategory = (permission) => {
    if (permission.includes('quote'))
      return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
    if (permission.includes('communication'))
      return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Mail };
    if (permission.includes('dealership'))
      return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle };
    if (permission.includes('notification'))
      return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Shield };
  };

  const permissionsContent = (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2 mb-3">
        <Shield size={16} className="text-[rgb(var(--color-primary))]" />
        Assigned Permissions
      </h4>

      {(staff.permissions || []).length === 0 ? (
        <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
          <Shield size={32} className="mx-auto mb-2 opacity-50" />
          <p>No permissions assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {(staff.permissions || []).map((permission, idx) => {
            const { color, icon: Icon } = getPermissionCategory(permission);
            const displayName = permission
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg border ${color} transition-all hover:shadow-sm`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="text-sm font-medium">{displayName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const performanceContent = (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-[rgb(var(--color-primary))]" />
        Performance Overview
      </h4>

      {loadingPerformance ? (
        <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
          <div className="w-8 h-8 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading performance data...</p>
        </div>
      ) : performanceData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
              Quotes Created
            </p>
            <p className="text-2xl font-bold text-blue-700">
              {performanceData.quotes_created || 0}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">
              Approval Rate
            </p>
            <p className="text-2xl font-bold text-green-700">
              {performanceData.approval_rate || 0}%
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">
              Revenue Generated
            </p>
            <p className="text-2xl font-bold text-purple-700">
              AED {(performanceData.revenue_generated || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
              Avg Response Time
            </p>
            <p className="text-2xl font-bold text-amber-700">
              {performanceData.avg_response_time || 'N/A'}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
          <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
          <p>No performance data available yet</p>
        </div>
      )}
    </div>
  );

  const activityContent = (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2 mb-3">
        <Activity size={16} className="text-[rgb(var(--color-primary))]" />
        Recent Activity
      </h4>

      <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
        <Activity size={32} className="mx-auto mb-2 opacity-50" />
        <p>Activity tracking coming soon</p>
        <p className="text-xs mt-1">View recent quotes, logins, and actions</p>
      </div>
    </div>
  );

  return (
    <DetailViewModal
      isOpen={true}
      onClose={onClose}
      title="Staff Member Details"
      data={{
        name: `${staff.first_name} ${staff.last_name}`,
        role: 'Dealer Staff',
        id: staff.id,
        status: staff.status,
        joinedDate: staff.created_at,
        ...staff,
      }}
      statusMap={{
        active: 'bg-green-100 text-green-700 border-green-200',
        inactive: 'bg-red-100 text-red-700 border-red-200',
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
      }}
      sections={[
        {
          title: 'Personal Information',
          icon: User,
          fields: [
            { label: 'Full Name', value: `${staff.first_name} ${staff.last_name}` },
            { label: 'Email Address', value: staff.email, copyable: true },
            {
              label: 'Status',
              value: staff.status?.charAt(0).toUpperCase() + staff.status?.slice(1),
            },
            {
              label: 'Joined Date',
              value: staff.created_at ? formatDate(staff.created_at) : 'N/A',
            },
            {
              label: 'Last Active',
              value: staff.last_login ? formatDateTime(staff.last_login) : 'Never',
            },
          ],
        },
      ]}
      tabs={[
        { key: 'permissions', label: 'Permissions', content: permissionsContent },
        { key: 'performance', label: 'Performance', content: performanceContent },
        { key: 'activity', label: 'Activity', content: activityContent },
      ]}
    />
  );
}
