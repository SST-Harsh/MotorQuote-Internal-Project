'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  X,
  DollarSign,
  FileText,
  Phone,
  Mail,
  Building2,
  User,
  Eye,
  Edit,
  Tag,
  Clock,
  Calendar,
  Search,
  MapPin,
  Trash2,
  CheckCircle,
  Car,
  Archive,
  ChevronRight,
} from 'lucide-react';
import StatCard from '../../common/StatCard';
import DataTable from '../../common/DataTable';
import FilterDrawer from '../../common/FilterDrawer';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import quoteService from '@/services/quoteService';
import tagService from '@/services/tagService';
import CustomSelect from '@/components/common/CustomSelect';
import ActionMenuPortal from '@/components/common/ActionMenuPortal';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import TagList from '@/components/common/tags/TagList';
import TagFilter from '@/components/common/tags/TagFilter';
import PageHeader from '@/components/common/PageHeader';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';
import { useAuth } from '@/context/AuthContext';
import { useQuotes, useDeleteQuote, useUpdateQuote, useUpdateStatus } from '@/hooks/useQuotes';
import {
  canDelete,
  canCreateQuote,
  canEditQuote,
  canViewQuote,
  canExportReports,
} from '@/utils/roleUtils';
import { usePricingConfigs } from '@/hooks/usePricingConfig';

