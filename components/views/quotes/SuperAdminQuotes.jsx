'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  DollarSign,
  CheckCircle,
  Eye,
  Plus,
  Clock,
  X,
  Filter,
  Building2,
  MoreVertical,
  Trash2,
  Edit,
  Car,
} from 'lucide-react';
import StatCard from '../../common/StatCard';
import DataTable from '../../common/DataTable';
import { SkeletonTable } from '../../common/Skeleton';
import FilterDrawer from '../../common/FilterDrawer';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import dealershipService from '@/services/dealershipService';
import { useQuotes, useUpdateQuote, useDeleteQuote, useOverrideStatus } from '@/hooks/useQuotes';
import ActionMenuPortal from '@/components/common/ActionMenuPortal';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import TagFilter from '@/components/common/tags/TagFilter';
import TagList from '@/components/common/tags/TagList';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';
import PageHeader from '@/components/common/PageHeader';

export default function SuperAdminQuotes() {
  const { preferences } = usePreference();
  const router = useRouter();
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    minPrice: '',
    maxPrice: '',
    dateStart: '',
    dateEnd: '',
    dealershipId: '',
    tags: [],
  });
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
  const updateQuoteMutation = useUpdateQuote(); // Keep for generic edits if needed
  const overrideStatusMutation = useOverrideStatus(); // Use for status changes
  const deleteQuoteMutation = useDeleteQuote();

  const [dealershipOptions, setDealershipOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await dealershipService.getDealershipOptions();
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

    // Apply filters client-side
    if (filters.status) {
      list = list.filter(
        (q) => (q.status || 'pending').toLowerCase() === filters.status.toLowerCase()
      );
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

    if (filters.minPrice) {
      list = list.filter(
        (q) => parseNumeric(q.amount || q.quote_amount || q.price || 0) >= Number(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      list = list.filter(
        (q) => parseNumeric(q.amount || q.quote_amount || q.price || 0) <= Number(filters.maxPrice)
      );
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
        status: (q.status || 'pending').toLowerCase(),
        created_at: q.created_at || q.date || new Date().toISOString(),
        date: new Date(q.created_at || q.date || Date.now()).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
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
  }, [quotesData, filters]);

  const stats = React.useMemo(() => {
    const list = filteredQuotes;
    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(String(val).replace(/[^\d.]/g, '')) || 0;
    };
    const totalValue = list.reduce(
      (sum, q) => sum + (parseNumeric(q.amount || q.quote_amount || q.price) || 0),
      0
    );
    const pendingCount = list.filter((q) => (q.status || '').toLowerCase() === 'pending').length;
    const approvedCount = list.filter((q) => (q.status || '').toLowerCase() === 'approved').length;
    const conversionRate = list.length > 0 ? ((approvedCount / list.length) * 100).toFixed(1) : 0;

    return { totalValue, pendingCount, approvedCount, conversionRate };
  }, [filteredQuotes]);

  const handleApprove = async (quote) => {
    try {
      await overrideStatusMutation.mutateAsync({
        id: quote.id,
        status: 'approved',
        reason: 'Super Admin manual approval',
      });
      setOpenActionMenu(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = (quote) => {
    Swal.fire({
      title: 'Reject Quote?',
      text: 'Please provide a reason for rejection:',
      input: 'text',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-text-muted))',
      confirmButtonText: 'Yes, reject it!',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write a reason!';
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await overrideStatusMutation.mutateAsync({
            id: quote.id,
            status: 'rejected',
            reason: result.value,
          });
          setOpenActionMenu(null);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleStatusChange = async (quote, newStatus) => {
    try {
      const apiStatus = newStatus.toLowerCase();
      await overrideStatusMutation.mutateAsync({
        id: quote.id,
        status: apiStatus,
        reason: 'Manual status update via dashboard',
      });
      setOpenActionMenu(null);
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleBulkApprove = async () => {
    if (selectedQuoteIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Approve Selected Quotes?',
      text: `Are you sure you want to approve ${selectedQuoteIds.length} quotes?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-success))',
      confirmButtonText: 'Yes, approve all',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Approving...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await Promise.all(
          selectedQuoteIds.map((id) =>
            overrideStatusMutation.mutateAsync({
              id,
              status: 'approved',
              reason: 'Bulk approval',
            })
          )
        );

        setSelectedQuoteIds([]);
        Swal.fire('Approved!', 'Selected quotes have been approved.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to approve some quotes.', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuoteIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Delete Selected Quotes?',
      text: `This will permanently delete ${selectedQuoteIds.length} quotes. This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      confirmButtonText: 'Yes, delete all',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await Promise.all(selectedQuoteIds.map((id) => deleteQuoteMutation.mutateAsync(id)));

        setSelectedQuoteIds([]);
        Swal.fire('Deleted!', 'Selected quotes have been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete some quotes.', 'error');
      }
    }
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
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Global Quote Management"
        subtitle="Oversee and manage quotes across all dealerships"
        actions={
          <button
            onClick={() => router.push('/quotes/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl font-semibold shadow-lg shadow-[rgb(var(--color-primary))/0.3] hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Create New Quote</span>
            <span className="sm:hidden">Create</span>
          </button>
        }
        stats={[
          <StatCard
            key="total-value"
            title="Total Value"
            value={`$${Number(stats.totalValue || 0).toLocaleString()}`}
            icon={<DollarSign size={20} />}
            accent="rgb(var(--color-success))"
            helperText="Total Pipeline"
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
            key="conversion"
            title="Conversion"
            value={`${stats.conversionRate || 0}%`}
            icon={<FileText size={20} />}
            accent="rgb(var(--color-info))"
            helperText="Approval Rate"
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
              selectedIds={selectedQuoteIds}
              onSelectionChange={setSelectedQuoteIds}
              searchKeys={['customer_name', 'vehicle', 'dealershipName', 'vin', 'amount']}
              sortKeys={['date', 'price', 'status']}
              onFilterClick={() => setIsFilterOpen(true)}
              onClearFilters={clearFilters}
              showClearFilter={
                filters.status !== '' ||
                (filters.dateStart !== null && filters.dateStart !== '') ||
                (filters.dateEnd !== null && filters.dateEnd !== '') ||
                filters.minPrice !== '' ||
                filters.maxPrice !== '' ||
                filters.dealershipId !== '' ||
                (filters.tags && filters.tags.length > 0)
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
                        <span className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-wide bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                          ID: {row.dealershipId ? row.dealershipId.slice(-4) : '...'}
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
                  header: 'Tags',
                  accessor: (row) => <TagList tags={row.tags} limit={2} />,
                  className: 'min-w-[120px]',
                },
                {
                  header: 'Status',
                  type: 'badge',
                  sortable: true,
                  sortKey: 'status',
                  accessor: 'status',
                  config: {
                    green: ['approved', 'sold'],
                    orange: ['pending'],
                    red: ['rejected'],
                    gray: ['archived'],
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
              itemsPerPage={preferences.items_per_page || 10}
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
                    router.push(`/quotes/${row.id}`);
                    setOpenActionMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))]/5 hover:text-[rgb(var(--color-primary))] rounded-md transition-colors"
                >
                  <Eye size={14} /> View Details
                </button>

                <button
                  onClick={() => {
                    router.push(`/quotes/${row.id}?edit=true`);
                    setOpenActionMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))]/5 hover:text-[rgb(var(--color-primary))] rounded-md transition-colors"
                >
                  <Edit size={14} /> Edit Quote
                </button>

                {row.status !== 'approved' && (
                  <button
                    onClick={() => {
                      handleApprove(row);
                      setOpenActionMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-success))]/5 hover:text-[rgb(var(--color-success))] rounded-md transition-colors"
                  >
                    <CheckCircle size={14} /> Approve Quote
                  </button>
                )}

                {row.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleReject(row);
                      setOpenActionMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))]/5 hover:text-[rgb(var(--color-error))] rounded-md transition-colors"
                  >
                    <X size={14} /> Reject Quote
                  </button>
                )}

                {row.status !== 'pending' && (
                  <button
                    onClick={() => {
                      handleStatusChange(row, 'Pending');
                      setOpenActionMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-warning))]/5 hover:text-[rgb(var(--color-warning))] rounded-md transition-colors"
                  >
                    <Clock size={14} /> Mark as Pending
                  </button>
                )}

                <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>

                <button
                  onClick={() => {
                    handleDelete(row);
                    setOpenActionMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 rounded-md transition-colors"
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
            <select
              value={tempFilters.dealershipId}
              onChange={(e) =>
                setTempFilters((prev) => ({ ...prev, dealershipId: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
            >
              <option value="">All Dealerships</option>
              {dealershipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Status</h3>
            <select
              value={tempFilters.status}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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

          <div className="space-y-3">
            <TagFilter
              selectedTags={tempFilters.tags || []}
              onChange={(tags) => setTempFilters((prev) => ({ ...prev, tags }))}
              type="quote"
              options={React.useMemo(() => {
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
              }, [quotesData])}
            />
          </div>
        </div>
      </FilterDrawer>

      {selectedQuoteIds.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] p-4 md:p-6 z-50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between md:justify-center gap-4 md:gap-8 max-w-7xl mx-auto">
            <span className="text-base font-medium text-[rgb(var(--color-text))] whitespace-nowrap">
              <span className="font-bold text-[rgb(var(--color-primary))] text-lg">
                {selectedQuoteIds.length}
              </span>{' '}
              <span className="hidden sm:inline">quotes</span> selected
            </span>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 w-full md:w-auto">
              <button
                onClick={handleBulkApprove}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/20 transition-colors font-medium text-sm whitespace-nowrap"
                title="Approve Selected"
              >
                <CheckCircle size={18} /> Approve
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/20 transition-colors font-medium text-sm whitespace-nowrap"
                title="Delete Selected"
              >
                <Trash2 size={18} /> Delete
              </button>
              <button
                onClick={() => setSelectedQuoteIds([])}
                className="md:ml-2 text-sm text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:underline transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
