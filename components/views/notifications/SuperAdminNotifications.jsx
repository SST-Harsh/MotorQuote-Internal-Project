'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  Bell,
  Send,
  FileText,
  Megaphone,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  ChevronDown,
  Filter,
} from 'lucide-react';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import notificationService from '@/services/notificationService';
import roleService from '@/services/roleService';
import { useAuth } from '@/context/AuthContext';
import DataTable from '../../common/DataTable';
import { SkeletonTable, SkeletonCard } from '../../common/Skeleton';
import TabNavigation from '@/components/common/TabNavigation';
import CustomDateTimePicker from '../../common/CustomDateTimePicker';
import CustomSelect from '../../common/CustomSelect';
import PageHeader from '@/components/common/PageHeader';
import { useNotifications } from '@/context/NotificationContext';
import dayjs from 'dayjs';
import { formatDateTime } from '@/utils/i18n';
import { canViewNotifications, canCreateNotifications } from '@/utils/roleUtils';

// Helper to determine if a notification is read by a given user
function isNotificationRead(notification, userId) {
  if (!notification) return false;
  if (notification.isRead || notification.is_read) return true;
  const readers = notification.readBy ?? notification.read_by;
  if (!Array.isArray(readers) || userId == null) return false;
  return readers.some((id) => id?.toString() === userId?.toString());
}