export default function DealerQuote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const { user } = useAuth();
  const canDeleteQuote = user ? canDelete(user, 'quotes') : false;
  const canExport = user ? canExportReports(user) : false;
  const canCreate = user ? canCreateQuote(user) : false;
  const canView = user ? canViewQuote(user) : false;
  const canEdit = user ? canEditQuote(user) : false;
  const normalizedRole = (user?.role || '').toLowerCase().replace(/[_\s]/g, '');
  const isDealerManager = normalizedRole === 'dealermanager';
  const { preferences } = usePreference();
  const pathname = usePathname();
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Initial check for refresh vs new navigation
  const isRefresh = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem('dealer_quotes_tab') || 'All';
    }
    return 'All';
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedQuoteForPrice, setSelectedQuoteForPrice] = useState(null);
  const [quoteForPriceModal, setQuoteForPriceModal] = useState(null);

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
        const saved = sessionStorage.getItem('dealer_quotes_filters');
        return saved ? JSON.parse(saved) : defaultFilters;
      }
      return defaultFilters;
    } catch (_) {
      return defaultFilters;
    }
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem('dealer_quotes_search') || '';
    }
    return '';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('dealer_quotes_tab', activeTab);
    sessionStorage.setItem('dealer_quotes_filters', JSON.stringify(filters));
    sessionStorage.setItem('dealer_quotes_search', searchTerm);
    sessionStorage.setItem('app_last_path', pathname);
  }, [activeTab, filters, searchTerm, pathname]);

  // Temporary filters for the drawer (not applied until "Apply" is clicked)
  const [recentlyChangedIds, setRecentlyChangedIds] = useState(new Set());
  const [tempFilters, setTempFilters] = useState(filters);

  const clearFilters = () => {
    setFilters({
      status: '',
      dateStart: null,
      dateEnd: null,
      minPrice: '',
      maxPrice: '',
      dealershipId: '',
      tags: [],
    });
    setTempFilters({
      status: '',
      dateStart: null,
      dateEnd: null,
      minPrice: '',
      maxPrice: '',
      dealershipId: '',
      tags: [],
    });
    setSearchTerm('');
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

  // Move to static params to fetch all data once and filter client-side
  const params = useMemo(
    () => ({
      _useDealerEndpoint: true,
    }),
    []
  );

  const { data: quotesData = [], isLoading } = useQuotes(params);
  const deleteQuoteMutation = useDeleteQuote();
  const updateQuoteMutation = useUpdateQuote();
  const updateStatusMutation = useUpdateStatus();

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

  // ── Base Filtered List (Role & Dealership permissions only) ─────────
  const baseQuotes = useMemo(() => {
    let list = Array.isArray(quotesData) ? quotesData : quotesData.quotes || [];

    // ── Dealership Visibility Guard ────────────────────────────────────
    // Dealer Managers may only see quotes whose dealership_id is one
    // of their authorized dealerships. This includes quotes created by
    // Admins or Super Admins on behalf of their dealership.
    // Managers with no matching dealership see nothing from that group.
    if (isDealerManager) {
      const authorizedDealershipIds = new Set((user?.dealerships || []).map((d) => String(d.id)));
      if (user?.dealership?.id) authorizedDealershipIds.add(String(user.dealership.id));
      if (user?.dealership_id) authorizedDealershipIds.add(String(user.dealership_id));

      if (authorizedDealershipIds.size > 0) {
        list = list.filter((q) => {
          const qDealershipId = q.dealership_id ?? q.dealershipId;
          if (qDealershipId == null) return true;
          return authorizedDealershipIds.has(String(qDealershipId));
        });
      } else {
        list = [];
      }
    }
    return list;
  }, [quotesData, user, isDealerManager]);

  const filteredQuotes = useMemo(() => {
    let list = [...baseQuotes];

    // 1. Search Text
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter((q) => {
        const customer = (q.customer_name || q.clientName || '').toLowerCase();
        const vehicleInfo = q.vehicle_info || q.vehicle_details || {};
        const vehicle = (
          q.vehicle ||
          `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`
        ).toLowerCase();
        const amount = (q.amount || q.quote_amount || '').toString();
        const dealership = (q.dealership_name || q.dealership?.name || '').toLowerCase();
        const dealershipIdStr = (q.dealership_id || q.dealership?.id || '').toString();
        const dealershipShortId = dealershipIdStr ? dealershipIdStr.slice(-4).toLowerCase() : '';

        const shortId = (q.id || '').toString().split('-')[0].toLowerCase();
        const cleanSearch = lowerSearch.replace(/^#/, '').trim();

        return (
          customer.includes(lowerSearch) ||
          vehicle.includes(lowerSearch) ||
          amount.includes(lowerSearch) ||
          dealership.includes(lowerSearch) ||
          (dealershipShortId && dealershipShortId.includes(lowerSearch)) ||
          (cleanSearch && shortId.includes(cleanSearch))
        );
      });
    }
    // ──────────────────────────────────────────────────────────────────

    // Apply filters client-side
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
      list = list.filter((q) => {
        const qDealershipId = q.dealership_id ?? q.dealershipId ?? q.dealership?.id;
        return String(qDealershipId) === String(filters.dealershipId);
      });
    }

    return list.map((q) => {
      const vehicle_info = q.vehicle_info || q.vehicle_details || {};
      const amountVal = parseNumeric(q.amount || q.quote_amount || q.price || 0);
      const dealership =
        q.dealership ||
        (user?.dealerships || []).find((d) => String(d.id) === String(q.dealership_id));

      return {
        ...q,
        id: q.id,
        customer_name: q.customer_name || q.clientName || 'Unknown',
        vehicle_info: vehicle_info,
        dealership: dealership,
        amount: amountVal,
        status:
          q.status === 'converted' || q.status === 'sold' || q.status === ''
            ? 'sold_out'
            : (q.status || 'pending').toLowerCase(),
        created_at: q.created_at || q.date || new Date().toISOString(),
        date: q.created_at || q.date || new Date().toISOString(),
        clientName: q.customer_name || q.clientName || 'Unknown',
        vehicle:
          `${vehicle_info.year || ''} ${vehicle_info.make || ''} ${vehicle_info.model || ''}`.trim() ||
          'N/A',
        price: amountVal,
      };
    });
  }, [baseQuotes, filters, searchTerm, recentlyChangedIds, user]);

  const combinedTags = useMemo(() => {
    const list = baseQuotes;
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
  }, [baseQuotes]);

  // Base parsing function for stats
  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(String(val).replace(/[^\d.]/g, '')) || 0;
  };

  const stats = useMemo(() => {
    // Use baseQuotes for global stats instead of filteredQuotes
    const fullList = baseQuotes;
    const activeStatuses = ['pending', 'approved', 'sold', 'sold_out', 'converted', ''];

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
      await updateStatusMutation.mutateAsync({
        id: quote.id,
        status: 'approved',
        _useDealerEndpoint: true,
      });
      setRecentlyChangedIds((prev) => new Set(prev).add(quote.id));
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
          await updateStatusMutation.mutateAsync({
            id: quote.id,
            status: 'rejected',
            reason: result.value,
            _useDealerEndpoint: true,
          });
          setRecentlyChangedIds((prev) => new Set(prev).add(quote.id));
          setOpenActionMenu(null);
        } catch (error) {
          console.error('Failed to reject quote', error);
        }
      }
    });
  };

  const handleMarkSold = async (quote) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: quote.id,
        status: 'converted', // Use 'converted' for API while UI shows 'Sold Out'
        _useDealerEndpoint: true,
      });
      setRecentlyChangedIds((prev) => new Set(prev).add(quote.id));
      setOpenActionMenu(null);
    } catch (error) {
      console.error('Failed to mark quote as sold', error);
    }
  };

  const handleOpenPriceModal = async (quote) => {
    try {
      // Fetch full quote data for the modal
      const data = await quoteService.getQuoteById(quote.id, { _useDealerEndpoint: true });
      const fullQuote = data.quote || data;
      setQuoteForPriceModal(fullQuote);
      setSelectedQuoteForPrice(quote);
      setIsPriceModalOpen(true);
      setOpenActionMenu(null);
    } catch (error) {
      console.error('Failed to load quote for price setting', error);
      Swal.fire('Error', 'Failed to load quote details for price setting.', 'error');
    }
  };

  const handlePriceSet = async (newValues) => {
    try {
      const quoteDataPayload = {
        quote_amount: newValues.price,
        base_price: newValues.base_price,
        discount_key: newValues.discount_key || null,
        discount_amount: newValues.discount_amount || 0,
        fee_key: newValues.fee_key || null,
        fee_amount: newValues.fee_amount || 0,
        tax_key: newValues.tax_key || null,
        tax_amount: newValues.tax_amount || 0,
        insurance_key: newValues.insurance_key || null,
        insurance_amount: newValues.insurance_amount || 0,
        down_payment: newValues.down_payment,
        loan_term: newValues.loan_term,
        interest_rate: newValues.interest_rate,
        dealer_note: newValues.dealer_note || null,
        offer_expires_at: newValues.offer_expires_at || null,
        _useDealerEndpoint: true,
      };

      await updateQuoteMutation.mutateAsync({
        id: selectedQuoteForPrice.id,
        data: quoteDataPayload,
      });

      setIsPriceModalOpen(false);
      setSelectedQuoteForPrice(null);
      setQuoteForPriceModal(null);
      setRecentlyChangedIds((prev) => new Set(prev).add(selectedQuoteForPrice.id));

      Swal.fire('Success', 'Quote price has been set successfully', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to set quote price', 'error');
    }
  };

  const handleExport = async () => {
    if (filteredQuotes.length === 0) {
      Swal.fire({
        title: 'No Quotes Found',
        text: 'There are no quotes matching your current filters to export.',
        icon: 'warning',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
      return;
    }

    const dealershipId =
      filters.dealershipId || user?.dealership_id || user?.roleDetails?.dealership_id;

    try {
      const blob = await quoteService.exportQuotes('csv', {
        status: filters.status || undefined,
        start_date: filters.dateStart,
        end_date: filters.dateEnd,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        dealership_id: dealershipId,
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
              disabled={!canExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[rgb(var(--color-surface))]"
              title={canExport ? 'Export Quotes' : "You don't have permission to export reports."}
            >
              <FileText size={18} />
              <span>Export</span>
            </button>
          </>
        }
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

      <div className="min-h-0 flex flex-col">
        <div>
          <DataTable
            data={filteredQuotes}
            itemsPerPage={preferences.items_per_page || 10}
            persistenceKey="dealer-quotes"
            highlightId={highlightId}
            searchKeys={['customer_name', 'vehicle', 'amount']}
            searchPlaceholder="Search quotes by customer, vehicle, or amount..."
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
              tags: filters.tags,
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
              {
                key: 'tags',
                label: 'Tags',
                options: combinedTags.map((t) => ({
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
              filters.dealershipId !== '' ||
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
                }),
              },
              {
                header: 'Vehicle',
                sortable: true,
                sortKey: 'vehicle_info.make',
                accessor: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))]">
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
                header: 'Dealership',
                sortable: true,
                sortKey: 'dealership.name',
                className: 'min-w-[150px]',
                accessor: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))]">
                      <Building2 size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[rgb(var(--color-text))] text-sm">
                        {row.dealership?.name || 'Unknown'}
                      </span>
                      {/* <span className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase tracking-wide bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                                                ID: {row.dealership_id ? String(row.dealership_id).slice(-4) : (row.dealership?.id ? String(row.dealership.id).slice(-4) : '...')}
                                            </span> */}
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

                        // Manual positioning with viewport safety
                        let position = { top: rect.bottom + 4, left: rect.right - 192 };

                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < 250) {
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
          />
        </div>
      </div>

      {openActionMenu && (
        <ActionMenuPortal
          isOpen={!!openActionMenu}
          onClose={() => setOpenActionMenu(null)}
          position={openActionMenu.position}
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
                    if (canView) {
                      router.push(`/quotes/${row.id}`);
                      setOpenActionMenu(null);
                    }
                  }}
                  disabled={!canView}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))]/5 hover:text-[rgb(var(--color-primary))] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[rgb(var(--color-text-muted))]"
                  title={
                    canView ? 'View Details' : "You don't have permission to view quote details."
                  }
                >
                  <Eye size={14} /> View Details
                </button>

                {(canEdit || isDealerManager) && row.status === 'approved' && (
                  <button
                    onClick={() => handleMarkSold(row)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-success))]/5 hover:text-[rgb(var(--color-success))]"
                  >
                    <CheckCircle size={14} /> Mark as Sold
                  </button>
                )}

                {(canEdit || isDealerManager) && row.status === 'pending' && (
                  <button
                    onClick={() => handleOpenPriceModal(row)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))]/5 hover:text-[rgb(var(--color-primary))]"
                  >
                    <DollarSign size={14} /> Set Price
                  </button>
                )}

                {canDeleteQuote && (
                  <>
                    <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>
                    <button
                      onClick={() => {
                        handleArchive(row.id);
                        setOpenActionMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-md text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))]/5 hover:text-[rgb(var(--color-error))]"
                      title="Archive Quote"
                    >
                      <Archive size={14} /> Archive Quote
                    </button>
                  </>
                )}
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
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Dealership</h3>
          <CustomSelect
            value={tempFilters.dealershipId || ''}
            onChange={(e) => setTempFilters((prev) => ({ ...prev, dealershipId: e.target.value }))}
            options={[
              { value: '', label: 'All Dealerships' },
              ...(user?.dealerships || [])
                .filter(
                  (d) =>
                    (d.id || d.value) &&
                    (d.name || d.label) &&
                    String(d.name || d.label)
                      .trim()
                      .toLowerCase() !== 'all dealerships'
                )
                .map((d) => ({
                  value: String(d.id || d.value),
                  label: String(d.name || d.label).trim(),
                })),
            ]}
            placeholder="All Dealerships"
            className="w-full"
          />
        </div>

        <div className="space-y-6">
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
                        <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Tags</h3>
                        <TagFilter
                            selectedTags={tempFilters.tags || []}
                            onChange={(tags) => setTempFilters(prev => ({ ...prev, tags }))}
                            type="quote"
                            options={combinedTags}
                        />
                    </div> */}
        </div>
      </FilterDrawer>

      {isPriceModalOpen && quoteForPriceModal && (
        <SetPriceModal
          quote={quoteForPriceModal}
          onClose={() => {
            setIsPriceModalOpen(false);
            setSelectedQuoteForPrice(null);
            setQuoteForPriceModal(null);
          }}
          onSave={handlePriceSet}
          loading={updateQuoteMutation.isPending}
        />
      )}
    </div>
  );
}

