'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  FileText,
  DollarSign,
  CheckCircle,
  Eye,
  Clock,
  X,
  Filter,
  Building2,
  MoreVertical,
  Trash2,
  Car,
} from 'lucide-react';
import StatCard from '../../common/StatCard';
import DataTable from '../../common/DataTable';
import { SkeletonTable } from '../../common/Skeleton';
import FilterDrawer from '../../common/FilterDrawer';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import dealershipService from '@/services/dealershipService';
import { useQuotes, useDeleteQuote, useOverrideStatus } from '@/hooks/useQuotes';
import CustomSelect from '@/components/common/CustomSelect';
import ActionMenuPortal from '@/components/common/ActionMenuPortal';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import TagFilter from '@/components/common/tags/TagFilter';
import TagList from '@/components/common/tags/TagList';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { canDelete, canEditQuote, canViewQuote } from '@/utils/roleUtils';

export default function SuperAdminQuotes() {
  const { preferences } = usePreference();
  const router = useRouter();
  const { user } = useAuth();
  const canView = canViewQuote(user);
  const canEdit = canEditQuote(user);
  const canDeleteVal = canDelete(user, 'quotes');
  const searchParams = useSearchParams();

  // Read from URL once, then store in local state so it can be cleared
  const initialHighlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const [localHighlightId, setLocalHighlightId] = useState(initialHighlightId);

  // Clear local highlight after duration matches DataTable
  useEffect(() => {
    if (localHighlightId) {
      const timer = setTimeout(() => {
        setLocalHighlightId(null);
      }, 3000); // slightly longer than DataTable's animation to ensure it clears
      return () => clearTimeout(timer);
    }
  }, [localHighlightId]);

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const pathname = usePathname();
  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      status: '',
      minPrice: '',
      maxPrice: '',
      dateStart: '',
      dateEnd: '',
      dealershipId: '',
      tags: [],
    };
    try {
      if (typeof window !== 'undefined' && isRefresh) {
        const saved = sessionStorage.getItem('super_admin_quotes_filters');
        return saved ? JSON.parse(saved) : defaultFilters;
      }
      return defaultFilters;
    } catch (_) {
      return defaultFilters;
    }
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem('super_admin_quotes_search') || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('super_admin_quotes_filters', JSON.stringify(filters));
    sessionStorage.setItem('super_admin_quotes_search', searchTerm);
    sessionStorage.setItem('app_last_path', pathname);
  }, [filters, searchTerm, pathname]);

  const [recentlyChangedIds, setRecentlyChangedIds] = useState(new Set());
  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);
  const params = React.useMemo(
    () => ({
      _useDealerEndpoint: false,
    }),
    []
  );

  const { data: quotesData = [], isLoading, isFetching } = useQuotes(params);
  const overrideStatusMutation = useOverrideStatus();
  const deleteQuoteMutation = useDeleteQuote();

  const handleRemoveFilter = (key) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (key === 'tags') next.tags = [];
      else if (key === 'dateRange') {
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

  const [dealershipOptions, setDealershipOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await dealershipService.getDealershipOptions(true);
        setDealershipOptions(options);
      } catch (error) {
        console.error('Failed to fetch dealerships', error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredQuotes = React.useMemo(() => {
    let list = Array.isArray(quotesData) ? quotesData : quotesData.quotes || [];

    // 1. Search Text (Manual override for ID search)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const cleanSearch = lowerSearch.replace(/^#/, '').trim();

      list = list.filter((q) => {
        const customer = (q.customer_name || q.clientName || '').toLowerCase();
        const vehicleInfo = q.vehicle_info || q.vehicle_details || {};
        const vehicle = (
          q.vehicle ||
          `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`
        ).toLowerCase();
        const amount = (q.amount || q.quote_amount || q.price || '').toString();
        const dealership = (q.dealership?.name || q.dealershipName || '').toLowerCase();

        // Quote ID Search Logic
        const fullId = (q.id || '').toString().toLowerCase();
        const shortId = fullId.split('-')[0];

        return (
          customer.includes(lowerSearch) ||
          vehicle.includes(lowerSearch) ||
          amount.includes(lowerSearch) ||
          dealership.includes(lowerSearch) ||
          (cleanSearch && (fullId.includes(cleanSearch) || shortId.includes(cleanSearch)))
        );
      });
    }

    // 2. Apply filters client-side
    if (filters.status) {
      list = list.filter((q) => {
        const quoteStatus =
          q.status === 'converted' || q.status === 'sold' || q.status === ''
            ? 'sold_out'
            : (q.status || 'pending').toLowerCase();
        const filterStatus = filters.status.toLowerCase();
        if (quoteStatus === filterStatus) return true;
        if (
          filterStatus === 'sold_out' &&
          (quoteStatus === 'converted' ||
            quoteStatus === 'sold' ||
            quoteStatus === 'sold_out' ||
            quoteStatus === '')
        )
          return true;

        // If the item was recently changed, KEEP it in the UI
        if (recentlyChangedIds.has(q.id)) return true;

        return false;
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      list = list.filter((q) => {
        const itemTags = (q.tags || []).map((t) => t.id || t);
        return filters.tags.some((tagId) => itemTags.includes(tagId));
      });
    }

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

    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(String(val).replace(/[^\d.]/g, '')) || 0;
    };

    if (filters.minPrice !== '' && filters.minPrice !== null) {
      const minVal = Number(filters.minPrice);
      list = list.filter((q) => {
        const val = parseNumeric(q.amount || q.quote_amount || q.price);
        return val >= minVal;
      });
    }

    if (filters.maxPrice !== '' && filters.maxPrice !== null) {
      const maxVal = Number(filters.maxPrice);
      list = list.filter((q) => {
        const val = parseNumeric(q.amount || q.quote_amount || q.price);
        return val <= maxVal;
      });
    }

    if (filters.dealershipId) {
      list = list.filter(
        (q) => q.dealership_id === filters.dealershipId || q.dealership?.id === filters.dealershipId
      );
    }

    const mapped = list.map((q) => {
      const vehicle_info = q.vehicle_info || q.vehicle_details || {};
      const amountVal = parseNumeric(q.amount || q.quote_amount || q.price || 0);
      return {
        ...q,
        id: q.id,
        customer_name: q.customer_name || q.clientName || 'Unknown',
        vehicle_info: vehicle_info,
        amount: amountVal,
        status:
          q.status === 'converted' || q.status === 'sold' || q.status === ''
            ? 'sold_out'
            : (q.status || 'pending').toLowerCase(),
        date: q.created_at || q.date || new Date().toISOString(),
        clientName: q.customer_name || q.clientName || 'Unknown',
        vehicle:
          `${vehicle_info.year || ''} ${vehicle_info.make || ''} ${vehicle_info.model || ''}`.trim() ||
          'N/A',
        price: amountVal,
        dealershipName: q.dealership?.name || q.dealership_name || 'Unknown Dealership',
        dealershipId: (q.dealership?.id || q.dealership_id || q.dealership || '').toString(),
      };
    });

    return mapped;
  }, [quotesData, filters, recentlyChangedIds, searchTerm]);

  const discoveredTags = React.useMemo(() => {
    const list = Array.isArray(quotesData) ? quotesData : quotesData.quotes || [];
    const tagsMap = new Map();
    list.forEach((q) => {
      (q.tags || []).forEach((tag) => {
        const id = tag.id || tag;
        if (id) {
          tagsMap.set(id, typeof tag === 'object' ? tag : { id, name: id });
        }
      });
    });
    return Array.from(tagsMap.values());
  }, [quotesData]);

  const stats = useMemo(() => {
    const fullList = Array.isArray(quotesData) ? quotesData : quotesData.quotes || [];
    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(String(val).replace(/[^\d.]/g, '')) || 0;
    };
    const activeStatuses = ['pending', 'approved', 'sold', 'sold_out', 'converted', ''];
    const totalValue = fullList.reduce((sum, q) => {
      const status = (q.status || '').toLowerCase();
      if (!activeStatuses.includes(status)) return sum;
      return sum + (parseNumeric(q.amount || q.quote_amount || q.price) || 0);
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
  }, [quotesData]);

  const handleDelete = (quote) => {
    Swal.fire({
      title: 'Delete Quote?',
      text: "This will permanently delete the quote. You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-text-muted))',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteQuoteMutation.mutateAsync(quote.id);
          setOpenActionMenu(null);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const clearFilters = () => {
    const initialFilters = {
      status: '',
      dateStart: '',
      dateEnd: '',
      minPrice: '',
      maxPrice: '',
      dealershipId: '',
      tags: [],
    };
    setFilters(initialFilters);
    setTempFilters(initialFilters);
    setSearchTerm('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Global Quote Management"
        subtitle="Oversee and manage quotes across all dealerships"
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
            helperText="Requires Action"
          />,
          <StatCard
            key="approved"
            title="Approved"
            value={stats.approvedCount || 0}
            icon={<CheckCircle size={20} />}
            accent="rgb(var(--color-primary))"
            helperText="Ready for Sale"
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

      <div className="relative">
        <div className="p-0">
          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-x-0 top-0 h-1 bg-[rgb(var(--color-primary))/0.2] overflow-hidden z-10">
                <div className="h-full bg-[rgb(var(--color-primary))] animate-progress-buffer w-1/3"></div>
              </div>
            )}
            <DataTable
              data={filteredQuotes}
              manualFiltering={true}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search quotes by customer, vehicle, dealership, or quote ID..."
              sortKeys={['date', 'price', 'status']}
              onFilterClick={() => setIsFilterOpen(true)}
              onClearFilters={clearFilters}
              onRemoveExternalFilter={handleRemoveFilter}
              hideFilterDropdowns={true}
              externalFilters={{
                dealershipId: filters.dealershipId,
                status: filters.status,
                dateRange:
                  filters.dateStart || filters.dateEnd
                    ? `${filters.dateStart ? dayjs(filters.dateStart).format('MMM D') : ''} - ${filters.dateEnd ? dayjs(filters.dateEnd).format('MMM D') : ''}`
                    : '',
                priceRange:
                  filters.minPrice || filters.maxPrice
                    ? `${filters.minPrice ? `$${filters.minPrice}` : ''} - ${filters.maxPrice ? `$${filters.maxPrice}` : ''}`
                    : '',
                tags: filters.tags,
              }}
              filterOptions={[
                { key: 'dealershipId', label: 'Dealership', options: dealershipOptions },
                {
                  key: 'status',
                  label: 'Status',
                  options: [
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                    { value: 'archived', label: 'Archived' },
                    { value: 'sold_out', label: 'Sold Out' },
                  ],
                },
                {
                  key: 'tags',
                  label: 'Tags',
                  options: discoveredTags.map((t) => ({
                    label: t.name || t.id,
                    value: t.id,
                  })),
                },
              ]}
              showClearFilter={
                filters.status !== '' ||
                (filters.dateStart !== null && filters.dateStart !== '') ||
                (filters.dateEnd !== null && filters.dateEnd !== '') ||
                filters.minPrice !== '' ||
                filters.maxPrice !== '' ||
                (filters.tags && filters.tags.length > 0) ||
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
                      <div className="flex flex-col">
                        <span className="font-semibold text-[rgb(var(--color-text))] text-sm">
                          {row.dealershipName}
                        </span>
                      </div>
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
                    subtext: row.created_at ? formatDate(row.created_at) : 'N/A',
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
                          {row.vehicle_info
                            ? `${row.vehicle_info.year} ${row.vehicle_info.make} ${row.vehicle_info.model}`
                            : 'N/A'}
                        </span>
                        {/* {row.vin && (
                                                    <span className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-wide bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                                                        VIN: {row.vin}
                                                    </span>
                                                )} */}
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
                // {
                //     header: 'Tags',
                //     accessor: (row) => <TagList tags={row.tags} limit={2} />,
                //     className: 'min-w-[120px]'
                // },
                {
                  header: 'Status',
                  type: 'badge',
                  sortable: true,
                  sortKey: 'status',
                  accessor: 'status',
                  config: {
                    green: ['approved'],
                    orange: ['pending'],
                    red: ['rejected'],
                    purple: ['sold', 'sold_out'],
                    gray: ['expired'],
                  },
                },
                {
                  header: 'Actions',
                  className: 'text-center',
                  headerClassName: 'text-center',
                  accessor: (row) => (
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Convert DOMRect to plain object to ensure properties are preserved in state
                          const domRect = e.currentTarget.getBoundingClientRect();
                          const rect = {
                            top: domRect.top,
                            bottom: domRect.bottom,
                            left: domRect.left,
                            right: domRect.right,
                            width: domRect.width,
                            height: domRect.height,
                            mouseX: e.clientX,
                            mouseY: e.clientY,
                          };

                          // Manual positioning with overflow handling
                          // w-48 is 192px. Align right edge of menu with right edge of trigger.
                          let position = { top: rect.bottom + 4, left: rect.right - 192 };

                          // Check if menu fits below (assuming ~250px height)
                          const spaceBelow = window.innerHeight - rect.bottom;
                          if (spaceBelow < 250) {
                            // Flip to top - Anchor to bottom of menu to top of button
                            const bottom = window.innerHeight - rect.top + 4;
                            position = { bottom, left: rect.right - 192 };
                          }

                          if (openActionMenu?.id === row.id) {
                            setOpenActionMenu(null);
                          } else {
                            setOpenActionMenu({
                              id: row.id,
                              position,
                              align: 'end',
                            });
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))]'}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              highlightId={localHighlightId}
              itemsPerPage={preferences.items_per_page || 10}
              persistenceKey="super-admin-quotes"
            />
          </div>
        </div>
      </div>

      {openActionMenu && (
        <ActionMenuPortal
          isOpen={!!openActionMenu}
          onClose={() => setOpenActionMenu(null)}
          position={openActionMenu.position}
          align={openActionMenu.align}
        >
          {(() => {
            const row = filteredQuotes.find((q) => q.id === openActionMenu.id);
            if (!row) return null;

            return (
              <>
                <button
                  onClick={() => {
                    if (canView) {
                      router.push(`/quotes/${row.id}`);
                      setOpenActionMenu(null);
                    }
                  }}
                  disabled={!canView}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md ${
                    canView
                      ? 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))]/5 hover:text-[rgb(var(--color-primary))]'
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={
                    canView ? 'View Details' : "You don't have permission to view quote details."
                  }
                >
                  <Eye size={14} /> View Details
                </button>

                <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>

                <button
                  onClick={() => canDeleteVal && handleDelete(row)}
                  disabled={!canDeleteVal}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md ${
                    canDeleteVal
                      ? 'text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5'
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            );
          })()}
        </ActionMenuPortal>
      )}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() =>
          setTempFilters({
            status: '',
            minPrice: '',
            maxPrice: '',
            dateStart: '',
            dateEnd: '',
            dealershipId: '',
            tags: [],
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
              value={tempFilters.dealershipId}
              onChange={(e) =>
                setTempFilters((prev) => ({ ...prev, dealershipId: e.target.value }))
              }
              options={[
                { value: '', label: 'All Dealerships' },
                ...(Array.isArray(dealershipOptions)
                  ? dealershipOptions
                      .filter((d) => (d.value || d.id) && (d.label || d.name))
                      .map((d) => ({
                        value: String(d.value || d.id),
                        label: String(d.label || d.name).trim(),
                      }))
                  : []),
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
                { value: 'sold_out', label: 'Sold Out' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'expired', label: 'Expired' },
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

          {/* <div className="space-y-3">
                        <TagFilter
                            selectedTags={tempFilters.tags || []}
                            onChange={(tags) => setTempFilters(prev => ({ ...prev, tags }))}
                            type="quote"
                            options={discoveredTags}
                        />
                    </div> */}
        </div>
      </FilterDrawer>
    </div>
  );
}
