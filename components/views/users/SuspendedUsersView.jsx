'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { RotateCcw, Users } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useSuspendedUsers, useRestoreUser } from '@/hooks/useUsers';

const getDisplayName = (u) => {
  if (u?.full_name) return u.full_name;
  if (u?.first_name || u?.last_name) return `${u?.first_name || ''} ${u?.last_name || ''}`.trim();
  if (u?.name) return u.name;
  if (u?.username) return u.username;
  return u?.email || 'User';
};

const getDisplayRole = (u) => {
  const rawRole =
    typeof u?.role === 'string'
      ? u.role
      : u?.role?.name || u?.role?.code || u?.role_name || u?.roleName || 'user';
  return String(rawRole)
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export default function SuspendedUsersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const { user } = useAuth();
  const [restoringId, setRestoringId] = useState(null);

  // Use React Query hooks for data fetching and mutations
  const {
    data: suspendedUsersData = [],
    isLoading,
    error,
    refetch,
  } = useSuspendedUsers({ limit: 1000 }, { enabled: user?.role === 'super_admin' });

  const restoreUserMutation = useRestoreUser();

  const suspendedUsers = useMemo(() => {
    console.log('SuspendedUsersView - Raw Data:', suspendedUsersData);
    const mapped = suspendedUsersData.map((u) => ({
      ...u,
      id: u.id,
      name: getDisplayName(u),
      email: u.email || u.user_email || '',
      role: getDisplayRole(u),
      status: 'Suspended',
      suspend_reason: u.suspend_reason || u.suspension_reason || '',
    }));
    console.log('SuspendedUsersView - Mapped Data:', mapped);
    return mapped;
  }, [suspendedUsersData]);

  const handleRestore = async (row) => {
    const confirm = await Swal.fire({
      title: 'Restore User?',
      text: `Restore ${row.name}? They will be able to log in again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Restore',
    });

    if (!confirm.isConfirmed) return;

    try {
      setRestoringId(row.id);
      await restoreUserMutation.mutateAsync(row.id);
    } catch (e) {
      Swal.fire('Error', e?.response?.data?.message || 'Failed to restore user.', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  if (!user) return null;

  if (user.role !== 'super_admin') {
    return <div className="p-8 text-center text-red-500">Access Denied: Super Admins only</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading suspended users: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suspended Users"
        subtitle="Review suspended accounts and restore access."
        // actions={
        //   <button
        //     onClick={() => refetch()}
        //     className="flex items-center gap-2 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-all shadow-sm"
        //   >
        //     <RotateCcw size={18} />
        //     <span>Refresh</span>
        //   </button>
        // }
      />

      {isLoading ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={8} />
        </div>
      ) : (
        <DataTable
          data={suspendedUsers}
          searchKeys={['name', 'email', 'role']}
          searchPlaceholder="Search suspended users by name, email, or role..."
          persistenceKey="suspended-users"
          highlightId={highlightId}
          itemsPerPage={10}
          onRowClick={(row) => router.push(`/users/${row.id}`)}
          columns={[
            { header: 'Full Name', accessor: 'name', sortable: true, className: 'font-bold' },
            {
              header: 'Email Address',
              accessor: 'email',
              sortable: true,
              className: 'text-[rgb(var(--color-text-muted))]',
            },
            {
              header: 'Primary Role',
              type: 'badge',
              accessor: 'role',
              sortable: true,
              config: {
                blue: ['Dealer Manager', 'Manager'],
                orange: ['Staff', 'Support Staff'],
                gray: ['User'],
              },
            },
            {
              header: 'Status',
              type: 'badge',
              accessor: 'status',
              config: { red: ['Suspended'] },
            },
            {
              header: 'Suspension Reason',
              accessor: 'suspend_reason',
              className: 'text-sm text-[rgb(var(--color-text-muted))] max-w-[200px] truncate',
            },
            {
              header: 'Actions',
              className: 'text-center',
              accessor: (row) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(row);
                  }}
                  disabled={restoringId === row.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Restore user"
                >
                  <Users size={14} />
                  {restoringId === row.id ? 'Restoring...' : 'Restore'}
                </button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
