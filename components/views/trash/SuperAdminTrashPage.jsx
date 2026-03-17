'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Trash2,
  RefreshCw,
  Users,
  Car,
  FileText,
  Search,
  Calendar,
  User,
  AlertCircle,
  Trash,
  Bell,
  File,
  Ticket,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import TabNavigation from '@/components/common/TabNavigation';
import { SkeletonTable } from '@/components/common/Skeleton';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/utils/i18n';

// Hooks
import {
  useTrashItems,
  useTrashSummary,
  useRestoreTrashItem,
  usePermanentDeleteTrashItem,
} from '@/hooks/useTrash';

export default function SuperAdminTrashPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  const pathname = usePathname();
  const TRASH_TAB_KEY = 'super_admin_trash_active_tab';

  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(TRASH_TAB_KEY) || 'user';
    }
    return 'user';
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(TRASH_TAB_KEY, activeTab);
    sessionStorage.setItem('app_last_path', pathname);
  }, [activeTab, pathname]);

  const tabParam = searchParams.get('tab');

  // Auto-switch tabs and reset filters when deep-linking
  useEffect(() => {
    const validTabs = ['user', 'dealership', 'quote', 'notification', 'file', 'ticket', 'dealer'];
    if (tabParam && validTabs.includes(tabParam)) {
      const targetTab = tabParam === 'dealer' ? 'dealership' : tabParam;
      setActiveTab(targetTab);
    }
  }, [tabParam]);

  useEffect(() => {
    if (highlightId) {
      setSearchTerm('');
    }
  }, [highlightId]);

  // Fetch summary for counts
  const { data: summaryData } = useTrashSummary();
  const summary = useMemo(() => {
    return summaryData?.data?.summary || summaryData?.summary || summaryData || {};
  }, [summaryData]);

  // Fetch items for active tab
  const {
    data: trashResponse,
    isLoading,
    refetch,
  } = useTrashItems({
    type: activeTab,
    limit: 1000, // Fetch a large batch for client-side filtering
  });

  // Pre-process items for consistent structure and searchability
  const trashItems = useMemo(() => {
    const itemsRaw = Array.isArray(trashResponse)
      ? trashResponse
      : Array.isArray(trashResponse?.data)
        ? trashResponse.data
        : trashResponse?.data?.items || [];

    return itemsRaw.map((item) => {
      let details = item.original_data || {};
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
        } catch (e) {
          details = {};
        }
      }

      let displayDetail = '';
      const type = item.item_type;
      if (type === 'user')
        displayDetail = details.full_name || details.email || details.name || 'User';
      else if (type === 'quote') {
        const qNum =
          details.quote_number || details.quoteNumber || details.number || details.id || 'N/A';
        const cName = details.customer_name || details.customerName || details.customer?.name || '';
        displayDetail = `Quote #${qNum} ${cName ? `- ${cName}` : ''}`;
      } else if (type === 'dealership' || type === 'dealer')
        displayDetail = `${details.name || 'Dealership'} ${details.code ? `(${details.code})` : ''}`;
      else if (type === 'notification')
        displayDetail = details.title || details.subject || 'Notification';
      else if (type === 'file') displayDetail = details.name || details.filename || 'File';
      else if (type === 'ticket')
        displayDetail = `#${details.ticket_number || ''} ${details.subject || ''}`;
      else displayDetail = 'Item details unavailable';

      return {
        ...item,
        parsed_details: details,
        display_detail: displayDetail,
      };
    });
  }, [trashResponse]);

  const restoreMutation = useRestoreTrashItem();
  const permanentDeleteMutation = usePermanentDeleteTrashItem();

  const getItemName = (row) => row.display_detail || 'this item';

  const tabs = [
    { key: 'user', label: `Users (${summary.user || 0})`, icon: Users },
    {
      key: 'dealership',
      label: `Dealerships (${summary.dealership || summary.dealer || 0})`,
      icon: Car,
    },
    { key: 'quote', label: `Quotes (${summary.quote || 0})`, icon: FileText },
    { key: 'notification', label: `Notifications (${summary.notification || 0})`, icon: Bell },
    { key: 'file', label: `Files (${summary.file || 0})`, icon: File },
    { key: 'ticket', label: `Tickets (${summary.ticket || 0})`, icon: Ticket },
  ];

  const handleRestore = async (row) => {
    const name = getItemName(row);
    const result = await Swal.fire({
      title: 'Restore Item?',
      text: `Are you sure you want to restore "${name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, restore it!',
      confirmButtonColor: 'rgb(var(--color-primary))',
      cancelButtonColor: '#6B7280',
    });

    if (result.isConfirmed) {
      try {
        await restoreMutation.mutateAsync({ type: row.item_type, id: row.item_id });
        refetch();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const handlePermanentDelete = async (row) => {
    const name = getItemName(row);
    const result = await Swal.fire({
      title: 'Permanently Delete?',
      text: `This action cannot be undone. "${name}" will be gone forever.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, DELETE permanently',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      input: 'text',
      inputPlaceholder: 'Type DELETE to confirm',
      inputValidator: (value) => {
        if (value !== 'DELETE') {
          return 'You must type DELETE to confirm';
        }
      },
    });

    if (result.isConfirmed) {
      try {
        await permanentDeleteMutation.mutateAsync({ type: row.item_type, id: row.item_id });
        refetch();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  const renderActions = (row) => (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRestore(row);
        }}
        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        title="Restore"
      >
        <RefreshCw size={18} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePermanentDelete(row);
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Permanent Delete"
      >
        <Trash size={18} />
      </button>
    </div>
  );

  const commonColumns = [
    // {
    //     header: 'Item ID',
    //     accessor: 'item_id',
    //     className: 'font-mono text-[10px] text-[rgb(var(--color-text-muted))] max-w-[100px] truncate'
    // },
    {
      header: 'Details',
      accessor: 'display_detail',
      className: 'font-semibold',
      sortable: true,
    },
    {
      header: 'Deleted At',
      accessor: (row) => (row.deleted_at ? formatDate(row.deleted_at) : 'N/A'),
      className: 'text-xs text-[rgb(var(--color-text-muted))]',
    },
    {
      header: 'Actions',
      className: 'text-center w-24',
      accessor: (row) => renderActions(row),
    },
  ];

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl shadow-sm">
        {/* <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4">
                    <AlertCircle size={32} />
                </div> */}
        <h2 className="text-xl font-bold text-[rgb(var(--color-text))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--color-text-muted))] max-w-md">
          You do not have permission to access the Trash Management system. Only Super
          Administrators can view and restore deleted data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash Management"
        subtitle="Review, restore, or permanently delete items across the system."
        // icon={<Trash2 className="text-[rgb(var(--color-primary))]" />}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        tabs={tabs}
        scrollable
      />

      {isLoading ? (
        <div className="p-8">
          <SkeletonTable rows={8} columns={3} />
        </div>
      ) : (
        <DataTable
          data={trashItems}
          columns={commonColumns}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchKeys={['item_id', 'display_detail']}
          searchPlaceholder={`Search in ${activeTab} trash...`}
          highlightId={highlightId}
          persistenceKey={`trash-${activeTab}`}
        />
      )}
    </div>
  );
}
