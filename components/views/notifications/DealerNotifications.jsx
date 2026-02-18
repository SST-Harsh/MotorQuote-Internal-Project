import {
  Bell,
  Check,
  Trash2,
  Filter,
  Search,
  Megaphone,
  Send,
  BadgeAlert,
  Loader2,
  Eye,
  Edit,
} from 'lucide-react';
import dayjs from 'dayjs';
import notificationService from '@/services/notificationService';
import DataTable from '@/components/common/DataTable';
import { useAuth } from '@/context/AuthContext';
import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate, formatTime } from '@/utils/i18n';
import Swal from 'sweetalert2';
import TabNavigation from '@/components/common/TabNavigation';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import PageHeader from '@/components/common/PageHeader';
import * as yup from 'yup';

// Validation Schema for Broadcast Form
const broadcastValidationSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must not exceed 500 characters'),
  type: yup.string().required('Type is required'),
  priority: yup
    .string()
    .required('Priority is required')
    .notOneOf(['select'], 'Please select a valid priority level'),
  targetAudience: yup.string().required('Target audience is required'),
  scheduledAt: yup
    .string()
    .nullable()
    .test('future-date', 'Scheduled date must be in the future', function (value) {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
  expiresAt: yup
    .string()
    .nullable()
    .test('after-scheduled', 'Expiry date must be after scheduled date', function (value) {
      const { scheduledAt } = this.parent;
      if (!value) return true;
      if (!scheduledAt) return true;
      return new Date(value) > new Date(scheduledAt);
    })
    .test('future-date', 'Expiry date must be in the future', function (value) {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
});

export default function DealerNotifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Notifications"
        subtitle="Manage alerts and communicate with your team."
        icon={<Bell size={24} />}
        gradient
      />

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { key: 'notifications', label: 'My Notifications', icon: Bell },
          { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
        ]}
      />

      {/* Content */}
      <div className=" p-4 sm:p-6 shadow-sm min-h-[500px] transition-all duration-300">
        {activeTab === 'notifications' ? (
          <NotificationList user={user} />
        ) : (
          <DealerBroadcastForm user={user} validationSchema={broadcastValidationSchema} />
        )}
      </div>
    </div>
  );
}

import { useNotifications } from '@/context/NotificationContext';

