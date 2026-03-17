'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Building2,
  Car,
  Filter,
  X,
  Search,
  DollarSign,
  Calendar,
} from 'lucide-react';
import DataTable from '../../common/DataTable';
import { SkeletonTable } from '../../common/Skeleton';
import StatCard from '../../common/StatCard';
import PageHeader from '../../common/PageHeader';
import FilterDrawer from '../../common/FilterDrawer';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import CustomSelect from '@/components/common/CustomSelect';
import { useQuotes } from '@/hooks/useQuotes';
import { usePreference } from '@/context/PreferenceContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/i18n';
import dayjs from 'dayjs';

export default function SupportStaffQuotes() {
  const SUPPORT_STAFF_QUOTES_FILTERS_KEY = 'support_staff_quotes_filters';
  const SUPPORT_STAFF_QUOTES_SEARCH_KEY = 'support_staff_quotes_search';

  const { preferences } = usePreference();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const pathname = usePathname();

  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(SUPPORT_STAFF_QUOTES_SEARCH_KEY) || '';
    }
    return '';
  });

  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      status: '',
      minPrice: '',
      maxPrice: '',
      dateStart: null,
      dateEnd: null,
      dealershipId: '',
    };
    try {
      if (typeof window !== 'undefined' && isRefresh) {
        const saved = sessionStorage.getItem(SUPPORT_STAFF_QUOTES_FILTERS_KEY);
        return saved ? JSON.parse(saved) : defaultFilters;
      }
      return defaultFilters;
    } catch (_) {
      return defaultFilters;
    }
  });

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SUPPORT_STAFF_QUOTES_FILTERS_KEY, JSON.stringify(filters));
    sessionStorage.setItem(SUPPORT_STAFF_QUOTES_SEARCH_KEY, searchTerm);
    sessionStorage.setItem('app_last_path', pathname);
  }, [filters, searchTerm, pathname]);

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);

  const clearFilters = () => {
    const cleared = {
      status: '',
      dateStart: null,
      dateEnd: null,
      minPrice: '',
      maxPrice: '',
      dealershipId: '',
    };
    setFilters(cleared);
    setTempFilters(cleared);
    setSearchTerm('');
  };

  const handleRemoveFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'dateRange') {
        next.dateStart = null;
        next.dateEnd = null;
      } else if (key === 'priceRange') {
        next.minPrice = '';
        next.maxPrice = '';
      } else {
        next[key] = '';
      }
      return next;
    });
  };

  const userDealershipId = user?.dealership_id || user?.dealership?.id;

  const params = useMemo(() => ({ _useDealerEndpoint: false }), []);
  const { data: quotesData = [], isLoading } = useQuotes(params);

  // 1. Initial base list by dealership (Security/Context)
  const baseQuotes = useMemo(() => {
    let list = Array.isArray(quotesData) ? quotesData : quotesData.quotes || [];
    if (userDealershipId) {
      return list.filter((q) => {
        const qDealershipId = q.dealership_id ?? q.dealershipId ?? q.dealership?.id;
        return String(qDealershipId) === String(userDealershipId);
      });
    }
    return list;
  }, [quotesData, userDealershipId]);

  // 2. Comprehensive client-side filtering
  const filteredQuotes = useMemo(() => {
    let list = [...baseQuotes];

    // Search text
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter((q) => {
        const customer = (q.customer_name || q.clientName || '').toLowerCase();
        const vi = q.vehicle_info || q.vehicle_details || {};
        const vehicle = `${vi.year || ''} ${vi.make || ''} ${vi.model || ''}`.toLowerCase();
        const amount = String(q.amount || q.quote_amount || q.price || '').toLowerCase();
        const dealership = (q.dealership?.name || q.dealership_name || '').toLowerCase();
        const vin = (q.vin || '').toLowerCase();

        return (
          customer.includes(lowerSearch) ||
          vehicle.includes(lowerSearch) ||
          amount.includes(lowerSearch) ||
          dealership.includes(lowerSearch) ||
          vin.includes(lowerSearch)
        );
      });
    }

    // Status filter
    if (filters.status) {
      list = list.filter((q) => {
        const qStatus = (q.status || 'pending').toLowerCase();
        const fStatus = filters.status.toLowerCase();
        if (fStatus === 'sold_out') {
          return ['sold', 'converted', 'sold_out'].includes(qStatus);
        }
        return qStatus === fStatus;
      });
    }

    // Date range
    if (filters.dateStart) {
      const start = dayjs(filters.dateStart).startOf('day');
      list = list.filter(
        (q) =>
          dayjs(q.created_at || q.date).isAfter(start) ||
          dayjs(q.created_at || q.date).isSame(start)
      );
    }
    if (filters.dateEnd) {
      const end = dayjs(filters.dateEnd).endOf('day');
      list = list.filter(
        (q) =>
          dayjs(q.created_at || q.date).isBefore(end) || dayjs(q.created_at || q.date).isSame(end)
      );
    }

    // Price range
    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(String(val).replace(/[^\d.]/g, '')) || 0;
    };

    if (filters.minPrice !== '') {
      const minVal = Number(filters.minPrice);
      list = list.filter((q) => parseNumeric(q.amount || q.quote_amount || q.price) >= minVal);
    }
    if (filters.maxPrice !== '') {
      const maxVal = Number(filters.maxPrice);
      list = list.filter((q) => parseNumeric(q.amount || q.quote_amount || q.price) <= maxVal);
    }

    // Specific dealership from filter
    if (filters.dealershipId) {
      list = list.filter((q) => {
        const qDealershipId = q.dealership_id ?? q.dealershipId ?? q.dealership?.id;
        return String(qDealershipId) === String(filters.dealershipId);
      });
    }

    return list.map((q) => {
      const vi = q.vehicle_info || q.vehicle_details || {};
      const amt = parseNumeric(q.amount || q.quote_amount || q.price || 0);
      return {
        ...q,
        id: q.id,
        customer_name: q.customer_name || q.clientName || 'Unknown',
        vehicle_info: vi,
        vehicle: `${vi.year || ''} ${vi.make || ''} ${vi.model || ''}`.trim() || 'N/A',
        amount: amt,
        status: (q.status || 'pending').toLowerCase(),
        date: q.created_at || q.date || new Date().toISOString(),
        dealershipName: q.dealership?.name || q.dealership_name || 'Unknown',
      };
    });
  }, [baseQuotes, filters, searchTerm]);

  const stats = useMemo(() => {
    const fullList = baseQuotes;
    const activeStatuses = ['pending', 'approved', 'sold', 'sold_out', 'converted', ''];

    const parseAmount = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(String(val).replace(/[^\d.]/g, '')) || 0;
    };

    const totalValue = fullList.reduce((sum, q) => {
      const status = (q.status || '').toLowerCase();
      if (!activeStatuses.includes(status)) return sum;
      return sum + (parseAmount(q.amount || q.quote_amount || q.price) || 0);
    }, 0);

    const pendingCount = fullList.filter(
      (q) => (q.status || '').toLowerCase() === 'pending'
    ).length;
    const approvedCount = fullList.filter(
      (q) => (q.status || '').toLowerCase() === 'approved'
    ).length;
    const soldCount = fullList.filter((q) =>
      ['sold', 'sold_out', 'converted', ''].includes((q.status || '').toLowerCase())
    ).length;
    const rejectedCount = fullList.filter(
      (q) => (q.status || '').toLowerCase() === 'rejected'
    ).length;

    return { totalValue, pendingCount, approvedCount, soldCount, rejectedCount };
  }, [baseQuotes]);

  if (isLoading && !isRefresh)
    return (
      <div className="p-8">
        <SkeletonTable rows={8} columns={5} />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Quote Management"
        subtitle="View-only overview of all submitted quotes"
        badge={{ label: 'Read Only', color: 'amber' }}
        stats={[
          <StatCard
            key="total-value"
            title="Total Value"
            value={`$${Math.round(stats.totalValue || 0).toLocaleString()}`}
            icon={<DollarSign size={20} />}
            accent="rgb(var(--color-success))"
            helperText="Potential revenue"
          />,
          <StatCard
            key="pending"
            title="Pending"
            value={stats.pendingCount || 0}
            icon={<Clock size={20} />}
            accent="rgb(var(--color-warning))"
            helperText="Awaiting approval"
          />,
          <StatCard
            key="approved"
            title="Approved"
            value={stats.approvedCount || 0}
            icon={<CheckCircle size={20} />}
            accent="rgb(var(--color-primary))"
            helperText="Ready for sale"
          />,
          <StatCard
            key="sold"
            title="Sold Out"
            value={stats.soldCount || 0}
            icon={<CheckCircle size={20} />}
            accent="rgb(var(--color-success))"
            helperText="Completed quotes"
          />,
          <StatCard
            key="rejected"
            title="Rejected"
            value={stats.rejectedCount || 0}
            icon={<X size={20} />}
            accent="rgb(var(--color-error))"
            helperText="Lost opportunities"
          />,
        ]}
      />

      <DataTable
        data={filteredQuotes}
        itemsPerPage={preferences.items_per_page || 10}
        persistenceKey="support-staff-quotes"
        highlightId={highlightId}
        searchKeys={['customer_name', 'vehicle', 'dealershipName', 'vin', 'amount']}
        searchPlaceholder="Search quotes by customer, vehicle, or dealership..."
        manualFiltering={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setIsFilterOpen(true)}
        onClearFilters={clearFilters}
        onRemoveExternalFilter={handleRemoveFilter}
        hideFilterDropdowns={true}
        externalFilters={{
          status: filters.status,
          dateRange:
            filters.dateStart || filters.dateEnd
              ? `${filters.dateStart ? formatDate(filters.dateStart) : ''} - ${filters.dateEnd ? formatDate(filters.dateEnd) : ''}`
              : '',
          priceRange:
            filters.minPrice || filters.maxPrice
              ? `${filters.minPrice ? `$${filters.minPrice}` : ''} - ${filters.maxPrice ? `$${filters.maxPrice}` : ''}`
              : '',
          dealershipId: filters.dealershipId,
        }}
        filterOptions={[
          {
            key: 'dealershipId',
            label: 'Dealership',
            options: (user?.dealerships || []).map((d) => ({ label: d.name, value: d.id })),
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'sold_out', label: 'Sold Out' },
            ],
          },
        ]}
        showClearFilter={
          filters.status !== '' ||
          (filters.dateStart !== null && filters.dateStart !== '') ||
          (filters.dateEnd !== null && filters.dateEnd !== '') ||
          filters.minPrice !== '' ||
          filters.maxPrice !== '' ||
          filters.dealershipId !== ''
        }
        columns={[
          {
            header: 'Dealership',
            sortable: true,
            sortKey: 'dealershipName',
            accessor: (row) => (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))]">
                  <Building2 size={16} />
                </div>
                <span className="font-semibold text-[rgb(var(--color-text))] text-sm">
                  {row.dealershipName}
                </span>
              </div>
            ),
          },
          {
            header: 'Client',
            type: 'avatar',
            sortable: true,
            sortKey: 'customer_name',
            config: (row) => ({
              name: row.customer_name,
              subtext: row.date ? formatDate(row.date) : 'N/A',
            }),
          },
          {
            header: 'Vehicle',
            sortable: true,
            sortKey: 'vehicle_info.make',
            accessor: (row) => (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))] text-gray-500">
                  <Car size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[rgb(var(--color-text))] text-sm">
                    {row.vehicle}
                  </span>
                  {row.vin && (
                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-wide bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                      VIN: {row.vin}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            header: 'Amount',
            type: 'currency',
            sortable: true,
            sortKey: 'amount',
            accessor: 'amount',
          },
          {
            header: 'Status',
            type: 'badge',
            sortable: true,
            sortKey: 'status',
            accessor: 'status',
            config: {
              green: ['approved', 'sold', 'converted', 'sold_out'],
              orange: ['pending'],
              red: ['rejected'],
            },
          },
          {
            header: 'Action',
            className: 'text-center',
            headerClassName: 'text-center',
            accessor: (row) => (
              <div className="flex justify-center">
                <button
                  onClick={() => router.push(`/quotes/${row.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 transition-colors"
                >
                  <Eye size={13} /> View
                </button>
              </div>
            ),
          },
        ]}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() =>
          setTempFilters({
            status: '',
            minPrice: '',
            maxPrice: '',
            dateStart: null,
            dateEnd: null,
            dealershipId: '',
          })
        }
        onApply={() => {
          setFilters(tempFilters);
          setIsFilterOpen(false);
        }}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Dealership</h3>
            <CustomSelect
              value={tempFilters.dealershipId || ''}
              onChange={(e) =>
                setTempFilters((prev) => ({ ...prev, dealershipId: e.target.value }))
              }
              options={[
                { value: '', label: 'All Dealerships' },
                ...(user?.dealerships || [])
                  .filter((d) => (d.id || d.value) && (d.name || d.label))
                  .map((d) => ({
                    value: String(d.id || d.value),
                    label: String(d.name || d.label).trim(),
                  })),
              ]}
              placeholder="All Dealerships"
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Status</h3>
            <CustomSelect
              value={tempFilters.status}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
              options={[
                { value: '', label: 'Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'sold_out', label: 'Sold Out' },
              ]}
              placeholder="Status"
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Price Range</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={tempFilters.minPrice}
                  onChange={(e) =>
                    setTempFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                  }
                  className="w-full pl-7 pr-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
                />
              </div>
              <span className="text-[rgb(var(--color-text-muted))]">-</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempFilters.maxPrice}
                  onChange={(e) =>
                    setTempFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                  }
                  className="w-full pl-7 pr-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Date Range</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-[rgb(var(--color-text-muted))] font-medium">
                  Start Date
                </label>
                <CustomDateTimePicker
                  value={tempFilters.dateStart}
                  onChange={(val) => setTempFilters((prev) => ({ ...prev, dateStart: val }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[rgb(var(--color-text-muted))] font-medium">
                  End Date
                </label>
                <CustomDateTimePicker
                  value={tempFilters.dateEnd}
                  onChange={(val) => setTempFilters((prev) => ({ ...prev, dateEnd: val }))}
                />
              </div>
            </div>
          </div>
        </div>
      </FilterDrawer>
    </div>
  );
}
