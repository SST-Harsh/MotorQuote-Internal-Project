'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, FileText, TrashIcon, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import TabNavigation from '@/components/common/TabNavigation';
import DataTable from '@/components/common/DataTable';
import Swal from 'sweetalert2';
import { formatDate } from '@/utils/i18n';
import { useAuth } from '@/context/AuthContext';
import { usePreference } from '@/context/PreferenceContext';

// Hooks
import {
  useDealerTrashItems,
  useRestoreQuote,
  usePermanentDeleteQuote,
  useRestoreUser,
  usePermanentDeleteUser,
} from '@/hooks/useDealerTrash';

export default function DealerTrashPage() {
  const { user } = useAuth();
  const { preferences } = usePreference();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');
  // Determine default tab based on user role
  const isSupportStaff = user?.role === 'support_staff';
  const [activeTab, setActiveTab] = useState(isSupportStaff ? 'user' : 'quote');
  const [searchTerm, setSearchTerm] = useState('');

  const tabParam = searchParams.get('tab');

  // Auto-switch tabs and reset filters when deep-linking
  useEffect(() => {
    if (tabParam && (tabParam === 'user' || tabParam === 'quote' || tabParam === 'staff_user')) {
      const targetTab = tabParam === 'staff_user' ? 'user' : tabParam;
      setActiveTab(targetTab);
    }
  }, [tabParam]);

  useEffect(() => {
    if (highlightId) {
      setSearchTerm('');
    }
  }, [highlightId]);

  // Get dealership_id from user - check multiple possible locations
  const dealershipId =
    user?.dealership_id ||
    user?.roleDetails?.dealership_id ||
    user?.dealer_id ||
    user?.roleDetails?.dealer_id ||
    user?.dealership?.id;

  // Fetch quote count (for Quotes tab label)
  const { data: quoteCountData } = useDealerTrashItems({
    type: 'quote',
    limit: 1000, // Get all items for accurate count
  });
  const quoteCount = Array.isArray(quoteCountData)
    ? quoteCountData.length
    : quoteCountData?.data?.length || 0;

  // Fetch user count (for Users tab label)
  const { data: userCountData } = useDealerTrashItems({
    type: 'user',
    limit: 1000, // Get all items for accurate count
  });
  const userCount = Array.isArray(userCountData)
    ? userCountData.length
    : userCountData?.data?.length || 0;

  // Fetch all items for active tab (DataTable handles pagination internally)
  const {
    data: trashResponse,
    isLoading,
    refetch,
  } = useDealerTrashItems({
    type: activeTab,
    limit: 1000, // Fetch all items so DataTable can paginate them
  });

  // Pre-process items for consistent structure
  const trashItems = useMemo(() => {
    const itemsRaw = Array.isArray(trashResponse) ? trashResponse : trashResponse?.data || [];

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
      if (type === 'quote') {
        const quoteId = details.id || item.item_id || 'N/A';
        const shortId = quoteId.length > 8 ? quoteId.substring(0, 8) : quoteId;
        const customerName = details.customer_name || 'N/A';
        displayDetail = `Quote #${shortId} - ${customerName}`;
      } else if (type === 'user' || type === 'staff_user') {
        const userName =
          details.name || details.full_name || details.first_name
            ? `${details.first_name} ${details.last_name || ''}`.trim()
            : 'User';
        const userEmail = details.email || 'N/A';
        displayDetail = `User - ${userName} (${userEmail})`;
      } else if (type === 'dealership' || type === 'dealer') {
        displayDetail = `${details.name || 'Dealership'} ${details.code ? `(${details.code})` : ''}`;
      } else {
        displayDetail = 'Item details unavailable';
      }

      return {
        ...item,
        parsed_details: details,
        display_detail: displayDetail,
        deleted_at_formatted: item.deleted_at ? formatDate(item.deleted_at) : 'N/A',
      };
    });
  }, [trashResponse, dealershipId, activeTab]);

  const restoreQuoteMutation = useRestoreQuote();
  const permanentDeleteQuoteMutation = usePermanentDeleteQuote();
  const restoreUserMutation = useRestoreUser();
  const permanentDeleteUserMutation = usePermanentDeleteUser();

  const getItemName = (row) => row.display_detail || 'this item';

  const tabs = isSupportStaff
    ? [
        { key: 'user', label: `Users (${userCount || 0})`, icon: User },
        { key: 'quote', label: `Quotes (${quoteCount || 0})`, icon: FileText },
      ]
    : [
        { key: 'quote', label: `Quotes (${quoteCount || 0})`, icon: FileText },
        { key: 'user', label: `Users (${userCount || 0})`, icon: User },
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
        if (row.item_type === 'quote') {
          await restoreQuoteMutation.mutateAsync(row.item_id);
        } else if (row.item_type === 'user' || row.item_type === 'staff_user') {
          await restoreUserMutation.mutateAsync(row.item_id);
        }
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
        if (row.item_type === 'quote') {
          await permanentDeleteQuoteMutation.mutateAsync(row.item_id);
        } else if (row.item_type === 'user' || row.item_type === 'staff_user') {
          await permanentDeleteUserMutation.mutateAsync(row.item_id);
        }
        refetch();
      } catch (error) {
        // Error handled by mutation hook
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        subtitle="Review, restore, or permanently delete quotes and staff users."
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchTerm('');
        }}
        tabs={tabs}
        scrollable
      />

      <DataTable
        data={trashItems}
        itemsPerPage={preferences.items_per_page || 5}
        persistenceKey="dealer-trash"
        searchKeys={['display_detail', 'item_id']}
        searchPlaceholder={`Search in ${activeTab} trash...`}
        highlightId={highlightId}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        columns={[
          {
            header: 'Details',
            sortable: true,
            sortKey: 'display_detail',
            accessor: (row) => (
              <span className="font-medium text-[rgb(var(--color-text))]">
                {row.display_detail}
              </span>
            ),
          },
          {
            header: 'Deleted At',
            sortable: true,
            sortKey: 'deleted_at',
            accessor: (row) => (
              <span className="text-sm text-[rgb(var(--color-text-muted))]">
                {row.deleted_at_formatted}
              </span>
            ),
          },
          {
            header: 'Actions',
            accessor: (row) => (
              <div className="flex items-start justify-start gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(row);
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Restore"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(row);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Permanent Delete"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