function NotificationList({ user }) {
  const { preferences } = usePreference();
  const { userNotifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState('all');

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
              <span className="p-1 rounded-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))]">
                <Check size={14} />
              </span>
            ) : (
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
        );
      },
      className: 'w-16 text-center',
    },
    {
      header: 'Notification',
      accessor: (row) => (
        <div>
          <p
            className={`text-sm ${!(row.isRead || row.is_read) ? 'font-bold text-[rgb(var(--color-text))]' : 'font-medium text-[rgb(var(--color-text-muted))]'}`}
          >
            {row.title}
          </p>
          <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5 line-clamp-2">
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
        blue: ['System', 'info'],
        green: ['success'],
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
            <span
              className={`text-[10px] font-bold uppercase tracking-tight ${isFuture ? 'text-blue-600' : 'text-gray-400'}`}
            >
              {isFuture ? '📅 Scheduled' : '✅ Sent'}
            </span>
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

        {/* Filters */}
        <div className="flex gap-2 p-1.5 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === 'unread'
                ? 'bg-[rgb(var(--color-primary))] text-white shadow-md'
                : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            Unread
          </button>
          <div className="w-px bg-[rgb(var(--color-border))] mx-1 my-1"></div>
          <button
            onClick={() => handleMarkAllReadLocal()}
            disabled={!hasUnread}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all
                            ${
                              hasUnread
                                ? 'text-blue-600 hover:bg-blue-50 cursor-pointer'
                                : 'text-gray-300 cursor-not-allowed opacity-50'
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
          searchable
          searchKeys={['title', 'message']}
          pagination
          itemsPerPage={preferences.items_per_page || 10}
          onRowClick={handleRowClick}
          emptyState={
            <div className="text-center py-12">
              <div className="w-16 h-16   flex items-center justify-center mx-auto mb-4">
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

function DealerBroadcastForm({ user, validationSchema }) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'select',
    targetUserId: '',
    expiresAt: '',
    scheduledAt: '',
  });
  const [staff, setStaff] = useState([]);
  const [sending, setSending] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const userService = (await import('@/services/userService')).default;
        // Use dealer-specific staff endpoint instead of global /users
        const res = await userService.getDealerStaff();

        let myStaff = [];
        if (Array.isArray(res)) {
          myStaff = res;
        } else if (res?.data && Array.isArray(res.data)) {
          myStaff = res.data;
        } else if (res?.staff && Array.isArray(res.staff)) {
          myStaff = res.staff;
        } else if (res?.users && Array.isArray(res.users)) {
          myStaff = res.users;
        }

        const adminRoles = ['super_admin', 'admin', 'dealer', 'dealer_manager'];
        const filteredStaff = myStaff.filter((user) => {
          const userRole = (user.role || user.role_name || '').toLowerCase();
          return !adminRoles.includes(userRole);
        });

        setStaff(filteredStaff);
      } catch (error) {
        console.error('Failed to load staff', error);
      }
    };
    if (user?.id) fetchStaff();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      await validationSchema.validate(
        {
          ...formData,
          type: 'announcement',
          targetAudience: formData.targetUserId || 'all',
        },
        { abortEarly: false }
      );

      setSending(true);
      const payload = {
        type: 'announcement',
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        scheduled_at: formData.scheduledAt ? dayjs(formData.scheduledAt).toISOString() : null,
        expires_at: formData.expiresAt ? dayjs(formData.expiresAt).toISOString() : null,
      };

      if (formData.targetUserId.startsWith('role:')) {
        payload.target_roles = [formData.targetUserId.replace('role:', '')];
      } else if (formData.targetUserId) {
        payload.target_user_ids = [formData.targetUserId];
      } else {
        payload.target_roles = ['all']; // Scoped by dealership level on backend
      }

      await notificationService.createAnnouncement(payload);
      Swal.fire({
        icon: 'success',
        title: 'Broadcast Sent',
        text: `Message sent to ${formData.targetUserId ? 'selected user/role' : 'all your staff'}.`,
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        targetUserId: '',
        expiresAt: '',
        scheduledAt: '',
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = err.message;
        });
        setValidationErrors(errors);
      } else {
        console.error('Broadcast failed', error);
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        Swal.fire({
          title: 'Broadcast Failed',
          html: `
                        <div class="text-left space-y-2 font-sans">
                            <p className="text-sm"><strong>Status:</strong> ${status || 'Unknown'}</p>
                            <p className="text-sm"><strong>Message:</strong> ${message}</p>
                            ${error.response?.data?.error ? `<p class="text-xs text-red-500 mt-2">${error.response.data.error}</p>` : ''}
                        </div>
                    `,
          icon: 'error',
          confirmButtonColor: 'rgb(var(--color-primary))',
        });
      }
    } finally {
      setSending(false);
    }
  };

  const priorityColors = {
    low: 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]',
    medium:
      'bg-[rgb(var(--color-info))]/10 text-[rgb(var(--color-info))] border border-[rgb(var(--color-info))]/20',
    high: 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning))]/20',
    urgent:
      'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))]/20 font-bold',
    critical: 'bg-[rgb(var(--color-error))] text-white font-bold',
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pt-4">
      {/* Preview Card */}
      {(formData.title || formData.message) && (
        <div className="bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase">
              Preview
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[formData.priority]}`}
            >
              {formData.priority}
            </span>
          </div>
          {formData.title && (
            <h4 className="font-bold text-[rgb(var(--color-text))]">{formData.title}</h4>
          )}
          {formData.message && (
            <p className="text-sm text-[rgb(var(--color-text-muted))]">{formData.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all"
          >
            <option value="select">Select Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>
          {validationErrors.priority && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.priority}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Target Audience
          </label>
          <select
            value={formData.targetUserId}
            onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
            className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all"
          >
            <option value="">🌐 All My Staff ({staff.length})</option>
            {[...new Set(staff.map((u) => u.role || u.role_name))].filter(Boolean).map((role) => {
              const displayName = role
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              const pluralSuffix =
                displayName.toLowerCase() === 'staff' || displayName.toLowerCase().endsWith('s')
                  ? ''
                  : 's';
              return (
                <option key={`role-${role}`} value={`role:${role.toLowerCase()}`}>
                  👥 All {displayName}
                  {pluralSuffix}
                </option>
              );
            })}
            {staff.map((u) => {
              const name =
                u.first_name && u.last_name
                  ? `${u.first_name} ${u.last_name}`
                  : u.name || u.email || 'Unknown User';
              return (
                <option key={u.id} value={u.id}>
                  👤 {name}
                </option>
              );
            })}
          </select>
          {validationErrors.targetAudience && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.targetAudience}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Scheduled At (Optional)
          </label>
          <CustomDateTimePicker
            value={formData.scheduledAt}
            onChange={(val) => setFormData({ ...formData, scheduledAt: val })}
          />
          <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
            Leave empty to send immediately.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
            Expires At (Optional)
          </label>
          <CustomDateTimePicker
            value={formData.expiresAt}
            onChange={(val) => setFormData({ ...formData, expiresAt: val })}
          />
          <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
            When this notification should be hidden.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-2.5 text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all"
          placeholder="e.g., Weekly Team Meeting"
          data-testid="broadcast-title-input"
        />
        {validationErrors.title && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
          Message *
        </label>
        <textarea
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-4 py-3 text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition-all resize-none"
          placeholder="Enter your message here..."
          data-testid="broadcast-message-textarea"
        />
        {validationErrors.message && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.message}</p>
        )}
        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-2">
          {formData.message.length} characters
        </p>
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="submit"
          disabled={sending}
          className="flex items-center justify-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-[rgb(var(--color-primary))]/20"
          data-testid="broadcast-submit-button"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Broadcast
            </>
          )}
        </button>
        {(formData.title || formData.message) && (
          <button
            type="button"
            onClick={() => setFormData({ ...formData, title: '', message: '' })}
            className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