export default function SuperAdminNotifications() {
  const { user } = useAuth();
  const pathname = usePathname();
  const NOTIF_TAB_KEY = 'super_admin_notif_active_tab';
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(NOTIF_TAB_KEY) || 'broadcast';
    }
    return 'broadcast';
  });
  const [broadcastPrefill, setBroadcastPrefill] = useState(null);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId');
  const canView = canViewNotifications(user);
  const canCreate = canCreateNotifications(user);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(NOTIF_TAB_KEY, activeTab);
    sessionStorage.setItem('app_last_path', pathname);
  }, [activeTab, pathname]);

  useEffect(() => {
    if (!canCreate && activeTab === 'broadcast') {
      setActiveTab('history');
    }
  }, [canCreate, activeTab]);

  useEffect(() => {
    if (highlightId) {
      setActiveTab('history');
    }
  }, [highlightId]);
  const tabs = [
    { key: 'broadcast', label: 'Broadcast', icon: Megaphone, disabled: !canCreate },
    { key: 'history', label: 'History', icon: Bell },
    { key: 'templates', label: 'Templates', icon: FileText, disabled: !canCreate },
  ].filter((tab) => !tab.disabled);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Notifications"
        subtitle="Manage system alerts, announcements, and templates."
        gradient
      />

      {/* Tabs */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />

      {/* Content */}
      <div className="p-4 sm:p-6 shadow-sm min-h-[500px] transition-all duration-300">
        {!canView ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[rgb(var(--color-surface))] rounded-2xl border border-[rgb(var(--color-error))/0.2]">
            <Bell size={48} className="text-[rgb(var(--color-error))] opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Access Denied</h3>
            <p className="text-[rgb(var(--color-text-muted))] text-sm">
              You don&apos;t have permission to view notifications.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'broadcast' && canCreate && (
              <BroadcastForm
                prefillData={broadcastPrefill}
                onClear={() => setBroadcastPrefill(null)}
              />
            )}
            {activeTab === 'history' && <NotificationHistory highlightId={highlightId} />}
            {activeTab === 'templates' && canCreate && (
              <TemplateManager
                onSend={(template) => {
                  setBroadcastPrefill(template);
                  setActiveTab('broadcast');
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

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
  type: yup
    .string()
    .required('Type is required')
    .oneOf(['announcement', 'alert'], 'Invalid notification type'),
  priority: yup
    .string()
    .required('Priority is required')
    .oneOf(['low', 'medium', 'high', 'urgent', 'critical'], 'Invalid priority level'),
  targetAudience: yup.string().required('Target audience is required'),
  scheduledAt: yup
    .string()
    .nullable()
    .test('future-date', 'Scheduled date must be in the future', function (value) {
      if (!value) return true; // Allow empty
      return new Date(value) > new Date();
    }),
  expiresAt: yup
    .string()
    .nullable()
    .test('after-scheduled', 'Expiry date must be after scheduled date', function (value) {
      const { scheduledAt } = this.parent;
      if (!value) return true; // Allow empty
      if (!scheduledAt) return true; // If no scheduled date, just check it's future
      return new Date(value) > new Date(scheduledAt);
    })
    .test('future-date', 'Expiry date must be in the future', function (value) {
      if (!value) return true;
      return new Date(value) > new Date();
    }),
});

// Validation Schema for Template Form
const templateValidationSchema = yup.object({
  name: yup
    .string()
    .required('Template name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters'),
  type: yup
    .string()
    .required('Type is required')
    .oneOf(['announcement', 'alert'], 'Invalid template type'),
  titleTemplate: yup
    .string()
    .required('Title template is required')
    .min(3, 'Title template must be at least 3 characters')
    .max(200, 'Title template must not exceed 200 characters'),
  messageTemplate: yup
    .string()
    .required('Message template is required')
    .min(10, 'Message template must be at least 10 characters')
    .max(1000, 'Message template must not exceed 1000 characters'),
  defaultPriority: yup
    .string()
    .required('Default priority is required')
    .oneOf(['low', 'medium', 'high', 'urgent', 'critical'], 'Invalid priority level'),
  defaultTargetAudience: yup.string().required('Default target audience is required'),
});

function BroadcastForm({ prefillData, onClear }) {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    message: '',
    priority: '',
    targetAudience: '',
    expiresAt: '',
    scheduledAt: '',
  });
  const [sending, setSending] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  // Apply prefill data when it changes
  useEffect(() => {
    if (prefillData) {
      const rawType = prefillData.type || 'announcement';
      // Map template-only types (e.g. 'system') to valid broadcast types
      const broadcastType = ['announcement', 'alert'].includes(rawType) ? rawType : 'announcement';
      setFormData((prev) => ({
        ...prev,
        title: prefillData.title_template || prefillData.titleTemplate || '',
        message: prefillData.message_template || prefillData.messageTemplate || '',
        type: broadcastType,
        priority: prefillData.default_priority || prefillData.defaultPriority || 'medium',
        targetAudience:
          prefillData.default_target_audience || prefillData.defaultTargetAudience || 'all',
      }));
      // Clear prefill after applying
      if (onClear) onClear();
    }
  }, [prefillData, onClear]);

  // Real-time validation function
  const validateField = async (name, value) => {
    try {
      await yup.reach(broadcastValidationSchema, name).validate(value);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } catch (err) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: err.message,
      }));
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Only validate in real-time if there's already an error for this field
    // or if it's a field we want to validate immediately
    if (validationErrors[name] || name === 'title' || name === 'message') {
      validateField(name, value);
    }
  };

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await roleService.getAllRoles();
        let rolesList = [];
        if (Array.isArray(response)) rolesList = response;
        else if (response.roles && Array.isArray(response.roles)) rolesList = response.roles;
        else if (response.data && Array.isArray(response.data)) rolesList = response.data;
        else if (response.data && response.data.roles && Array.isArray(response.data.roles))
          rolesList = response.data.roles;

        setRoles(rolesList);
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Fallback to empty array if fetch fails
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    try {
      await broadcastValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const errors = {};
      err.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
      setValidationErrors(errors);
      return;
    }

    setSending(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        target_roles: formData.targetAudience === 'all' ? ['all'] : [formData.targetAudience],
        scheduled_at: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : null,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      if (formData.type === 'alert') {
        await notificationService.createBroadcast(payload);
      } else {
        await notificationService.createAnnouncement(payload);
      }

      Swal.fire({
        title: 'Success!',
        text: 'Notification has been broadcasted successfully.',
        icon: 'success',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });

      setFormData({ ...formData, title: '', message: '', expiresAt: '', scheduledAt: '' });
    } catch (error) {
      console.error('Broadcast Error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      Swal.fire({
        title: 'Broadcast Failed',
        html: `
                    <div class="text-left space-y-2">
                        <p><strong>Status:</strong> ${status || 'Unknown'}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        ${error.response?.data?.error ? `<p class="text-xs text-red-500 mt-2">${error.response.data.error}</p>` : ''}
                    </div>
                `,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
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
    <div className="w-full transition-all duration-300">
      {/* Form Container */}
      <div className="bg-transparent overflow-hidden">
        {/* Card Header - Minimalized */}
        <div className="pb-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[rgb(var(--color-primary))/0.1] flex items-center justify-center">
            <Megaphone size={20} className="text-[rgb(var(--color-primary))]" />
          </div>
          <div>
            <h3 className="font-bold text-[rgb(var(--color-text))]">Send Broadcast</h3>
            <p className="text-xs text-[rgb(var(--color-text-muted))]">
              Compose and send a notification to your audience
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pb-8 pl-2 pr-2 pt-4 space-y-8">
          {/* Live Preview */}
          {(formData.title || formData.message) && (
            <div className="bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-[rgb(var(--color-background))] border border-[rgb(var(--color-primary))]/20 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[rgb(var(--color-primary))] uppercase tracking-wider">
                  Live Preview
                </span>
                {formData.priority && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${priorityColors[formData.priority] || 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))]'}`}
                  >
                    {formData.priority}
                  </span>
                )}
              </div>
              {formData.title && (
                <h4 className="font-bold text-sm text-[rgb(var(--color-text))]">
                  {formData.title}
                </h4>
              )}
              {formData.message && (
                <p className="text-xs text-[rgb(var(--color-text-muted))] leading-relaxed">
                  {formData.message}
                </p>
              )}
            </div>
          )}
          {/* Config Row: Type | Priority | Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
                Type
              </label>
              <CustomSelect
                value={formData.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                options={[
                  { value: 'announcement', label: '📢 Announcement' },
                  { value: 'alert', label: '⚠️ System Alert' },
                ]}
                placeholder="Select Type"
                error={!!validationErrors.type}
              />
              {validationErrors.type && (
                <p className="text-red-500 text-[10px] mt-1 font-medium">{validationErrors.type}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
                Priority
              </label>
              <CustomSelect
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'critical', label: 'Critical' },
                ]}
                placeholder="Select Priority"
                error={!!validationErrors.priority}
              />
              {validationErrors.priority && (
                <p className="text-red-500 text-[10px] mt-1 font-medium">
                  {validationErrors.priority}
                </p>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
                Audience
              </label>
              <CustomSelect
                value={formData.targetAudience}
                onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                options={[
                  { value: 'all', label: '🌐 All Users' },
                  ...roles
                    .filter((role) => {
                      const roleKey = (role.name || role.key || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '');
                      return roleKey !== 'superadmin' && roleKey !== 'admin';
                    })
                    .map((role) => {
                      const roleName = role.name || role.key || `Role ${role.id}`;
                      const roleValue = (role.name || role.key || '').toLowerCase();
                      const displayName =
                        role.display_name ||
                        roleName
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                      return { value: roleValue, label: displayName };
                    }),
                ]}
                placeholder="Select Audience"
                isDisabled={loadingRoles}
                error={!!validationErrors.targetAudience}
              />
              {validationErrors.targetAudience && (
                <p className="text-red-500 text-[10px] mt-1 font-medium">
                  {validationErrors.targetAudience}
                </p>
              )}
            </div>
          </div>

          {/* Scheduled At — full width now that Expires At is removed */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2.5">
              Scheduled At{' '}
              <span className="text-[rgb(var(--color-text-muted))] font-normal text-xs ml-1">
                (Optional)
              </span>
            </label>
            <CustomDateTimePicker
              value={formData.scheduledAt}
              onChange={(val) => setFormData({ ...formData, scheduledAt: val })}
            />
            <p className="mt-1.5 text-xs text-[rgb(var(--color-text-muted))]">
              Leave empty to send immediately.
            </p>
          </div>
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g., System Maintenance Scheduled"
              className={`w-full h-12 px-4 bg-[rgb(var(--color-background))] border ${validationErrors.title ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5' : 'border-[rgb(var(--color-border))]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20 focus:border-[rgb(var(--color-primary))] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="broadcast-title-input"
            />
            {validationErrors.title && (
              <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.title}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-text))] mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              rows={6}
              value={formData.message}
              onChange={(e) => handleFieldChange('message', e.target.value)}
              placeholder="Enter your broadcast message here..."
              className={`w-full px-4 py-3 bg-[rgb(var(--color-background))] border ${validationErrors.message ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5' : 'border-[rgb(var(--color-border))]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/20 focus:border-[rgb(var(--color-primary))] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              data-testid="broadcast-message-textarea"
            ></textarea>
            {validationErrors.message && (
              <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.message}</p>
            )}
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1 text-right">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center gap-3 border-t border-[rgb(var(--color-border))]">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center justify-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-[rgb(var(--color-primary))]/20 text-sm"
              data-testid="broadcast-submit-button"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Broadcast
                </>
              )}
            </button>
            {(formData.title || formData.message) && (
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, title: '', message: '', scheduledAt: '' })
                }
                className="px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function NotificationHistory({ highlightId }) {
  const NOTIF_HISTORY_FILTER_KEY = 'super_admin_notif_history_filter';

  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isRefresh = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('app_last_path') === pathname;
  }, [pathname]);

  const [filter, setFilter] = useState(() => {
    if (typeof window !== 'undefined' && isRefresh) {
      return sessionStorage.getItem(NOTIF_HISTORY_FILTER_KEY) || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(NOTIF_HISTORY_FILTER_KEY, filter);
    sessionStorage.setItem('app_last_path', pathname);
  }, [filter, pathname]);

  const handleRemoveFilter = (key) => {
    if (key === 'status') setFilter('all');
  };

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAllNotifications();
      const extractData = (response, key) => {
        if (Array.isArray(response)) return response;
        if (key && Array.isArray(response[key])) return response[key];
        if (Array.isArray(response.data)) return response.data;
        if (response.data && key && Array.isArray(response.data[key])) return response.data[key];
        if (response.data && typeof response.data === 'object') {
          for (const k of Object.keys(response.data)) {
            if (Array.isArray(response.data[k])) return response.data[k];
          }
        }
        return [];
      };

      const list = extractData(res, 'notifications');
      const currentUserId = user?.id != null ? user.id.toString() : undefined;
      const filteredList = list.filter((n) => {
        if (!n) return false;
        const senderIdRaw =
          n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;

        // 1. Show notifications created by this user
        if (currentUserId != null && senderId === currentUserId) return true;

        // 2. Show notifications targeted to this specific user
        const targetUserIds = n.target_user_ids || n.targetUserIds;
        if (
          Array.isArray(targetUserIds) &&
          currentUserId != null &&
          targetUserIds.some((id) => id?.toString() === currentUserId)
        )
          return true;

        // 3. Show notifications targeted to super_admin or all
        const targetRoles = n.target_roles || n.targetRoles;
        if (Array.isArray(targetRoles) && targetRoles.length > 0) {
          const normalizedTargetRoles = targetRoles.map((r) =>
            r.toLowerCase().replace(/[_\s]/g, '')
          );
          if (normalizedTargetRoles.includes('superadmin') || normalizedTargetRoles.includes('all'))
            return true;
        }

        const rawTarget = n.target_audience || n.targetAudience || '';
        const target = (typeof rawTarget === 'string' ? rawTarget : String(rawTarget || ''))
          .toLowerCase()
          .replace(/[_\s]/g, '');
        if (target === 'superadmin' || target === 'all') return true;

        return false;
      });

      setNotifications(filteredList);
    } catch (error) {
      console.error('Error loading history:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load notification history',
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const { markAllAsRead: markAllAsReadContext, updateNotification: updateNotificationContext } =
    useNotifications();

  const handleMarkAllRead = async () => {
    try {
      // Identify unread notifications that are not sent by me
      const unreadItems = notifications.filter((n) => {
        const isRead = isNotificationRead(n, user?.id);

        const senderIdRaw =
          n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = user?.id != null && senderId === user.id.toString();

        return !isRead && !isSentByMe;
      });

      if (unreadItems.length === 0) return;

      // Force local update for immediate feedback (Optimistic)
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          isRead: true,
          read_by: n.read_by ? [...new Set([...n.read_by, user?.id])] : [user?.id],
          readBy: n.readBy ? [...new Set([...n.readBy, user?.id])] : [user?.id],
        }))
      );

      // 1. Call standard bulk mark-all-as-read (for personal notifications)
      await notificationService.markAllAsRead();

      // 2. For broadcasts in the history view that might not be captured by bulk mark-all-as-read,
      // we mark them individually if there are only a few.
      // If there are many, we still try to mark the first few to improve persistence.
      const itemsToMarkIndividually = unreadItems.slice(0, 10);
      await Promise.allSettled(
        itemsToMarkIndividually.map((item) => notificationService.markAsRead(item.id))
      );

      // Sync with global context
      if (markAllAsReadContext) {
        markAllAsReadContext();
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'All notifications marked as read',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to mark as read',
        showConfirmButton: false,
        timer: 2000,
      });
      loadHistory();
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-[rgb(var(--color-text))]">{row.title}</p>
          <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-1">{row.message}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      type: 'badge',
      accessor: 'type',
      config: {
        red: ['alert'],
        blue: ['announcement', 'system'],
      },
    },
    {
      header: 'Audience',
      accessor: (row) => {
        if (Array.isArray(row.target_roles) && row.target_roles.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_roles.join(', ')}
            </span>
          );
        }
        if (row.target_user_ids?.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_user_ids.length} Specific Users
            </span>
          );
        }
        if (row.target_dealerships?.length > 0) {
          return (
            <span className="text-[rgb(var(--color-text-muted))] capitalize">
              {row.target_dealerships.length} Dealerships
            </span>
          );
        }
        return (
          <span className="text-[rgb(var(--color-text-muted))] capitalize">
            {row.target_audience || 'All'}
          </span>
        );
      },
    },
    {
      header: 'Priority',
      type: 'badge',
      accessor: 'priority',
      config: {
        red: ['critical', 'urgent'],
        orange: ['high'],
        blue: ['medium'],
        gray: ['low'],
      },
    },
    {
      header: 'Sent / Scheduled At',
      accessor: (row) => {
        const dateValue = row.createdAt || row.created_at || row.scheduled_at || row.scheduledAt;
        if (!dateValue)
          return <span className="text-[rgb(var(--color-text-muted))] text-xs">-</span>;

        const date = dayjs(dateValue);
        if (!date.isValid())
          return <span className="text-[rgb(var(--color-text-muted))] text-xs">-</span>;

        const isFuture = date.isAfter(dayjs());

        return (
          <div className="flex flex-col">
            <span
              className={`text-xs ${isFuture ? 'text-blue-600 font-bold' : 'text-[rgb(var(--color-text-muted))]'}`}
            >
              {isFuture ? '📅 Scheduled' : '✅ Sent'}
            </span>
            <span className="text-[rgb(var(--color-text-muted))] text-[10px]">
              {date.format('MMM D, YYYY h:mm A')}
            </span>
          </div>
        );
      },
      className: 'w-40',
    },
    {
      header: 'Status',
      accessor: (row) => {
        const senderIdRaw =
          row.created_by ?? row.sender_id ?? row.senderId ?? row.sender?.id ?? row.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = user?.id != null && senderId === user.id.toString();
        const isScheduled =
          (row.scheduled_at || row.scheduledAt) &&
          dayjs(row.scheduled_at || row.scheduledAt).isAfter(dayjs());

        if (isSentByMe) {
          return (
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isScheduled ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20' : 'bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] border border-[rgb(var(--color-success))]/20'}`}
            >
              {isScheduled ? 'Scheduled' : 'Sent'}
            </span>
          );
        }

        const isRead = isNotificationRead(row, user?.id);

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
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const isRead = isNotificationRead(row, user?.id);
              const senderIdRaw =
                row.created_by ?? row.sender_id ?? row.senderId ?? row.sender?.id ?? row.creator_id;
              const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
              const isSentByMe = user?.id != null && senderId === user.id.toString();

              if (!isRead && !isSentByMe) {
                // Optimistically mark as read locally
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === row.id
                      ? {
                          ...n,
                          is_read: true,
                          isRead: true,
                          readBy: [...(n.readBy || []), user?.id],
                        }
                      : n
                  )
                );

                try {
                  await notificationService.markAsRead(row.id);
                  if (updateNotificationContext) {
                    updateNotificationContext(row.id, { isRead: true });
                  }
                } catch (error) {
                  console.warn('Failed to mark as read on server', error);
                }
              }

              Swal.fire({
                title: row.title,
                html: `
                                    <div class="text-left space-y-3">
                                        <div>
                                            <p class="text-xs font-bold text-gray-500 uppercase mb-1">Type</p>
                                            <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${row.type === 'alert' ? 'bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] border border-[rgb(var(--color-error))]/20' : 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20'}">${row.type}</span>
                                        </div>
                                        <div class="flex items-center gap-4">
                                            <div>
                                                <p class="text-xs font-bold text-gray-500 uppercase mb-1">Priority</p>
                                                <span class="px-2 py-0.5 rounded text-xs font-medium capitalize ${row.priority === 'critical' ? 'bg-[rgb(var(--color-error))] text-white' : row.priority === 'high' ? 'bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning))]/20' : row.priority === 'medium' ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] border border-[rgb(var(--color-primary))]/20' : 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]'}">${row.priority || 'medium'}</span>
                                            </div>
                                            <div>
                                                <p class="text-xs font-bold text-gray-500 uppercase mb-1">Sent At</p>
                                                <p class="text-xs text-gray-600">${new Date(row.created_at || row.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div class="pt-2 border-t mt-2">
                                            <p class="text-xs font-bold text-gray-500 uppercase mb-1">Message</p>
                                            <p class="text-sm text-gray-700 leading-relaxed">${row.message}</p>
                                        </div>
                                        <div class="mt-4">
                                            <p class="text-xs font-bold text-gray-500 uppercase mb-1">Target Audience</p>
                                            <p class="text-sm text-gray-700 capitalize">
                                                ${
                                                  Array.isArray(row.target_roles) &&
                                                  row.target_roles.length > 0
                                                    ? `Roles: ${row.target_roles.join(', ')}`
                                                    : Array.isArray(row.target_user_ids) &&
                                                        row.target_user_ids.length > 0
                                                      ? `${row.target_user_ids.length} Users`
                                                      : Array.isArray(row.target_dealerships) &&
                                                          row.target_dealerships.length > 0
                                                        ? `${row.target_dealerships.length} Dealerships`
                                                        : row.target_audience || 'All Users'
                                                }
                                            </p>
                                        </div>
                                        ${
                                          row.scheduled_at || row.scheduledAt
                                            ? `
                                            <div>
                                                <p class="text-xs font-bold text-gray-500 uppercase mb-1">
                                                    ${dayjs(row.scheduled_at || row.scheduledAt).isAfter(dayjs()) ? 'Scheduled For' : 'Sent At'}
                                                </p>
                                                <p class="text-sm text-gray-700">${formatDateTime(row.scheduled_at || row.scheduledAt)}</p>
                                            </div>
                                        `
                                            : ''
                                        }
                                    </div>
                                `,
                icon: 'info',
                confirmButtonText: 'Close',
                confirmButtonColor: 'rgb(var(--color-primary))',
                width: '600px',
              });
            }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={async () => {
              const { value: formValues } = await Swal.fire({
                title: 'Edit Notification',
                html: `
                                    <div class="text-left space-y-4">
                                        <div>
                                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                            <input id="swal-notif-title" class="swal2-input w-full m-0" value="${row.title}">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                                            <textarea id="swal-notif-message" class="swal2-textarea w-full m-0" rows="4">${row.message}</textarea>
                                        </div>
                                    </div>
                                `,
                showCancelButton: true,
                confirmButtonText: 'Save Changes',
                confirmButtonColor: 'rgb(var(--color-primary))',
                focusConfirm: false,
                preConfirm: () => {
                  return {
                    title: document.getElementById('swal-notif-title').value,
                    message: document.getElementById('swal-notif-message').value,
                  };
                },
              });

              if (formValues) {
                try {
                  await notificationService.updateNotification(row.id, formValues);
                  await loadHistory();
                  Swal.fire({
                    title: 'Updated!',
                    text: 'Notification has been updated.',
                    icon: 'success',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                } catch (error) {
                  Swal.fire({
                    title: 'Error',
                    text: 'Failed to update notification.',
                    icon: 'error',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                }
              }
            }}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Delete Notification?',
                text: 'This action cannot be undone!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: 'rgb(var(--color-primary))',
                confirmButtonText: 'Yes, delete it!',
              });
              if (result.isConfirmed) {
                try {
                  await notificationService.deleteNotification(row.id);
                  await loadHistory();
                  Swal.fire({
                    title: 'Deleted!',
                    text: 'Notification has been deleted.',
                    icon: 'success',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                } catch (error) {
                  Swal.fire({
                    title: 'Error',
                    text: 'Failed to delete notification.',
                    icon: 'error',
                    confirmButtonColor: 'rgb(var(--color-primary))',
                  });
                }
              }
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const filteredData = notifications.filter((n) => {
    const isRead = isNotificationRead(n, user?.id);
    const senderIdRaw = n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
    const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
    const isSentByMe = user?.id != null && senderId === user.id.toString();

    if (filter === 'unread') return !isRead && !isSentByMe;
    if (filter === 'read') return isRead;
    return true;
  });

  const hasUnread = notifications.some((n) => {
    const isRead = isNotificationRead(n, user?.id);
    const senderIdRaw = n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
    const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
    const isSentByMe = user?.id != null && senderId === user.id.toString();
    return !isRead && !isSentByMe;
  });

  if (loading)
    return (
      <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-6 overflow-hidden">
        <SkeletonTable rows={5} />
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl px-2 font-semibold text-[rgb(var(--color-text))]">Inbox</h2>

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
            onClick={() => handleMarkAllRead()}
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

      <DataTable
        columns={columns}
        data={filteredData}
        title="Broadcast History"
        onRefresh={loadHistory}
        searchable
        searchKeys={['title', 'message', 'type', 'priority']}
        searchPlaceholder="Search notifications by title, message, or type..."
        showClearFilter={false}
        highlightId={highlightId}
      />
    </div>
  );
}

function TemplateManager({ onSend }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getTemplates();
      const extractData = (response, key) => {
        if (Array.isArray(response)) return response;
        if (key && Array.isArray(response[key])) return response[key];
        if (Array.isArray(response.data)) return response.data;
        if (response.data && key && Array.isArray(response.data[key])) return response.data[key];
        if (response.data && typeof response.data === 'object') {
          for (const k of Object.keys(response.data)) {
            if (Array.isArray(response.data[k])) return response.data[k];
          }
        }
        return [];
      };

      const list = extractData(res, 'templates');
      setTemplates(list);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: 'rgb(var(--color-primary))',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await notificationService.deleteTemplate(id);
        await loadTemplates();
        Swal.fire({
          title: 'Deleted!',
          text: 'Template has been deleted.',
          icon: 'success',
          confirmButtonColor: 'rgb(var(--color-primary))',
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete template.',
          icon: 'error',
          confirmButtonColor: 'rgb(var(--color-primary))',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (viewMode === 'form') {
    return (
      <TemplateForm
        template={editingTemplate}
        onCancel={() => {
          setViewMode('list');
          setEditingTemplate(null);
        }}
        onSuccess={() => {
          setViewMode('list');
          setEditingTemplate(null);
          loadTemplates();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">Message Templates</h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))]">
            Create reusable notification templates
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setViewMode('form');
          }}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg shadow-[rgb(var(--color-primary))]/20"
          data-testid="new-template-button"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[rgb(var(--color-background))] flex items-center justify-center">
            <FileText size={32} className="text-[rgb(var(--color-text-muted))]" />
          </div>
          <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">No Templates Yet</h3>
          <p className="text-sm text-[rgb(var(--color-text-muted))] mb-6">
            Create your first template to get started
          </p>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setViewMode('form');
            }}
            className="inline-flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            <Plus size={18} /> Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, index) => (
            <div
              key={t.id}
              className="relative group bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl p-6 hover:shadow-lg hover:border-[rgb(var(--color-primary))]/30 transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`template-card-${t.id}`}
            >
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onSend && onSend(t)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Send from Template"
                >
                  <Send size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingTemplate(t);
                    setViewMode('form');
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Type Badge */}
              <div className="mb-4">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    t.type === 'alert'
                      ? 'bg-red-100 text-red-700'
                      : t.type === 'announcement'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {t.type}
                </span>
              </div>

              {/* Template Name */}
              <h4 className="font-bold text-[rgb(var(--color-text))] mb-3 pr-16">{t.name}</h4>

              {/* Title Template */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase block mb-1">
                  Title
                </label>
                <p className="text-xs font-mono text-[rgb(var(--color-text))] bg-[rgb(var(--color-surface))] p-2 rounded border border-[rgb(var(--color-border))] truncate">
                  {t.title_template || t.titleTemplate}
                </p>
              </div>

              {/* Message Template */}
              <div>
                <label className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] uppercase block mb-1">
                  Message
                </label>
                <p className="text-xs text-[rgb(var(--color-text-muted))] line-clamp-3 leading-relaxed">
                  {t.message_template || t.messageTemplate}
                </p>
              </div>

              {/* Footer Info */}
              {t.category && (
                <div className="mt-4 pt-4 border-t border-[rgb(var(--color-border))]">
                  <span className="text-[10px] text-[rgb(var(--color-text-muted))] capitalize">
                    {t.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ template, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    titleTemplate: '',
    messageTemplate: '',
    defaultPriority: '',
    defaultTargetAudience: '',
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [initialData, setInitialData] = useState(null);

  const isDirty = React.useMemo(() => {
    if (!template) return true; // Always dirty for new templates
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData, template]);

  useEffect(() => {
    if (template) {
      const rawType = template.type || 'announcement';
      const data = {
        name: template.name || '',
        type: ['announcement', 'alert'].includes(rawType) ? rawType : 'announcement',
        titleTemplate: template.title_template || template.titleTemplate || '',
        messageTemplate: template.message_template || template.messageTemplate || '',
        defaultPriority: template.default_priority || template.defaultPriority || 'medium',
        defaultTargetAudience:
          template.default_target_audience || template.defaultTargetAudience || 'all',
        isActive:
          template.is_active !== undefined
            ? template.is_active
            : template.isActive !== undefined
              ? template.isActive
              : true,
      };
      setFormData(data);
      setInitialData(JSON.parse(JSON.stringify(data)));
    } else {
      const data = {
        name: '',
        type: '',
        titleTemplate: '',
        messageTemplate: '',
        defaultPriority: '',
        defaultTargetAudience: '',
        isActive: true,
      };
      setFormData(data);
      setInitialData(null);
    }
  }, [template]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    try {
      await templateValidationSchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const errors = {};
      if (err.inner) {
        err.inner.forEach((error) => {
          errors[error.path] = error.message;
        });
      }
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const extractedVars = [];
      const regex = /{{([^}]+)}}/g;
      let match;
      const seen = new Set();

      const scan = (str) => {
        if (!str) return;
        while ((match = regex.exec(str)) !== null) {
          const varName = match[1].trim();
          if (!seen.has(varName)) {
            seen.add(varName);
            const existing = template?.variables?.find((v) => v.name === varName);
            extractedVars.push({
              name: varName,
              required: true,
              type: existing?.type || 'string',
              description: existing?.description || `Variable for ${varName}`,
            });
          }
        }
      };

      scan(formData.titleTemplate);
      scan(formData.messageTemplate);

      const payload = {
        name: formData.name,
        type: formData.type || 'announcement',
        title_template: formData.titleTemplate,
        message_template: formData.messageTemplate,
        default_priority: formData.defaultPriority || 'medium',
        default_target_audience: formData.defaultTargetAudience || 'all',
        is_active: formData.isActive !== undefined ? formData.isActive : true,
        variables: extractedVars.length > 0 ? extractedVars : [],
      };

      if (template && template.id) {
        await notificationService.updateTemplate(template.id, payload);
      } else {
        await notificationService.createTemplate(payload);
      }

      Swal.fire({
        title: 'Success!',
        text: 'Template saved successfully.',
        icon: 'success',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });

      onSuccess();
    } catch (error) {
      console.error('Template Save Error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      Swal.fire({
        title: 'Error Saving Template',
        html: `
                    <div class="text-left space-y-2">
                        <p><strong>Status:</strong> ${status || 'Unknown'}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        ${error.response?.data?.error ? `<p class="text-xs text-red-500 mt-2">${error.response.data.error}</p>` : ''}
                    </div>
                `,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[rgb(var(--color-surface))] overflow-hidden">
      {/* Form Header */}
      <div className="p-6 border-b border-[rgb(var(--color-border))] flex justify-between items-start bg-gradient-to-br from-[rgb(var(--color-primary))]/5 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            type="button"
            className="p-2 hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors border border-transparent hover:border-[rgb(var(--color-border))]"
            title="Back to List"
          >
            <ChevronLeft size={20} className="text-[rgb(var(--color-text-muted))]" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <FileText size={24} className="text-[rgb(var(--color-primary))]" />
              {template ? 'Edit Template' : 'Create Template'}
            </h3>
            <p className="text-sm text-[rgb(var(--color-text-muted))]">
              {template
                ? 'Update existing notification template'
                : 'Create a new notification template'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-6">
        <form id="templateForm" onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] pb-2">
                General Information
              </h4>
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                  Template Name *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all"
                  placeholder="e.g. Quote Approval"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-[10px] mt-1 font-medium">
                    {validationErrors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Configuration Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] pb-2">
                Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                    Type *
                  </label>
                  <CustomSelect
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    options={[
                      { value: 'announcement', label: '📢 Announcement' },
                      { value: 'alert', label: '⚠️ Alert' },
                    ]}
                    placeholder="Select Type"
                    error={!!validationErrors.type}
                  />
                  {validationErrors.type && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">
                      {validationErrors.type}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                    Priority
                  </label>
                  <CustomSelect
                    name="defaultPriority"
                    value={formData.defaultPriority}
                    onChange={handleChange}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'critical', label: 'Critical' },
                    ]}
                    placeholder="Select Priority"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                    Audience
                  </label>
                  <CustomSelect
                    name="defaultTargetAudience"
                    value={formData.defaultTargetAudience}
                    onChange={handleChange}
                    options={[
                      { value: 'all', label: '🌐 All Users' },
                      { value: 'dealer_manager', label: 'Dealer Managers' },
                      { value: 'seller', label: 'Sellers' },
                    ]}
                    placeholder="Select Audience"
                  />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-[rgb(var(--color-text))] border-b border-[rgb(var(--color-border))] pb-2">
                Message Content
              </h4>
              <div>
                <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                  Title Template *
                </label>
                <input
                  name="titleTemplate"
                  value={formData.titleTemplate}
                  onChange={handleChange}
                  className="w-full font-mono text-sm bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2.5 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all"
                  placeholder="Quote Status Update"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase mb-2">
                  Message Template *
                </label>
                <textarea
                  name="messageTemplate"
                  value={formData.messageTemplate}
                  onChange={handleChange}
                  rows={5}
                  className="w-full font-mono text-sm bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-3 text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-all resize-none"
                  placeholder="Hello , your quote has been..."
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Form Footer */}
      <div className="p-6 border-t border-[rgb(var(--color-border))] flex justify-end gap-3 bg-[rgb(var(--color-background))]/30">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white rounded-lg hover:bg-blue-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[rgb(var(--color-primary))]/20"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={16} />
              Save Template
            </>
          )}
        </button>
      </div>
    </div>
  );
}
