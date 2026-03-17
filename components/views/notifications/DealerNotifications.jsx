import { Bell, Check, Trash2, Filter, Search, BadgeAlert, Loader2, Eye } from 'lucide-react';
import { useSearchParams, usePathname } from 'next/navigation';
import dayjs from 'dayjs';
import notificationService from '@/services/notificationService';
import DataTable from '@/components/common/DataTable';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate, formatTime } from '@/utils/i18n';
import Swal from 'sweetalert2';
import PageHeader from '@/components/common/PageHeader';

import { useNotifications } from '@/context/NotificationContext';

export default function DealerNotifications() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Notifications"
        subtitle="Manage alerts and communicate with your team."

        // gradient
      />

      {/* Content Container */}
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-border))] min-h-[500px] transition-all duration-300 overflow-hidden">
        <div className="p-4 sm:p-6">
          <NotificationList user={user} highlightId={highlightId} />
        </div>
      </div>
    </div>
  );
}

function NotificationList({ user, highlightId }) {
  const NOTIF_LIST_FILTER_KEY = 'dealer_notif_list_filter';

  const { preferences } = usePreference();
  const { userNotifications, markAsRead, markAllAsRead, refreshNotifications, isLoading } =
    useNotifications();
  const pathname = usePathname();
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [filter, setFilter] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(NOTIF_LIST_FILTER_KEY) || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(NOTIF_LIST_FILTER_KEY, filter);
    sessionStorage.setItem('app_last_path', pathname);
  }, [filter, pathname]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleRemoveFilter = (key) => {
    if (key === 'status') setFilter('all');
  };

  const handleMarkAsReadLocal = (id) => {
    markAsRead(id);
  };

  const handleMarkAllReadLocal = () => {
    markAllAsRead();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'All marked as read',
      showConfirmButton: false,
      timer: 1500,
    });
  };

  const filteredData = (userNotifications || []).filter((n) => {
    const isRead = n.isRead || n.is_read;
    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  const columns = [
    {
      header: 'Status',
      accessor: (row) => {
        const isRead = row.isRead || row.is_read;
        return (
          <div className="flex justify-center">
            {isRead ? (
              <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--color-success))/0.12] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success))/0.2] text-[10px] font-bold uppercase tracking-tight">
                Read
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/25 text-[10px] font-bold uppercase tracking-tight animate-pulse-subtle">
                Unread
              </span>
            )}
          </div>
        );
      },
      className: 'w-20 text-center',
    },
    {
      header: 'Notification',
      accessor: (row) => (
        <div className="min-w-0">
          <p
            className={`text-sm truncate ${!(row.isRead || row.is_read) ? 'font-bold text-[rgb(var(--color-text))]' : 'font-medium text-[rgb(var(--color-text-muted))]'}`}
          >
            {row.title}
          </p>
          <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 line-clamp-1">
            {row.message}
          </p>
        </div>
      ),
    },
    {
      header: 'Type',
      type: 'badge',
      accessor: (row) => row.type || 'System',
      config: {
        red: ['alert', 'error'],
        orange: ['announcement', 'warning'],
        blue: ['System', 'info', 'quote_alert'],
        green: ['success', 'status'],
      },
    },
    {
      header: 'Date / Status',
      accessor: (row) => {
        const dateValue = row.created_at || row.createdAt || row.scheduled_at || row.scheduledAt;
        if (!dateValue) return <span className="text-xs text-gray-400">-</span>;

        const date = dayjs(dateValue);
        if (!date.isValid()) return <span className="text-xs text-gray-400">-</span>;

        const isFuture = date.isAfter(dayjs());

        return (
          <div className="flex flex-col">
            {/* <span className={`text-[10px] font-bold uppercase tracking-tight ${isFuture ? 'text-blue-600' : 'text-gray-400'}`}>
                            {isFuture ? 'Scheduled' : 'Sent'}
                        </span> */}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(dateValue)}
              <br />
              {formatTime(dateValue)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewNotification(row);
            }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {!(row.isRead || row.is_read) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsReadLocal(row.id);
              }}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
              title="Mark as Read"
            >
              <Check size={16} />
            </button>
          )}
        </div>
      ),
      className: 'w-24',
    },
  ];

  const handleViewNotification = (row) => {
    // Mark as read first
    const isRead =
      row.is_read ||
      row.isRead ||
      (row.readBy && Array.isArray(row.readBy) && row.readBy.includes(user?.id));
    if (!isRead) {
      handleMarkAsReadLocal(row.id);
    }

    // Show Swal Modal
    Swal.fire({
      title: row.title,
      html: `
                <div class="text-left space-y-4">
                    <div class="flex items-center justify-between border-b pb-2">
                         <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-2 py-0.5 rounded border border-gray-200">
                             ${row.type || 'System'}
                         </span>
                         <span class="text-xs text-gray-400">
                             ${formatDate(row.created_at || row.createdAt || row.scheduled_at || row.scheduledAt)} ${formatTime(row.created_at || row.createdAt || row.scheduled_at || row.scheduledAt)}
                             ${dayjs(row.scheduled_at || row.scheduledAt).isAfter(dayjs()) ? ' <span class="text-blue-600 font-bold">(Scheduled)</span>' : ''}
                         </span>
                    </div>
                    <div class="py-2">
                        <p class="text-sm text-gray-700 leading-relaxed font-medium">
                            ${row.message}
                        </p>
                    </div>
                </div>
            `,
      icon: 'info',
      confirmButtonText: 'Great, thanks!',
      confirmButtonColor: 'rgb(var(--color-primary))',
      width: '600px',
      customClass: {
        popup: 'rounded-2xl shadow-xl',
      },
    });
  };

  const handleRowClick = (row) => {
    const isRead = row.isRead || row.is_read;
    if (!isRead) {
      handleMarkAsReadLocal(row.id);
    }
  };

  const hasUnread = (userNotifications || []).some((n) => !(n.isRead || n.is_read));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl px-2  font-semibold text-[rgb(var(--color-text))]">Inbox</h2>

        {/* Filters as Tabs */}
        <div className="flex gap-2 p-1 bg-[rgb(var(--color-background))/0.3] border border-[rgb(var(--color-border))] rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-blue-400/15 text-blue-600 border border-blue-600/25 shadow-sm'
                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-blue-400/15 text-blue-600 border border-blue-600/25 shadow-sm'
                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))]'
            }`}
          >
            Unread
          </button>
          <div className="w-px bg-[rgb(var(--color-border))] mx-1 my-1"></div>
          <button
            onClick={() => handleMarkAllReadLocal()}
            disabled={!hasUnread}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all
                            ${
                              hasUnread
                                ? 'text-blue-600 hover:bg-blue-600/10 cursor-pointer'
                                : 'text-[rgb(var(--color-text-muted))/0.5] cursor-not-allowed font-medium'
                            }`}
          >
            <Check size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-[rgb(var(--color-primary))]" size={32} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          onRefresh={refreshNotifications}
          searchable
          searchKeys={['title', 'message', 'type', 'priority']}
          searchPlaceholder="Search notifications by title, message, or type..."
          pagination
          persistenceKey="dealer-notifications-list"
          itemsPerPage={preferences.items_per_page || 10}
          onRowClick={handleRowClick}
          highlightId={highlightId}
          emptyState={
            <div className="text-center py-12">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-300" size={32} />
              </div>
              <h3 className="text-gray-900 font-medium">No notifications found</h3>
              <p className="text-gray-500 text-sm mt-1">You&apos;re all caught up!</p>
            </div>
          }
        />
      )}
    </>
  );
}
