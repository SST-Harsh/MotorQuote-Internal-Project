'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileText,
  DollarSign,
  CheckCircle,
  Eye,
  Plus,
  Search,
  Calendar,
  Car,
  Archive,
  Clock,
  X,
  Filter,
  MoreVertical,
  Edit,
  RotateCcw,
} from 'lucide-react';
import StatCard from '../../common/StatCard';
import DataTable from '../../common/DataTable';
import FilterDrawer from '../../common/FilterDrawer';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import quoteService from '@/services/quoteService';
import ActionMenuPortal from '@/components/common/ActionMenuPortal';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import TagList from '@/components/common/tags/TagList';
import TagFilter from '@/components/common/tags/TagFilter';
import PageHeader from '@/components/common/PageHeader';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

import { useQuotes, useDeleteQuote, useUpdateQuote } from '@/hooks/useQuotes';

export default function DealerQuote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { preferences } = usePreference();
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    minPrice: '',
    maxPrice: '',
    dateStart: '',
    dateEnd: '',
    tags: [],
  });

  // Temporary filters for the drawer (not applied until "Apply" is clicked)
  const [tempFilters, setTempFilters] = useState(filters);

  const clearFilters = () => {
    setFilters({
      status: '',
      dateStart: null,
      dateEnd: null,
      minPrice: '',
      maxPrice: '',
      tags: [],
    });
    setTempFilters({
      status: '',
      dateStart: null,
      dateEnd: null,
      minPrice: '',
      maxPrice: '',
      tags: [],
    });
  };

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(filters);
    }
  }, [isFilterOpen, filters]);

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Pass _useDealerEndpoint: true to force dealer endpoint
  const params = useMemo(
    () => ({
      status: filters.status || undefined,
      start_date: filters.dateStart ? dayjs(filters.dateStart).format('YYYY-MM-DD') : undefined,
      end_date: filters.dateEnd ? dayjs(filters.dateEnd).format('YYYY-MM-DD') : undefined,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      tag_ids: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
      _useDealerEndpoint: true,
    }),
    [filters]
  );

  const { data: quotesData = [], isLoading } = useQuotes(params);
  const deleteQuoteMutation = useDeleteQuote();
  const updateQuoteMutation = useUpdateQuote();

  const filteredQuotes = useMemo(() => {
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

    return list.map((q) => {
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
        date: q.created_at || q.date || new Date().toISOString(),
        clientName: q.customer_name || q.clientName || 'Unknown',
        vehicle:
          `${vehicle_info.year || ''} ${vehicle_info.make || ''} ${vehicle_info.model || ''}`.trim() ||
          'N/A',
        price: amountVal,
      };
    });
  }, [quotesData, filters]);

  const stats = useMemo(() => {
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

  const handleArchive = async (id) => {
    const result = await Swal.fire({
      title: 'Archive Quote?',
      text: 'This will move the quote to archives. You can undo this later.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-text-muted))',
      confirmButtonText: 'Yes, archive it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteQuoteMutation.mutateAsync({ id, _useDealerEndpoint: true });
      } catch (error) {
        console.error('Failed to archive quote', error);
      }
    }
  };
  const handleApprove = async (quote) => {
    try {
      await updateQuoteMutation.mutateAsync({
        id: quote.id,
        data: {
          status: 'approved',
          _useDealerEndpoint: true,
        },
      });
      setOpenActionMenu(null);
    } catch (error) {
      console.error('Failed to approve quote', error);
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
          await updateQuoteMutation.mutateAsync({
            id: quote.id,
            data: {
              status: 'rejected',
              notes: result.value, // Appending reason to notes or strictly passed depending on API
              _useDealerEndpoint: true,
            },
          });
          setOpenActionMenu(null);
        } catch (error) {
          console.error('Failed to reject quote', error);
        }
      }
    });
  };

  const handleMarkSold = async (quote) => {
    try {
      await updateQuoteMutation.mutateAsync({
        id: quote.id,
        data: {
          status: 'converted', // Doc says 'converted'
          _useDealerEndpoint: true,
        },
      });
      setOpenActionMenu(null);
    } catch (error) {
      console.error('Failed to mark quote as sold', error);
    }
  };

  const handleReopen = async (quote) => {
    try {
      await updateQuoteMutation.mutateAsync({
        id: quote.id,
        data: {
          status: 'pending',
          _useDealerEndpoint: true,
        },
      });
      setOpenActionMenu(null);
    } catch (error) {
      console.error('Failed to reopen quote', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await quoteService.exportQuotes('csv', {
        status: filters.status || undefined,
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        _useDealerEndpoint: true,
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quotes_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: 'Export Successful',
        text: 'Your quotes have been downloaded.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback for mocked environment if API fails
      Swal.fire({
        title: 'Export Failed',
        text: 'Could not export quotes. Please try again later.',
        icon: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="My Quotes"
        subtitle="Manage your customer quotes and sales"
        actions={
          <>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] rounded-xl font-semibold hover:bg-[rgb(var(--color-background))] transition-all border border-[rgb(var(--color-border))]"
            >
              <FileText size={18} />
              <span>Export</span>
            </button>
            <button
              onClick={() => router.push('/quotes/new')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-xl font-semibold shadow-lg shadow-[rgb(var(--color-primary))/0.3] hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Plus size={20} />
              <span>Create New Quote</span>
            </button>
          </>
        }
        stats={[
          <StatCard
            key="total-value"
            title="Total Value"
            value={`$${Number(stats.totalValue || 0).toLocaleString()}`}
            icon={<DollarSign size={20} />}
            accent="rgb(var(--color-success))"
            helperText="Potential revenue"
          />,
          <StatCard
            key="pending"
            title="Pending"
            value={stats.pendingCount || 0}
            icon={<CheckCircle size={20} />}
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
            key="conversion"
            title="Conversion"
            value={`${stats.conversionRate || 0}%`}
            icon={<FileText size={20} />}
            accent="rgb(var(--color-info))"
            helperText="Success rate"
          />,
        ]}
      />

      <div className="min-h-0 flex flex-col">
        <div>
          <DataTable
            data={filteredQuotes}
            itemsPerPage={preferences.items_per_page || 10}
            highlightId={highlightId}
            selectedIds={selectedQuoteIds}
            onSelectionChange={setSelectedQuoteIds}
            searchKeys={['customer_name', 'vehicle', 'amount']}
            onFilterClick={() => setIsFilterOpen(true)}
            onClearFilters={clearFilters}
            showClearFilter={
              filters.status !== '' ||
              (filters.dateStart !== null && filters.dateStart !== '') ||
              (filters.dateEnd !== null && filters.dateEnd !== '') ||
              filters.minPrice !== '' ||
              filters.maxPrice !== '' ||
              (filters.tags && filters.tags.length > 0)
            }
            columns={[
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
                accessor: (row) => (
                  <span className="font-medium text-sm text-[rgb(var(--color-text))]">
                    {row.vehicle_info
                      ? `${row.vehicle_info.year} ${row.vehicle_info.make} ${row.vehicle_info.model}`
                      : 'N/A'}
                  </span>
                ),
                sortable: true,
                sortKey: 'vehicle_info.make',
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
                  green: ['approved', 'sold', 'converted'],
                  orange: ['pending'],
                  red: ['rejected'],
                  gray: ['expired', 'archived'],
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
                        const rect = e.currentTarget.getBoundingClientRect();
                        setOpenActionMenu({
                          id: row.id,
                          triggerRect: rect,
                        });
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))]'}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {openActionMenu && (
        <ActionMenuPortal
          isOpen={!!openActionMenu}
          onClose={() => setOpenActionMenu(null)}
          triggerRect={openActionMenu.triggerRect}
          align="end"
        >
          {(() => {
            if (!openActionMenu?.id) return null;
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

                {row.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(row);
                        setOpenActionMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-success))]/5 hover:text-[rgb(var(--color-success))] rounded-md transition-colors"
                    >
                      <CheckCircle size={14} /> Approve Quote
                    </button>
                    <button
                      onClick={() => {
                        handleReject(row);
                        setOpenActionMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))]/5 hover:text-[rgb(var(--color-error))] rounded-md transition-colors"
                    >
                      <X size={14} /> Reject Quote
                    </button>
                  </>
                )}

                {row.status === 'approved' && (
                  <button
                    onClick={() => {
                      handleMarkSold(row);
                      setOpenActionMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-info))]/5 hover:text-[rgb(var(--color-info))] rounded-md transition-colors"
                  >
                    <DollarSign size={14} /> Mark as Sold
                  </button>
                )}

                {(row.status === 'rejected' || row.status === 'expired') && (
                  <button
                    onClick={() => {
                      handleReopen(row);
                      setOpenActionMenu(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-warning))]/5 hover:text-[rgb(var(--color-warning))] rounded-md transition-colors"
                  >
                    <RotateCcw size={14} /> Reopen Quote
                  </button>
                )}

                <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>

                <button
                  onClick={() => {
                    handleArchive(row.id);
                    setOpenActionMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/5 rounded-md transition-colors"
                >
                  <Archive size={14} /> Archive
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
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Tags</h3>
            <TagFilter
              selectedTags={tempFilters.tags || []}
              onChange={(tags) => setTempFilters((prev) => ({ ...prev, tags }))}
              type="quote"
              options={useMemo(() => {
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
    </div>
  );
}