// SetPriceModal Component - Premium Simple UI for Dealer Quote
function SetPriceModal({ quote, onClose, onSave, loading }) {
  const [price, setPrice] = useState(() => {
    return quote.base_price || quote.amount || quote.quote_amount || 0;
  });
  const [dealerNote, setDealerNote] = useState(quote.dealer_note || '');
  const [loanTerm, setLoanTerm] = useState(() => {
    if (quote.offer_expires_at) {
      const expiresDate = new Date(quote.offer_expires_at);
      const now = new Date();
      const diffMs = expiresDate - now;
      const diffMins = diffMs / (1000 * 60);
      if (diffMins <= 60) return 0.01;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return Math.round(diffDays);
    }
    return 30;
  });

  const [isFocused, setIsFocused] = useState(false);

  // Reliable vehicle description
  const vehicleName =
    quote.vehicle ||
    (quote.vehicle_info?.year
      ? `${quote.vehicle_info.year} ${quote.vehicle_info.make} ${quote.vehicle_info.model}`
      : '—');

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-[rgb(var(--color-surface))] rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[rgb(var(--color-border))] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark,var(--color-primary)))] overflow-hidden flex-shrink-0">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Finalize Approval & Finance
                </h3>
                <p className="text-[11px] text-white/60 font-semibold mt-0.5">
                  Review the proposed price and adjust if necessary before approving.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {/* ── Vehicle + Customer Summary Row ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgb(var(--color-background))] rounded-xl p-4 border border-[rgb(var(--color-border))]">
              <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1.5">
                Vehicle
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))] leading-snug">
                {vehicleName}
              </p>
              {quote.vin && (
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1 font-mono">
                  VIN: {quote.vin}
                </p>
              )}
            </div>
            <div className="bg-[rgb(var(--color-background))] rounded-xl p-4 border border-[rgb(var(--color-border))]">
              <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest mb-1.5">
                Seller
              </p>
              <p className="text-sm font-bold text-[rgb(var(--color-text))] leading-snug">
                {quote.customer_name || quote.clientName || 'Bob Jones'}
              </p>
              {quote.customer_email && (
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-1 truncate">
                  {quote.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* ── Current Price Banner ── */}
          {(quote.amount || quote.quote_amount) && (
            <div className="flex items-center justify-between bg-[rgb(var(--color-background))] rounded-xl px-4 py-3 border border-[rgb(var(--color-border))]">
              <p className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
                Current Price
              </p>
              <p className="text-base font-bold text-[rgb(var(--color-text-muted))]">
                ${Number(quote.amount || quote.quote_amount).toLocaleString()}
              </p>
            </div>
          )}

          {/* ── New Price Input ── */}
          <div
            className={`bg-[rgb(var(--color-background))] rounded-2xl p-5 border-2 transition-colors ${isFocused ? 'border-[rgb(var(--color-primary))]' : 'border-[rgb(var(--color-primary))]/30'}`}
          >
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2">
              Set New Price
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[rgb(var(--color-primary))] select-none">
                $
              </span>
              <input
                type="number"
                value={price}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full bg-transparent border-0 p-0 text-4xl font-bold text-[rgb(var(--color-text))] outline-none placeholder:text-[rgb(var(--color-text-muted))]/40"
              />
            </div>
          </div>

          {/* ── Price Breakdown ── */}
          {Number(price) > 0 && (
            <div className="bg-[rgb(var(--color-background))] rounded-2xl border border-[rgb(var(--color-border))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgb(var(--color-border))] bg-white/30">
                <p className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest">
                  Price Breakdown
                </p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[rgb(var(--color-text-muted))]">Base Price</span>
                  <span className="font-semibold text-[rgb(var(--color-text))]">
                    ${Number(price).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-dashed border-[rgb(var(--color-border))] flex justify-between items-center">
                  <span className="text-sm font-bold text-[rgb(var(--color-text))]">
                    Total Offer
                  </span>
                  <span className="text-lg font-bold text-[rgb(var(--color-primary))]">
                    ${Number(price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Offer Validity ── */}
          <div>
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block mb-2">
              Offer Validity
            </label>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setLoanTerm(0.01)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  loanTerm === 0.01
                    ? 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/40 text-[rgb(var(--color-primary))]'
                    : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))]/30'
                }`}
              >
                10M
              </button>
              {[7, 14, 21, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setLoanTerm(days)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    loanTerm === days
                      ? 'bg-[rgb(var(--color-primary))]/10 border-[rgb(var(--color-primary))]/40 text-[rgb(var(--color-primary))]'
                      : 'bg-[rgb(var(--color-background))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))]/30'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
            {loanTerm > 0 && (
              <p className="text-[10px] text-[rgb(var(--color-text-muted))] mt-2 font-medium italic text-right">
                Expires:{' '}
                {loanTerm < 1
                  ? new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toLocaleTimeString(
                      'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    )
                  : new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}
              </p>
            )}
          </div>

          {/* ── Note to Seller ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-widest block ml-1">
              Note to Seller{' '}
              <span className="font-normal normal-case opacity-50 ml-1">(Optional)</span>
            </label>
            <textarea
              value={dealerNote}
              onChange={(e) => setDealerNote(e.target.value)}
              placeholder="e.g. This offer is based on current market value. Please respond within the validity period."
              rows={3}
              maxLength={500}
              className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-2xl px-5 py-3.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))]/30 resize-none outline-none focus:border-[rgb(var(--color-primary))]/40 transition-all shadow-sm"
            />
            <p className="text-[10px] text-[rgb(var(--color-text-muted))]/60 text-right mt-1 font-medium">
              {dealerNote.length}/500
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-5 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-4 rounded-2xl text-sm font-bold text-[rgb(var(--color-text-muted))] bg-white border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-background))] transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const expiresAt =
                  loanTerm > 0
                    ? new Date(Date.now() + loanTerm * 24 * 60 * 60 * 1000).toISOString()
                    : null;

                onSave({
                  price: Number(price),
                  base_price: Number(price),
                  dealer_note: dealerNote.trim() || null,
                  offer_expires_at: expiresAt,
                });
              }}
              disabled={loading || !price || Number(price) <= 0}
              className="group relative py-4 rounded-2xl text-sm font-bold text-white bg-[rgb(var(--color-primary))] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[rgb(var(--color-primary))]/20 flex items-center justify-center gap-2 overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Set Price
                  {Number(price) > 0 && (
                    <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-bold">
                      ${Number(price).toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
