'use client';
import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Eye, Search } from 'lucide-react';
import DataTable from '../../common/DataTable';
import { SkeletonTable } from '../../common/Skeleton';
import PageHeader from '../../common/PageHeader';
import { useUsers } from '@/hooks/useUsers';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

export default function SupportStaffUsers() {
  const { preferences } = usePreference();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');

  const { data: usersData, isLoading } = useUsers({});

  const users = useMemo(() => {
    const list = Array.isArray(usersData)
      ? usersData
      : usersData?.users || usersData?.data?.users || usersData?.data || [];
    // Support staff can only look up sellers (role === 'seller')
    return list.filter((u) => (u.role || '').toLowerCase() === 'seller');
  }, [usersData]);

  if (isLoading)
    return (
      <div className="p-8">
        <SkeletonTable rows={8} columns={5} />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="User Lookup"
        subtitle="Search and view user account details — read-only access"
        badge={{ label: 'Read Only', color: 'amber' }}
      />

      <DataTable
        data={users}
        searchKeys={['name', 'email']}
        searchPlaceholder="Search users by name or email..."
        persistenceKey="support-staff-users"
        highlightId={highlightId}
        itemsPerPage={preferences.items_per_page || 10}
        columns={[
          {
            header: 'User',
            type: 'avatar',
            sortable: true,
            sortKey: 'first_name',
            config: (row) => ({
              name:
                row.full_name ||
                `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
                row.username ||
                row.email,
              subtext: row.email,
              image: row.profile_picture || row.avatar,
            }),
          },
          {
            header: 'Role',
            accessor: (row) => {
              const role = row.role || row.role_name || 'user';
              return (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]">
                  {role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              );
            },
          },
          {
            header: 'Status',
            type: 'badge',
            sortable: false,
            accessor: (row) => (row.is_active !== false ? 'active' : 'inactive'),
            config: {
              green: ['active'],
              red: ['inactive', 'suspended'],
            },
          },
          {
            header: 'Joined',
            sortable: true,
            sortKey: 'created_at',
            accessor: (row) => (
              <span className="text-sm text-[rgb(var(--color-text-muted))]">
                {row.created_at ? formatDate(row.created_at) : '—'}
              </span>
            ),
          },
          {
            header: 'Action',
            className: 'text-center',
            headerClassName: 'text-center',
            accessor: (row) => (
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/users/${row.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 transition-colors"
                >
                  <Eye size={13} /> View
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
