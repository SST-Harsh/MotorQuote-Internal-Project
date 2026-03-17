'use client';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import DataTable from '../../common/DataTable';
import { SkeletonTable } from '../../common/Skeleton';
import { useDealerships } from '@/hooks/useDealerships';
import { Building2, MapPin, Phone, User, Eye } from 'lucide-react';
import PageHeader from '../../common/PageHeader';
import { hasPermission, canViewDealership } from '@/utils/roleUtils';

export default function DealerDealerships() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const { data: dealerships, isLoading, error } = useDealerships();
  const canViewDealerDetails = user ? canViewDealership(user) : false;

  /**
   * Show only dealerships where:
   *   dealer_owner (Dealer Manager's user ID) === logged-in user's ID
   */
  const myDealerships = useMemo(() => {
    const all = Array.isArray(dealerships)
      ? dealerships
      : (dealerships?.dealerships ?? dealerships?.data?.dealerships ?? dealerships?.data ?? []);

    if (!user?.id) return [];

    return all
      .filter((d) => {
        const dealerId = String(d.id);
        const isOwner = String(d.dealer_owner ?? '') === String(user.id);
        const isPrimary = String(user.dealership_id ?? '') === dealerId;
        const isAssociated = user.dealerships?.some((ud) => String(ud.id) === dealerId);

        return isOwner || isPrimary || isAssociated;
      })
      .map((d) => ({
        ...d,
        status:
          d.status === 1 || d.status === true || d.status === 'Active' ? 'Active' : 'Inactive',
        location: d.location || [d.city, d.state].filter(Boolean).join(', ') || '—',
      }));
  }, [dealerships, user]);

  const canCreate = hasPermission(user, 'dealership.create');

  if (isLoading) return <SkeletonTable />;
  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dealerships"
        subtitle="View and manage your assigned dealerships."
        // icon={<Building2 size={24} />}
        actions={null}
      />

      <DataTable
        data={myDealerships}
        searchKeys={['name', 'status']}
        searchPlaceholder="Search dealerships by name..."
        // ─── Status filter dropdown ───────────────────────────────
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
        persistenceKey="dealer-dealerships"
        highlightId={highlightId}
        columns={[
          {
            header: 'Dealership',
            accessor: 'name',
            sortable: true,
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[rgb(var(--color-background-soft))] border border-[rgb(var(--color-border))] flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-[rgb(var(--color-text-muted))]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[rgb(var(--color-text))] truncate">{row.name}</div>
                  <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                    <MapPin size={11} />
                    <span className="truncate">{row.location}</span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            header: 'Contact',
            accessor: 'contact_email',
            sortable: true,
            render: (row) => (
              <div className="text-sm text-[rgb(var(--color-text-muted))]">
                <div>{row.contact_email || '—'}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone size={11} />
                  <span>{row.contact_phone || '—'}</span>
                </div>
              </div>
            ),
          },
          {
            header: 'Status',
            type: 'badge',
            accessor: 'status',
            sortable: true,
            config: { green: ['Active'], red: ['Inactive'] },
          },
          {
            header: 'Actions',
            className: 'text-right',
            accessor: (row) => (
              <div className="flex justify-start pr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canViewDealerDetails) {
                      router.push(`/dealerships/${row.id}`);
                    }
                  }}
                  disabled={!canViewDealerDetails}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))] hover:text-white border border-[rgb(var(--color-primary))/0.2] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
